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
          t.id, t.number, t.subject, t.description, t.status, t.priority, t.urgency, t.impact,
          t.category, t.subcategory, t.caller_id as "callerId", t.assigned_to_id as "assignedToId",
          t.tenant_id as "tenantId", t.created_at as "createdAt", t.updated_at as "updatedAt",
          t.company_id as "companyId", t.beneficiary_id as "beneficiaryId", t.is_active as "isActive",
          -- Dados da empresa
          COALESCE(comp.name, comp.display_name, comp.company_name) as "companyName",
          comp.email as "companyEmail",
          -- Dados do cliente/solicitante
          COALESCE(
            c.first_name || ' ' || c.last_name,
            c.first_name,
            c.last_name,
            c.name,
            c.full_name
          ) as "callerName",
          c.email as "callerEmail",
          -- Dados do beneficiário
          COALESCE(
            b.first_name || ' ' || b.last_name,
            b.first_name,
            b.last_name,
            b.name,
            b.full_name
          ) as "beneficiaryName",
          b.email as "beneficiaryEmail",
          -- Dados do usuário atribuído
          COALESCE(u.first_name || ' ' || u.last_name, u.email) as "assignedToName"
        FROM ${sql.identifier(schemaName)}.tickets t
        LEFT JOIN ${sql.identifier(schemaName)}.companies comp ON t.company_id = comp.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers c ON t.caller_id = c.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers b ON t.beneficiary_id = b.id
        LEFT JOIN public.users u ON t.assigned_to_id = u.id
        WHERE t.id = ${id} AND t.tenant_id = ${tenantId} AND t.is_active = true
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

  async create(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<Ticket> {
    const now = new Date();

    const insertData = {
      ...ticketData,
      tenantId,
      createdAt: now,
      updatedAt: now
    };

    const result = await db
      .insert(tickets)
      .values(insertData as any)
      .returning();

    return this.mapToTicket(result[0]);
  }

  async update(id: string, updateData: Partial<Ticket>, tenantId: string): Promise<Ticket> {
    const cleanUpdateData: any = {};

    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key];
      if (value !== undefined) {
        cleanUpdateData[key] = value;
      }
    });

    cleanUpdateData.updatedAt = new Date();

    const result = await db.update(tickets)
      .set(cleanUpdateData)
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId)
        )
      )
      .returning();

    return this.mapToTicket(result[0]);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await db
      .delete(tickets)
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId)
        )
      );
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
          -- Dados da empresa
          COALESCE(comp.name, comp.display_name, comp.company_name) as "companyName",
          comp.email as "companyEmail",
          -- Dados do cliente/solicitante
          COALESCE(
            c.first_name || ' ' || c.last_name,
            c.first_name,
            c.last_name,
            c.name,
            c.full_name
          ) as "callerName",
          c.email as "callerEmail",
          -- Dados do beneficiário (se diferente do solicitante)
          COALESCE(
            b.first_name || ' ' || b.last_name,
            b.first_name,
            b.last_name,
            b.name,
            b.full_name
          ) as "beneficiaryName",
          b.email as "beneficiaryEmail",
          -- Dados do usuário atribuído
          COALESCE(u.first_name || ' ' || u.last_name, u.email) as "assignedToName"
        FROM ${sql.identifier(schemaName)}.tickets t
        LEFT JOIN ${sql.identifier(schemaName)}.companies comp ON t.company_id = comp.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers c ON t.caller_id = c.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers b ON t.beneficiary_id = b.id
        LEFT JOIN public.users u ON t.assigned_to_id = u.id
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
          t.id, t.number, t.subject, t.description, t.status, t.priority, t.urgency, t.impact,
          t.category, t.subcategory, t.caller_id as "callerId", t.assigned_to_id as "assignedToId",
          t.tenant_id as "tenantId", t.created_at as "createdAt", t.updated_at as "updatedAt",
          t.company_id as "companyId", t.beneficiary_id as "beneficiaryId", t.is_active as "isActive",
          -- Dados da empresa
          COALESCE(comp.name, comp.display_name, comp.company_name) as "companyName",
          comp.email as "companyEmail",
          -- Dados do cliente/solicitante
          COALESCE(
            c.first_name || ' ' || c.last_name,
            c.first_name,
            c.last_name,
            c.name,
            c.full_name
          ) as "callerName",
          c.email as "callerEmail",
          -- Dados do beneficiário
          COALESCE(
            b.first_name || ' ' || b.last_name,
            b.first_name,
            b.last_name,
            b.name,
            b.full_name
          ) as "beneficiaryName",
          b.email as "beneficiaryEmail",
          -- Dados do usuário atribuído
          COALESCE(u.first_name || ' ' || u.last_name, u.email) as "assignedToName"
        FROM ${sql.identifier(schemaName)}.tickets t
        LEFT JOIN ${sql.identifier(schemaName)}.companies comp ON t.company_id = comp.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers c ON t.caller_id = c.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers b ON t.beneficiary_id = b.id
        LEFT JOIN public.users u ON t.assigned_to_id = u.id
        WHERE t.is_active = true
        ORDER BY t.created_at DESC
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
      category: row.category || null,
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
      // Dados relacionais
      companyName: row.companyName || null,
      companyEmail: row.companyEmail || null,
      callerName: row.callerName || null,
      callerEmail: row.callerEmail || null,
      beneficiaryName: row.beneficiaryName || null,
      beneficiaryEmail: row.beneficiaryEmail || null,
      assignedToName: row.assignedToName || null
    } as Ticket;
  }
}