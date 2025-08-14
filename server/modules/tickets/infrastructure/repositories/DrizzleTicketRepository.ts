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
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId)
        )
      );

    return ticket ? this.mapToTicket(ticket) : null;
  }

  async findByNumber(number: string, tenantId: string): Promise<Ticket | null> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.number, number),
          eq(tickets.tenantId, tenantId)
        )
      )
      .limit(1);

    return result[0] ? this.mapToTicket(result[0]) : null;
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

  // ✅ CLEAN ARCHITECTURE - Main implementation method
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
      // Calculate offset
      const offset = (pagination.page - 1) * pagination.limit;

      // Build filter conditions
      const conditions = [eq(tickets.tenantId, tenantId)];

      if (filters.status?.length) {
        conditions.push(inArray(tickets.status, filters.status));
      }

      if (filters.priority?.length) {
        conditions.push(inArray(tickets.priority, filters.priority));
      }

      if (filters.assignedToId) {
        conditions.push(eq(tickets.responsibleId, filters.assignedToId));
      }

      if (filters.customerId) {
        conditions.push(eq(tickets.callerId, filters.customerId));
      }

      if (filters.category) {
        conditions.push(eq(tickets.category, filters.category));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(tickets.subject, `%${filters.search}%`),
            ilike(tickets.description, `%${filters.search}%`)
          )
        );
      }

      // Apply filters to main query
      const ticketResults = await db
        .select()
        .from(tickets)
        .where(and(...conditions))
        .orderBy(desc(tickets.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      // Count total results with same filters
      const total = await this.countByFilters(filters, tenantId);
      const totalPages = Math.ceil(total / pagination.limit);

      console.log('✅ [DrizzleTicketRepository] Query successful:', {
        total,
        page: pagination.page,
        totalPages,
        resultsCount: ticketResults.length
      });

      return {
        tickets: ticketResults.map(ticket => this.mapToTicket(ticket)),
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
      const results = await db
        .select()
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .orderBy(desc(tickets.createdAt));

      return results.map(ticket => this.mapToTicket(ticket));
    } catch (error) {
      this.logger.error('Failed to find tickets by tenant', { 
        error: (error as Error).message, 
        tenantId 
      });
      throw new Error(`Failed to find tickets by tenant: ${(error as Error).message}`);
    }
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<Ticket[]> {
    const results = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.responsibleId, userId),
          eq(tickets.tenantId, tenantId)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return results.map(ticket => this.mapToTicket(ticket));
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]> {
    const results = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.callerId, customerId),
          eq(tickets.tenantId, tenantId)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return results.map(ticket => this.mapToTicket(ticket));
  }

  async findByStatus(status: string, tenantId: string): Promise<Ticket[]> {
    const results = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.status, status),
          eq(tickets.tenantId, tenantId)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return results.map(ticket => this.mapToTicket(ticket));
  }

  async countByFilters(filters: TicketFilters, tenantId: string): Promise<number> {
    const conditions = [eq(tickets.tenantId, tenantId)];

    if (filters.status?.length) {
      conditions.push(inArray(tickets.status, filters.status));
    }

    if (filters.priority?.length) {
      conditions.push(inArray(tickets.priority, filters.priority));
    }

    if (filters.assignedToId) {
      conditions.push(eq(tickets.responsibleId, filters.assignedToId));
    }

    if (filters.customerId) {
      conditions.push(eq(tickets.callerId, filters.customerId));
    }

    // TODO: Re-enable companyId filter when schema is fixed
    // if (filters.companyId) {
    //   conditions.push(eq(tickets.companyId, filters.companyId));
    // }

    if (filters.category) {
      conditions.push(eq(tickets.category, filters.category));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(tickets.subject, `%${filters.search}%`),
          ilike(tickets.description, `%${filters.search}%`)
        )
      );
    }

    const result = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(...conditions));

    return result[0]?.count || 0;
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
    const offset = (paginationOptions.page - 1) * paginationOptions.limit;

    const searchConditions = and(
      eq(tickets.tenantId, tenantId),
      or(
        ilike(tickets.subject, `%${searchTerm}%`),
        ilike(tickets.description, `%${searchTerm}%`),
        ilike(tickets.number, `%${searchTerm}%`)
      )
    );

    const results = await db
      .select()
      .from(tickets)
      .where(searchConditions)
      .orderBy(desc(tickets.createdAt))
      .limit(paginationOptions.limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(tickets)
      .where(searchConditions);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / paginationOptions.limit);

    return {
      tickets: results.map(ticket => this.mapToTicket(ticket)),
      total,
      page: paginationOptions.page,
      totalPages
    };
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
      assignedToId: row.assignedToId || row.responsibleId || null,
      tenantId: row.tenantId,
      createdAt: row.createdAt || new Date(),
      updatedAt: row.updatedAt || new Date(),
      createdById: row.createdById || null,
      updatedById: row.updatedById || null,
      companyId: row.companyId || null,
      isActive: row.isActive !== false
    } as Ticket;
  }
}