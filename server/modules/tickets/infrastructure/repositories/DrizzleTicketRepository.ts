import { eq, and, sql, desc } from 'drizzle-orm';
import { PgDatabase } from 'drizzle-orm/pg-core';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { Ticket } from '../../domain/entities/Ticket';
import { tickets } from '../schemas/tickets';

export class DrizzleTicketRepository implements ITicketRepository {
  constructor(private db: PgDatabase<any>) {}

  // Implementation of ITicketRepository methods following AGENT_CODING_STANDARDS.md
  async save(ticket: Ticket): Promise<Ticket> {
    console.log('🎫 [DrizzleTicketRepository] Saving ticket - checking structure:', Object.keys(ticket));

    const ticketData = {
      id: ticket.id,
      tenant_id: ticket.tenantId,
      number: ticket.number,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority?.value || ticket.priority,
      status: ticket.status?.value || ticket.status,
      state: ticket.state?.value || ticket.state,
      caller_id: ticket.callerId,
      caller_type: ticket.callerType,
      beneficiary_id: ticket.beneficiaryId,
      beneficiary_type: ticket.beneficiaryType,
      assigned_to_id: ticket.assignedToId,
      created_by: ticket.createdBy,
      category: ticket.category,
      subcategory: ticket.subcategory,
      impact: ticket.impact,
      urgency: ticket.urgency,
      assignment_group: ticket.assignmentGroup,
      location: ticket.location,
      contact_type: ticket.contactType,
      business_impact: ticket.businessImpact,
      symptoms: ticket.symptoms,
      workaround: ticket.workaround,
      configuration_item: ticket.configurationItem,
      business_service: ticket.businessService,
      notify: ticket.notify
    };

    console.log('🎫 [DrizzleTicketRepository] Processed ticket data:', ticketData);
    
    const createdTicket = await this.create(ticketData.tenant_id, ticketData);
    return this.mapToEntity(createdTicket);
  }

  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const query = `
        SELECT t.*, 
               c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email,
               u.first_name as assigned_first_name, u.last_name as assigned_last_name
        FROM "${schemaName}".tickets t
        LEFT JOIN "${schemaName}".customers c ON c.id = t.caller_id
        LEFT JOIN public.users u ON u.id = t.assigned_to_id
        WHERE t.id = $1
      `;
      const result = await this.db.execute(sql.raw(query, id));
      if (!result || result.length === 0) return null;
      return this.mapToEntity(result[0]);
    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error finding ticket by ID:', error);
      return null;
    }
  }

  async findAll(tenantId: string, options?: any): Promise<Ticket[]> {
    return this.findByTenant(tenantId, options || {});
  }

  async update(id: string, data: Partial<Ticket>, tenantId: string): Promise<Ticket> {
    const tableName = `${tenantId}.tickets`;

    const [updatedTicket] = await this.db
      .update(tickets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(tickets.id, id),
        eq(tickets.tenantId, tenantId)
      ))
      .returning();

    if (!updatedTicket) {
      throw new Error(`Ticket with id ${id} not found or not updated in tenant ${tenantId}`);
    }

    return this.mapToEntity(updatedTicket);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const tableName = `${tenantId}.tickets`;

    const result = await this.db
      .delete(tickets)
      .where(and(
        eq(tickets.id, id),
        eq(tickets.tenantId, tenantId)
      ));

    return result.rowCount > 0;
  }

  async findByCallerAndType(callerId: string, callerType: 'user' | 'customer', tenantId: string): Promise<Ticket[]> {
    return this.findByTenant(tenantId, { callerId, callerType });
  }

  async findByBeneficiaryAndType(beneficiaryId: string, beneficiaryType: 'user' | 'customer', tenantId: string): Promise<Ticket[]> {
    return this.findByTenant(tenantId, { beneficiaryId, beneficiaryType });
  }

  async findByAssignedAgent(agentId: string, tenantId: string): Promise<Ticket[]> {
    return this.findByTenant(tenantId, { assignedToId: agentId });
  }

  async findAutoServiceTickets(tenantId: string): Promise<Ticket[]> {
    return this.findByTenant(tenantId, { serviceType: 'auto' });
  }

  async findProxyServiceTickets(tenantId: string): Promise<Ticket[]> {
    return this.findByTenant(tenantId, { serviceType: 'proxy' });
  }

  async findInternalServiceTickets(tenantId: string): Promise<Ticket[]> {
    return this.findByTenant(tenantId, { serviceType: 'internal' });
  }

  async findHybridServiceTickets(tenantId: string): Promise<Ticket[]> {
    return this.findByTenant(tenantId, { serviceType: 'hybrid' });
  }

  async countTotal(tenantId: string): Promise<number> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const query = `SELECT COUNT(*) as total FROM "${schemaName}".tickets WHERE tenant_id = $1`;
      const result = await this.db.execute(sql.raw(query, tenantId));
      return parseInt(result[0]?.total || '0');
    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error counting tickets:', error);
      return 0;
    }
  }

  async countByServiceType(tenantId: string): Promise<{autoService: number; proxyService: number; internalService: number; hybridService: number}> {
    const counts = await this.db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE service_type = 'auto') as autoService,
        COUNT(*) FILTER (WHERE service_type = 'proxy') as proxyService,
        COUNT(*) FILTER (WHERE service_type = 'internal') as internalService,
        COUNT(*) FILTER (WHERE service_type = 'hybrid') as hybridService
      FROM ${sql.identifier(`tenant_${tenantId.replace(/-/g, '_')}`)}.tickets
      WHERE tenant_id = ${tenantId}
    `);

    const result = counts[0] || { autoService: 0, proxyService: 0, internalService: 0, hybridService: 0 };
    return result;
  }

  async migrateExistingTickets(tenantId: string): Promise<{updated: number; errors: string[]}> {
    return { updated: 0, errors: [] };
  }

  async findByTenant(tenantId: string, filters: any = {}): Promise<Ticket[]> {
    try {
      console.log('🎫 [DrizzleTicketRepository] Finding tickets for tenant:', tenantId);

      let queryBuilder = this.db
        .select()
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId)
        ));

      if (filters.status) {
        queryBuilder = queryBuilder.where(eq(tickets.status, filters.status));
      }
      if (filters.priority) {
        queryBuilder = queryBuilder.where(eq(tickets.priority, filters.priority));
      }
      if (filters.assignedTo) {
        queryBuilder = queryBuilder.where(eq(tickets.assignedToId, filters.assignedTo));
      }
      if (filters.customerId) {
        queryBuilder = queryBuilder.where(eq(tickets.callerId, filters.customerId));
      }
      if (filters.ticketId) {
        queryBuilder = queryBuilder.where(eq(tickets.id, filters.ticketId));
      }
      if (filters.serviceType) {
        queryBuilder = queryBuilder.where(eq(tickets.serviceType, filters.serviceType));
      }

      if (filters.limit) {
        queryBuilder = queryBuilder.limit(filters.limit);
      }
      if (filters.offset) {
        queryBuilder = queryBuilder.offset(filters.offset);
      }

      queryBuilder = queryBuilder.orderBy(desc(tickets.createdAt));

      const dbResult = await queryBuilder;
      return dbResult.map(this.mapToEntity);

    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error finding tickets:', error);
      throw error;
    }
  }

  async findById(tenantId: string, ticketId: string): Promise<Ticket | null> {
    const tickets = await this.findByTenant(tenantId, { ticketId, limit: 1 });
    return tickets.length > 0 ? tickets[0] : null;
  }

  async findMany(tenantId: string, filters: any = {}): Promise<Ticket[]> {
    return this.findByTenant(tenantId, filters);
  }

  async create(tenantId: string, ticketData: any): Promise<any> {
    try {
      console.log('🎫 [DrizzleTicketRepository] Creating ticket for tenant:', tenantId);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const ticketNumber = await this.getNextTicketNumber(tenantId);

      const result = await this.db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.tickets (
          id, tenant_id, number, subject, description, priority, urgency,
          status, state, category, subcategory, caller_id, beneficiary_id,
          assigned_to_id, company_id, location, symptoms,
          business_impact, workaround, created_at, updated_at, notify, service_type
        ) VALUES (
          ${ticketData.id || sql.raw('gen_random_uuid()')}, 
          ${tenantId},
          ${ticketNumber}, 
          ${ticketData.subject || ''}, 
          ${ticketData.description || ''}, 
          ${ticketData.priority || 'medium'}, 
          ${ticketData.urgency || 'medium'},
          ${ticketData.status || 'new'}, 
          ${ticketData.state || 'open'},
          ${ticketData.category || null}, 
          ${ticketData.subcategory || null}, 
          ${ticketData.caller_id || null}, 
          ${ticketData.beneficiary_id || null},
          ${ticketData.assigned_to_id || null}, 
          ${ticketData.company_id || null}, 
          ${ticketData.location || null}, 
          ${ticketData.symptoms || null},
          ${ticketData.business_impact || null}, 
          ${ticketData.workaround || null}, 
          NOW(), 
          NOW(),
          ${ticketData.notify || false},
          ${ticketData.serviceType || 'internal'}
        ) RETURNING *
      `);

      console.log('🎫 [DrizzleTicketRepository] Raw result:', result);

      const ticketRow = Array.isArray(result) ? result[0] : result.rows?.[0];

      if (!ticketRow) {
        throw new Error('Failed to create ticket - no result returned');
      }

      console.log('🎫 [DrizzleTicketRepository] Ticket created:', ticketRow);
      return ticketRow;

    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error creating ticket:', error);
      throw error;
    }
  }

  async getNextTicketNumber(tenantId: string, prefix: string = 'TK'): Promise<string> {
    try {
      console.log('🎫 [DrizzleTicketRepository] Generating ticket number for tenant:', tenantId);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const result = await this.db.execute(sql`
        SELECT number FROM ${sql.identifier(schemaName)}.tickets
        WHERE tenant_id = ${tenantId} AND number LIKE ${`${prefix}-%`}
        ORDER BY number DESC
        LIMIT 1
      `);

      let nextNumber = 1;
      if (result.length > 0 && result[0].number) {
        const lastNumber = result[0].number;
        const numericPart = parseInt(lastNumber.split('-').pop() || '0') || 0;
        nextNumber = numericPart + 1;
      }

      const ticketNumber = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
      console.log('🎫 [DrizzleTicketRepository] Generated ticket number:', ticketNumber);

      return ticketNumber;
    } catch (error) {
      console.error('🎫 [DrizzleTicketRepository] Error generating ticket number:', error);
      // Fallback to timestamp-based number if query fails
      return `${prefix}-${Date.now().toString().slice(-6)}`;
    }
  }

  async findByStatus(status: string, tenantId: string): Promise<Ticket[]> {
    const results = await this.db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.status, status),
        eq(tickets.tenantId, tenantId)
      ))
      .orderBy(desc(tickets.createdAt));

    return results.map(this.mapToEntity);
  }

  async findByAssignee(assigneeId: string, tenantId: string): Promise<Ticket[]> {
    const results = await this.db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.assignedToId, assigneeId),
        eq(tickets.tenantId, tenantId)
      ))
      .orderBy(desc(tickets.createdAt));

    return results.map(this.mapToEntity);
  }

  private mapToEntity(row: any): Ticket {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      number: row.number,
      subject: row.subject,
      description: row.description,
      priority: { value: row.priority, label: row.priority },
      status: { value: row.status, label: row.status },
      state: { value: row.state, label: row.state },
      callerId: row.caller_id,
      callerType: row.caller_type,
      beneficiaryId: row.beneficiary_id,
      beneficiaryType: row.beneficiary_type,
      assignedToId: row.assigned_to_id,
      createdBy: row.created_by,
      category: row.category,
      subcategory: row.subcategory,
      impact: row.impact,
      urgency: row.urgency,
      assignmentGroup: row.assignment_group,
      location: row.location,
      contactType: row.contact_type,
      businessImpact: row.business_impact,
      symptoms: row.symptoms,
      workaround: row.workaround,
      configurationItem: row.configuration_item,
      businessService: row.business_service,
      notify: row.notify,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
      closedAt: row.closed_at ? new Date(row.closed_at) : null,
      // Joined data
      customerName: row.customer_first_name && row.customer_last_name
        ? `${row.customer_first_name} ${row.customer_last_name}`.trim()
        : null,
      customerEmail: row.customer_email,
      assignedToName: row.assigned_first_name && row.assigned_last_name
        ? `${row.assigned_first_name} ${row.assigned_last_name}`.trim()
        : null
    };
  }
}