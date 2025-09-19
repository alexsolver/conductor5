import { Request, Response } from "express";
import { pool } from "../../db";

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    id: string;
    role: string;
    roles: string[];
    email?: string;
  };
}

export class TicketHistoryController {
  // Buscar histórico completo de um ticket
  static async getTicketHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: "Tenant ID é obrigatório" });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const query = `
        SELECT 
          th.id,
          th.ticket_id,
          th.action_type,
          th.field_name,
          th.old_value,
          th.new_value,
          th.performed_by,
          th.performed_by_name,
          th.ip_address,
          th.user_agent,
          th.session_id,
          th.description,
          th.metadata,
          th.created_at,
          CASE 
            WHEN th.ip_address IS NOT NULL AND th.ip_address != '' THEN true
            ELSE false
          END as has_ip_data,
          CASE 
            WHEN th.session_id IS NOT NULL AND th.session_id != '' THEN true
            ELSE false
          END as has_session_data
        FROM ${schemaName}.ticket_history th
        WHERE th.ticket_id = $1 AND th.tenant_id = $2
        ORDER BY th.created_at DESC
      `;

      const result = await pool.query(query, [ticketId, tenantId]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error("Erro ao buscar histórico do ticket:", error);
      res.status(500).json({ 
        success: false, 
        error: "Erro interno do servidor" 
      });
    }
  }

  // Buscar tickets de um cliente específico
  static async getCustomerTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: "Tenant ID é obrigatório" });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const query = `
        SELECT 
          t.id,
          t.subject,
          t.status,
          t.priority,
          t.category,
          t.created_at,
          t.updated_at,
          t.resolved_at,
          t.assigned_to_id,
          u.first_name || ' ' || u.last_name as assigned_to_name,
          CASE 
            WHEN t.resolved_at IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600
            ELSE NULL
          END as resolution_hours
        FROM ${schemaName}.tickets t
        LEFT JOIN ${schemaName}.users u ON t.assigned_to_id = u.id
        WHERE t.caller_id = $1 AND t.tenant_id = $2
        ORDER BY t.created_at DESC
        LIMIT 20
      `;

      const result = await pool.query(query, [customerId, tenantId]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error("Erro ao buscar tickets do cliente:", error);
      res.status(500).json({ 
        success: false, 
        error: "Erro interno do servidor" 
      });
    }
  }

  // Buscar estatísticas de um cliente
  static async getCustomerStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: "Tenant ID é obrigatório" });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Query para estatísticas básicas
      const statsQuery = `
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) as resolved_tickets,
          AVG(CASE 
            WHEN resolved_at IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (resolved_at - created_at))/3600
            ELSE NULL
          END) as avg_resolution_hours,
          MIN(created_at) as first_ticket_date,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
          COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_priority_count
        FROM ${schemaName}.tickets 
        WHERE caller_id = $1 AND tenant_id = $2
      `;

      // Query para análise de padrões
      const patternsQuery = `
        SELECT 
          category,
          COUNT(*) as count,
          EXTRACT(HOUR FROM created_at) as hour_created,
          contact_type
        FROM ${schemaName}.tickets 
        WHERE caller_id = $1 AND tenant_id = $2
        GROUP BY category, EXTRACT(HOUR FROM created_at), contact_type
      `;

      const [statsResult, patternsResult] = await Promise.all([
        pool.query(statsQuery, [customerId, tenantId]),
        pool.query(patternsQuery, [customerId, tenantId])
      ]);

      const stats = statsResult.rows[0];
      const patterns = patternsResult.rows;

      // Calcular taxa de resolução
      const resolutionRate = stats.total_tickets > 0 
        ? (stats.resolved_tickets / stats.total_tickets * 100).toFixed(1)
        : 0;

      // Analisar padrões de horário
      const hourCounts = patterns.reduce((acc, row) => {
        const hour = parseInt(row.hour_created);
        acc[hour] = (acc[hour] || 0) + parseInt(row.count);
        return acc;
      }, {});

      const mostCommonHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      // Analisar categorias mais frequentes
      const categoryCounts = patterns.reduce((acc, row) => {
        if (row.category) {
          acc[row.category] = (acc[row.category] || 0) + parseInt(row.count);
        }
        return acc;
      }, {});

      const mostCommonCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      // Analisar canal preferido
      const contactCounts = patterns.reduce((acc, row) => {
        if (row.contact_type) {
          acc[row.contact_type] = (acc[row.contact_type] || 0) + parseInt(row.count);
        }
        return acc;
      }, {});

      const preferredContact = Object.entries(contactCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      res.json({
        success: true,
        data: {
          totalTickets: parseInt(stats.total_tickets),
          resolvedTickets: parseInt(stats.resolved_tickets),
          resolutionRate: parseFloat(resolutionRate.toString()),
          avgResolutionHours: stats.avg_resolution_hours ? parseFloat(stats.avg_resolution_hours).toFixed(1) : null,
          firstTicketDate: stats.first_ticket_date,
          highPriorityCount: parseInt(stats.high_priority_count),
          criticalPriorityCount: parseInt(stats.critical_priority_count),
          patterns: {
            mostCommonHour: mostCommonHour ? {
              hour: parseInt(mostCommonHour[0]),
              hourFormatted: `${mostCommonHour[0]}h-${parseInt(mostCommonHour[0]) + 1}h`,
              count: mostCommonHour[1]
            } : null,
            mostCommonCategory: mostCommonCategory ? {
              category: mostCommonCategory[0],
              count: mostCommonCategory[1]
            } : null,
            preferredContact: preferredContact ? {
              type: preferredContact[0],
              percentage: Math.round((preferredContact[1] as number) / stats.total_tickets * 100)
            } : null
          }
        }
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas do cliente:", error);
      res.status(500).json({ 
        success: false, 
        error: "Erro interno do servidor" 
      });
    }
  }
}