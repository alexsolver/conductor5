
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
}

export class AuditController {
  
  async getAuditHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const {
        entityType = 'item',
        entityId,
        page = 1,
        limit = 50,
        action,
        userId,
        startDate,
        endDate
      } = req.query;

      const { pool } = await import('../../../../db.js');
      
      let whereConditions = [`tenant_id = $1`];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (entityType) {
        whereConditions.push(`entity_type = $${paramIndex}`);
        params.push(entityType);
        paramIndex++;
      }

      if (entityId) {
        whereConditions.push(`entity_id = $${paramIndex}`);
        params.push(entityId);
        paramIndex++;
      }

      if (action) {
        whereConditions.push(`action = $${paramIndex}`);
        params.push(action);
        paramIndex++;
      }

      if (userId) {
        whereConditions.push(`user_id = $${paramIndex}`);
        params.push(userId);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        params.push(endDate);
        paramIndex++;
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email,
          CASE 
            WHEN al.entity_type = 'item' THEN i.name
            ELSE al.entity_id 
          END as entity_name
        FROM tenant_${tenantId.replace(/-/g, '_')}.audit_logs al
        LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.users u ON al.user_id = u.id
        LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.items i ON al.entity_type = 'item' AND al.entity_id = i.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(parseInt(limit as string), offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM tenant_${tenantId.replace(/-/g, '_')}.audit_logs al
        WHERE ${whereConditions.slice(0, -2).join(' AND ')}
      `;

      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });

    } catch (error) {
      console.error('Error fetching audit history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit history'
      });
    }
  }

  async getItemHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const { pool } = await import('../../../../db.js');
      
      const query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email,
          i.name as item_name
        FROM tenant_${tenantId.replace(/-/g, '_')}.audit_logs al
        LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.users u ON al.user_id = u.id
        LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.items i ON al.entity_id = i.id
        WHERE al.tenant_id = $1 
          AND al.entity_type = 'item' 
          AND al.entity_id = $2
        ORDER BY al.created_at DESC
      `;

      const result = await pool.query(query, [tenantId, id]);

      res.json({
        success: true,
        data: result.rows,
        message: `Found ${result.rows.length} audit entries`
      });

    } catch (error) {
      console.error('Error fetching item history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch item history'
      });
    }
  }

  async getAuditStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const { pool } = await import('../../../../db.js');
      
      const query = `
        SELECT 
          action,
          entity_type,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM tenant_${tenantId.replace(/-/g, '_')}.audit_logs
        WHERE tenant_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY action, entity_type, DATE(created_at)
        ORDER BY date DESC, count DESC
      `;

      const result = await pool.query(query, [tenantId]);

      // Summary stats
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_actions,
          COUNT(DISTINCT entity_id) as total_entities,
          COUNT(DISTINCT user_id) as total_users,
          MAX(created_at) as last_action
        FROM tenant_${tenantId.replace(/-/g, '_')}.audit_logs
        WHERE tenant_id = $1
      `;

      const summaryResult = await pool.query(summaryQuery, [tenantId]);

      res.json({
        success: true,
        data: {
          timeline: result.rows,
          summary: summaryResult.rows[0]
        }
      });

    } catch (error) {
      console.error('Error fetching audit stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit statistics'
      });
    }
  }
}
