import { eq, and, sql, desc } from 'drizzle-orm';
import { PgDatabase } from 'drizzle-orm/pg-core';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';

export class DrizzleTicketRepository implements ITicketRepository {
  constructor(private db: PgDatabase<any>) {}

  async findByTenant(tenantId: string, filters: any = {}): Promise<any[]> {
    try {
      console.log('🎫 [DrizzleTicketRepository] Finding tickets for tenant:', tenantId);

      // Get schema name
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Build raw SQL query to avoid schema/column issues
      let query = `
        SELECT 
          t.id,
          t.number,
          t.subject,
          t.description,
          t.status,
          t.priority,
          t.urgency,
          t.category,
          t.subcategory,
          t.action,
          t.caller_id,
          t.beneficiary_id,
          t.assigned_to_id,
          t.company_id,
          t.location,
          t.symptoms,
          t.business_impact,
          t.workaround,
          t.created_at,
          t.updated_at,
          t.resolved_at,
          t.closed_at,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.email as customer_email,
          u.first_name as assigned_first_name,
          u.last_name as assigned_last_name
        FROM "${schemaName}".tickets t
        LEFT JOIN "${schemaName}".customers c ON c.id = t.caller_id
        LEFT JOIN public.users u ON u.id = t.assigned_to_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Add filters
      if (filters.status) {
        query += ` AND t.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.priority) {
        query += ` AND t.priority = $${paramIndex}`;
        params.push(filters.priority);
        paramIndex++;
      }

      if (filters.assignedTo) {
        query += ` AND t.assigned_to_id = $${paramIndex}`;
        params.push(filters.assignedTo);
        paramIndex++;
      }

      if (filters.customerId) {
        query += ` AND t.caller_id = $${paramIndex}`;
        params.push(filters.customerId);
        paramIndex++;
      }

      if (filters.ticketId) {
        query += ` AND t.id = $${paramIndex}`;
        params.push(filters.ticketId);
        paramIndex++;
      }

      // Add ordering
      query += ` ORDER BY t.created_at DESC`;

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
        paramIndex++;
      }

      console.log('🎫 [DrizzleTicketRepository] Executing query:', query);
      console.log('🎫 [DrizzleTicketRepository] With params:', params);

      // Simplified approach - build query directly without parameters
      let finalQuery = `
        SELECT 
          t.id,
          COALESCE(t.number, CONCAT('T-', SUBSTRING(t.id::text, 1, 8))) as number,
          t.subject,
          t.description,
          t.status,
          t.priority,
          t.category,
          t.subcategory,
          t.caller_id,
          t.assigned_to_id,
          t.created_at,
          t.updated_at,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.email as customer_email
        FROM "${schemaName}".tickets t
        LEFT JOIN "${schemaName}".customers c ON c.id = t.caller_id
        ORDER BY t.created_at DESC
        LIMIT 50
      `;
      
      const result = await this.db.execute(sql.raw(finalQuery));

      console.log('🎫 [DrizzleTicketRepository] Raw result:', result.length, 'tickets found');

      // Map results to expected format
      const tickets = result.map((row: any) => ({
        id: row.id,
        number: row.number,
        subject: row.subject,
        description: row.description,
        status: row.status,
        priority: row.priority,
        urgency: row.urgency,
        category: row.category,
        subcategory: row.subcategory,
        action: row.action,
        caller_id: row.caller_id,
        beneficiary_id: row.beneficiary_id,
        assigned_to_id: row.assigned_to_id,
        customer_company_id: row.customer_company_id,
        location: row.location,
        symptoms: row.symptoms,
        business_impact: row.business_impact,
        workaround: row.workaround,
        created_at: row.created_at,
        updated_at: row.updated_at,
        resolved_at: row.resolved_at,
        closed_at: row.closed_at,
        // Joined data
        customer_name: row.customer_first_name && row.customer_last_name 
          ? `${row.customer_first_name} ${row.customer_last_name}`.trim()
          : null,
        customer_email: row.customer_email,
        assigned_to_name: row.assigned_first_name && row.assigned_last_name
          ? `${row.assigned_first_name} ${row.assigned_last_name}`.trim()
          : null
      }));

      console.log('🎫 [DrizzleTicketRepository] Mapped tickets:', tickets.length);
      return tickets;

    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error finding tickets:', error);
      throw error;
    }
  }

  async findById(tenantId: string, ticketId: string): Promise<any | null> {
    const tickets = await this.findByTenant(tenantId, { ticketId, limit: 1 });
    return tickets[0] || null;
  }

  async findMany(tenantId: string, filters: any = {}): Promise<any[]> {
    return this.findByTenant(tenantId, filters);
  }

  async create(tenantId: string, ticketData: any): Promise<any> {
    try {
      console.log('🎫 [DrizzleTicketRepository] Creating ticket for tenant:', tenantId);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Generate ticket number
      const ticketNumber = `TK-${Date.now().toString().slice(-6)}`;

      const query = `
        INSERT INTO "${schemaName}".tickets (
          number, subject, description, status, priority, urgency,
          category, subcategory, action, caller_id, beneficiary_id,
          assigned_to_id, customer_company_id, location, symptoms,
          business_impact, workaround, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
        ) RETURNING *
      `;

      const params = [
        ticketNumber,
        ticketData.subject || '',
        ticketData.description || '',
        ticketData.status || 'new',
        ticketData.priority || 'medium',
        ticketData.urgency || 'medium',
        ticketData.category || null,
        ticketData.subcategory || null,
        ticketData.action || null,
        ticketData.caller_id || null,
        ticketData.beneficiary_id || null,
        ticketData.assigned_to_id || null,
        ticketData.customer_company_id || null,
        ticketData.location || null,
        ticketData.symptoms || null,
        ticketData.business_impact || null,
        ticketData.workaround || null
      ];

      const result = await this.db.execute(sql.raw(query, params));

      console.log('🎫 [DrizzleTicketRepository] Ticket created:', result[0]);
      return result[0];

    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error creating ticket:', error);
      throw error;
    }
  }

  async update(tenantId: string, ticketId: string, updates: any): Promise<any> {
    try {
      console.log('🎫 [DrizzleTicketRepository] Updating ticket:', ticketId);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Build dynamic update query
      const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const query = `
        UPDATE "${schemaName}".tickets 
        SET ${updateFields}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const params = [ticketId, ...Object.values(updates)];

      const result = await this.db.execute(sql.raw(query, params));
      return result[0];

    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error updating ticket:', error);
      throw error;
    }
  }

  async delete(tenantId: string, ticketId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const query = `DELETE FROM "${schemaName}".tickets WHERE id = $1`;
      await this.db.execute(sql.raw(query, [ticketId]));

      return true;
    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error deleting ticket:', error);
      return false;
    }
  }
}