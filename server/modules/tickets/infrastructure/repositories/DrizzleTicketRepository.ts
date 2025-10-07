/**
 * INFRASTRUCTURE LAYER - DRIZZLE TICKET REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull, ne, ilike, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { tickets } from '@shared/schema';
import { Ticket } from '../../domain/entities/Ticket';
import {
  ITicketRepository,
  TicketFilters,
  PaginationOptions,
  TicketListResult
} from '../../domain/repositories/ITicketRepository';
import { Logger } from '../../domain/services/Logger';

export class DrizzleTicketRepository implements ITicketRepository {
  constructor(private logger: Logger) {}

  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToTicket(result.rows[0]) : null;
    } catch (error) {
      this.logger.error('Failed to find ticket by ID', { error: (error as Error).message, id, tenantId });
      throw error;
    }
  }

  async findByNumber(number: string, tenantId: string): Promise<Ticket | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE number = ${number} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToTicket(result.rows[0]) : null;
    } catch (error) {
      this.logger.error('Failed to find ticket by number', { error: (error as Error).message, number, tenantId });
      throw error;
    }
  }

  // ✅ 1QA.MD: Create ticket using tenant schema
  async create(ticket: Ticket, tenantId: string): Promise<Ticket> {
    try {
      console.log('🎯 [DrizzleTicketRepository] Creating ticket with data:', { 
        ticket: { ...ticket, description: ticket.description?.substring(0, 100) + '...' },
        tenantId 
      });

      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Generate ticket number if not provided
      let ticketNumber = ticket.number;
      if (!ticketNumber) {
        const { ticketNumberGenerator } = await import('../../../utils/ticketNumberGenerator');
        ticketNumber = await ticketNumberGenerator.generateTicketNumber(tenantId, ticket.companyId || '00000000-0000-0000-0000-000000000001');
      }

      const insertData = {
        id: ticket.id,
        tenant_id: tenantId,
        number: ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        urgency: ticket.urgency || 'medium',
        impact: ticket.impact || 'medium',
        customer_id: ticket.customerId,
        beneficiary_id: ticket.beneficiaryId,
        assigned_to_id: ticket.assignedToId,
        company_id: ticket.companyId,
        category: ticket.category,
        subcategory: ticket.subcategory,
        action: ticket.action,
        tags: ticket.tags ? JSON.stringify(ticket.tags) : null,
        custom_fields: ticket.customFields ? JSON.stringify(ticket.customFields) : null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by_id: ticket.createdById,
        updated_by_id: ticket.updatedById || ticket.createdById,
        is_active: true
      };

      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(tenantSchema)}.tickets (
          tenant_id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id, assigned_to_id, company_id, beneficiary_id,
          is_active, created_at, updated_at
        )
        VALUES (
          ${tenantId}, ${ticketData.number}, ${ticketData.subject}, ${ticketData.description},
          ${ticketData.status}, ${ticketData.priority}, ${ticketData.urgency}, ${ticketData.impact},
          ${ticketData.category}, ${ticketData.subcategory}, ${ticketData.callerId},
          ${ticketData.assignedToId}, ${ticketData.companyId}, ${ticketData.beneficiaryId},
          ${ticketData.isActive !== false}, ${now}, ${now}
        )
        RETURNING 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
      `);

      return this.mapToTicket(result.rows[0] as any);
    } catch (error) {
      this.logger.error('Failed to create ticket', { error: (error as Error).message, tenantId });
      throw error;
    }
  }

  // ✅ 1QA.MD: Update ticket using tenant schema
  async update(id: string, updateData: Partial<Ticket>, tenantId: string): Promise<Ticket> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[TICKET-REPOSITORY-QA] Updating ticket for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        UPDATE ${sql.identifier(tenantSchema)}.tickets
        SET 
          number = COALESCE(${updateData.number}, number),
          subject = COALESCE(${updateData.subject}, subject),
          description = COALESCE(${updateData.description}, description),
          status = COALESCE(${updateData.status}, status),
          priority = COALESCE(${updateData.priority}, priority),
          urgency = COALESCE(${updateData.urgency}, urgency),
          impact = COALESCE(${updateData.impact}, impact),
          category = COALESCE(${updateData.category}, category),
          subcategory = COALESCE(${updateData.subcategory}, subcategory),
          caller_id = COALESCE(${updateData.callerId}, caller_id),
          assigned_to_id = COALESCE(${updateData.assignedToId}, assigned_to_id),
          company_id = COALESCE(${updateData.companyId}, company_id),
          beneficiary_id = COALESCE(${updateData.beneficiaryId}, beneficiary_id),
          is_active = COALESCE(${updateData.isActive}, is_active),
          updated_at = ${now}
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
      `);

      if (!result.rows[0]) {
        throw new Error('Ticket not found');
      }

      return this.mapToTicket(result.rows[0] as any);
    } catch (error) {
      this.logger.error('Failed to update ticket', { error: (error as Error).message, id, tenantId });
      throw error;
    }
  }

  // ✅ 1QA.MD: Delete ticket using tenant schema
  async delete(id: string, tenantId: string): Promise<void> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[TICKET-REPOSITORY-QA] Deleting ticket for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        UPDATE ${sql.identifier(tenantSchema)}.tickets
        SET is_active = false, updated_at = ${now}
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);

      if (result.rowCount === 0) {
        throw new Error('Ticket not found');
      }
    } catch (error) {
      this.logger.error('Failed to delete ticket', { error: (error as Error).message, id, tenantId });
      throw error;
    }
  }

  // ✅ CLEAN ARCHITECTURE - Main implementation method with RAW SQL
  async findByFilters(
    filters: TicketFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<TicketListResult> {
    console.log('🔍 [DrizzleTicketRepository] findByFilters called with:', {
      filters,
      pagination,
      tenantId
    });

    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const offset = (pagination.page - 1) * pagination.limit;

      // Build WHERE conditions
      let whereClause = 'WHERE is_active = true';
      const whereParams: any[] = [];

      if (filters.status && filters.status.length > 0) {
        const statusPlaceholders = filters.status.map(() => '?').join(',');
        whereClause += ` AND status IN (${statusPlaceholders})`;
        whereParams.push(...filters.status);
      }

      if (filters.priority && filters.priority.length > 0) {
        const priorityPlaceholders = filters.priority.map(() => '?').join(',');
        whereClause += ` AND priority IN (${priorityPlaceholders})`;
        whereParams.push(...filters.priority);
      }

      if (filters.assignedToId) {
        whereClause += ` AND assigned_to_id = ?`;
        whereParams.push(filters.assignedToId);
      }

      if (filters.customerId) {
        whereClause += ` AND caller_id = ?`;
        whereParams.push(filters.customerId);
      }

      if (filters.companyId) {
        whereClause += ` AND company_id = ?`;
        whereParams.push(filters.companyId);
      }

      if (filters.category) {
        whereClause += ` AND category = ?`;
        whereParams.push(filters.category);
      }

      if (filters.search) {
        whereClause += ` AND (subject ILIKE ? OR description ILIKE ?)`;
        whereParams.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // Count total records using proper SQL template
      const countQuery = sql`
        SELECT COUNT(*) as total
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE is_active = true
      `;

      // Apply filters to count query
      const countConditions: any[] = [sql`is_active = true`];

      if (filters.status && filters.status.length > 0) {
        countConditions.push(sql`status = ANY(${filters.status})`);
      }
      if (filters.priority && filters.priority.length > 0) {
        countConditions.push(sql`priority = ANY(${filters.priority})`);
      }
      if (filters.assignedToId) {
        countConditions.push(sql`assigned_to_id = ${filters.assignedToId}`);
      }
      if (filters.customerId) {
        countConditions.push(sql`caller_id = ${filters.customerId}`);
      }
      if (filters.companyId) {
        countConditions.push(sql`company_id = ${filters.companyId}`);
      }
      if (filters.category) {
        countConditions.push(sql`category = ${filters.category}`);
      }
      if (filters.search) {
        countConditions.push(sql`(subject ILIKE ${`%${filters.search}%`} OR description ILIKE ${`%${filters.search}%`})`);
      }

      const finalCountQuery = sql`
        SELECT COUNT(*) as total
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE ${sql.join(countConditions, sql` AND `)}
      `;

      const countResult = await db.execute(finalCountQuery);
      const total = Number(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / pagination.limit);

      // Get paginated results using proper SQL template
      const dataConditions: any[] = [sql`is_active = true`];

      if (filters.status && filters.status.length > 0) {
        dataConditions.push(sql`status = ANY(${filters.status})`);
      }
      if (filters.priority && filters.priority.length > 0) {
        dataConditions.push(sql`priority = ANY(${filters.priority})`);
      }
      if (filters.assignedToId) {
        dataConditions.push(sql`assigned_to_id = ${filters.assignedToId}`);
      }
      if (filters.customerId) {
        dataConditions.push(sql`caller_id = ${filters.customerId}`);
      }
      if (filters.companyId) {
        dataConditions.push(sql`company_id = ${filters.companyId}`);
      }
      if (filters.category) {
        dataConditions.push(sql`category = ${filters.category}`);
      }
      if (filters.search) {
        dataConditions.push(sql`(subject ILIKE ${`%${filters.search}%`} OR description ILIKE ${`%${filters.search}%`})`);
      }

      const finalDataQuery = sql`
        SELECT 
          t.id, t.number, t.subject, t.description, t.status, t.priority, t.urgency, t.impact,
          t.category, t.subcategory, t.caller_id as "callerId", t.assigned_to_id as "assignedToId",
          t.tenant_id as "tenantId", t.created_at as "createdAt", t.updated_at as "updatedAt",
          t.company_id as "companyId", t.beneficiary_id as "beneficiaryId", t.is_active as "isActive",

          -- Company data for display
          c.name as "company_name",
          c.display_name as "company_display_name",

          -- Customer/Caller data for display  
          caller.first_name as "caller_first_name",
          caller.last_name as "caller_last_name",
          caller.email as "caller_email",
          CONCAT(caller.first_name, ' ', caller.last_name) as "caller_full_name",

          -- Category name for display
          cat.name as "category_name"

        FROM ${sql.identifier(schemaName)}.tickets t
        LEFT JOIN ${sql.identifier(schemaName)}.companies c ON t.company_id = c.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers caller ON t.caller_id = caller.id
        LEFT JOIN ${sql.identifier(schemaName)}.ticket_categories cat ON t.category = cat.id
        WHERE ${sql.join(dataConditions, sql` AND `)}
        ORDER BY t.created_at DESC
        LIMIT ${pagination.limit} OFFSET ${offset}
      `;

      const results = await db.execute(finalDataQuery);

      console.log('✅ [DrizzleTicketRepository] Query successful:', {
        total,
        page: pagination.page,
        totalPages,
        resultsCount: results.rows.length
      });

      return {
        tickets: results.rows.map(ticket => this.mapToTicket(ticket)),
        total,
        page: pagination.page,
        totalPages
      };
    } catch (error) {
      console.error('❌ [DrizzleTicketRepository] findByFilters error:', error);
      this.logger.error('Failed to find tickets with filters', {
        error: (error as Error).message,
        filters,
        pagination,
        tenantId
      });
      throw new Error(`Failed to find tickets with filters: ${(error as Error).message}`);
    }
  }

  // ✅ CLEAN ARCHITECTURE - Alias method for backward compatibility
  async findWithFilters(
    filters: TicketFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<TicketListResult> {
    console.log('🔍 [DrizzleTicketRepository] findWithFilters called - delegating to findByFilters');
    return await this.findByFilters(filters, pagination, tenantId);
  }

  async findByTenant(tenantId: string): Promise<Ticket[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const results = await db.execute(sql`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE is_active = true
        ORDER BY created_at DESC
      `);

      return results.rows.map(ticket => this.mapToTicket(ticket));
    } catch (error) {
      this.logger.error('Failed to find tickets by tenant', { 
        error: (error as Error).message, 
        tenantId 
      });
      throw new Error(`Failed to find tickets by tenant: ${(error as Error).message}`);
    }
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<Ticket[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const results = await db.execute(sql`
      SELECT 
        id, number, subject, description, status, priority, urgency, impact,
        category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
        tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
        company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
      FROM ${sql.identifier(schemaName)}.tickets
      WHERE assigned_to_id = ${userId} AND tenant_id = ${tenantId} AND is_active = true
      ORDER BY created_at DESC
    `);

    return results.rows.map(ticket => this.mapToTicket(ticket));
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const results = await db.execute(sql`
      SELECT 
        id, number, subject, description, status, priority, urgency, impact,
        category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
        tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
        company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
      FROM ${sql.identifier(schemaName)}.tickets
      WHERE caller_id = ${customerId} AND tenant_id = ${tenantId} AND is_active = true
      ORDER BY created_at DESC
    `);

    return results.rows.map(ticket => this.mapToTicket(ticket));
  }

  async findByStatus(status: string, tenantId: string): Promise<Ticket[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const results = await db.execute(sql`
      SELECT 
        id, number, subject, description, status, priority, urgency, impact,
        category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
        tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
        company_id as "companyId", beneficiary_id as "beneficiaryId", is_active as "isActive"
      FROM ${sql.identifier(schemaName)}.tickets
      WHERE status = ${status} AND tenant_id = ${tenantId} AND is_active = true
      ORDER BY created_at DESC
    `);

    return results.rows.map(ticket => this.mapToTicket(ticket));
  }

  async countByFilters(filters: TicketFilters, tenantId: string): Promise<number> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const conditions: any[] = [sql`is_active = true`];

      if (filters.status && filters.status.length > 0) {
        conditions.push(sql`status = ANY(${filters.status})`);
      }
      if (filters.priority && filters.priority.length > 0) {
        conditions.push(sql`priority = ANY(${filters.priority})`);
      }
      if (filters.assignedToId) {
        conditions.push(sql`assigned_to_id = ${filters.assignedToId}`);
      }
      if (filters.customerId) {
        conditions.push(sql`caller_id = ${filters.customerId}`);
      }
      if (filters.companyId) {
        conditions.push(sql`company_id = ${filters.companyId}`);
      }
      if (filters.category) {
        conditions.push(sql`category = ${filters.category}`);
      }
      if (filters.search) {
        conditions.push(sql`(subject ILIKE ${`%${filters.search}%`} OR description ILIKE ${`%${filters.search}%`})`);
      }

      const query = sql`
        SELECT COUNT(*) as count
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE ${sql.join(conditions, sql` AND `)}
      `;

      const result = await db.execute(query);
      return Number(result.rows[0]?.count || 0);
    } catch (error) {
      this.logger.error('Failed to count tickets by filters', { error: (error as Error).message, filters, tenantId });
      return 0;
    }
  }

  async getStatistics(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdueCount: number;
    todayCount: number;
  }> {
    // Implementation for dashboard statistics
    const total = await this.countByFilters({}, tenantId);

    return {
      total,
      byStatus: {},
      byPriority: {},
      overdueCount: 0,
      todayCount: 0
    };
  }

  async findTicketsForEscalation(tenantId: string): Promise<Ticket[]> {
    // Implementation for escalation logic
    return [];
  }

  async updateLastActivity(id: string, tenantId: string): Promise<void> {
    await db.update(tickets)
      .set({ updatedAt: new Date() })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId)
        )
      );
  }

  // ✅ CLEAN ARCHITECTURE - Additional methods from interface
  async bulkUpdate(updates: Array<{ id: string; data: Partial<Ticket> }>, tenantId: string): Promise<void> {
    for (const update of updates) {
      await this.update(update.id, update.data, tenantId);
    }
  }

  async searchTickets(
    searchTerm: string, 
    tenantId: string, 
    pagination?: PaginationOptions
  ): Promise<TicketListResult> {
    const defaultPagination: PaginationOptions = {
      page: 1,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const paginationOptions = pagination || defaultPagination;

    return await this.findByFilters(
      { search: searchTerm },
      paginationOptions,
      tenantId
    );
  }

  // ✅ CLEAN ARCHITECTURE - Private mapping method
  private mapToTicket(row: any): Ticket {
    return {
      id: row.id || null,
      number: row.number || null,
      subject: row.subject || '',
      description: row.description || '',
      status: row.status || 'new',
      priority: row.priority || 'medium',
      urgency: row.urgency || 'medium',
      impact: row.impact || 'medium',
      category: row.category_name || row.category || null,
      subcategory: row.subcategory || null,
      action: row.action || null,
      callerId: row.callerId || null,
      assignedToId: row.assignedToId || null,
      tenantId: row.tenantId,
      createdAt: row.createdAt || new Date(),
      updatedAt: row.updatedAt || new Date(),
      createdById: row.createdById || null,
      updatedById: row.updatedById || null,
      companyId: row.companyId || null,
      isActive: row.isActive !== false,
      company_name: row.company_name || row.company_display_name || null,
      caller_name: row.caller_full_name || null
    } as Ticket;
  }
}