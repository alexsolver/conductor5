/**
 * INFRASTRUCTURE LAYER - DRIZZLE TICKET REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull, ne, ilike } from 'drizzle-orm';
import { db } from '../../../../db';
import { tickets } from '@shared/schema';
import { Ticket } from '../../domain/entities/Ticket';
import {
  ITicketRepository,
  TicketFilters,
  PaginationOptions,
  TicketListResult
} from '../../domain/repositories/ITicketRepository';

export class DrizzleTicketRepository implements ITicketRepository {

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

    return ticket || null;
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

    return result[0] || null;
  }

  async create(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<any> {
    const now = new Date();

    const insertData = {
      ...ticketData,
      tenantId,
      createdAt: now,
      updatedAt: now
    };

    const result = await db
      .insert(tickets)
      .values(insertData)
      .returning();

    return result[0];
  }

  async update(id: string, updates: Partial<Ticket>, tenantId: string): Promise<any> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await db
      .update(tickets)
      .set(updateData)
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('Ticket not found or already deleted');
    }

    return result[0];
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

  async findByFilters(
    filters: TicketFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<TicketListResult> {
    // Build where conditions
    const conditions = [
      eq(tickets.tenantId, tenantId)
    ];

    // Apply filters
    if (filters.status?.length) {
      conditions.push(inArray(tickets.status, filters.status));
    }

    if (filters.priority?.length) {
      conditions.push(inArray(tickets.priority, filters.priority));
    }

    if (filters.assignedToId) {
      conditions.push(eq(tickets.assigned_to_id, filters.assignedToId));
    }

    if (filters.customerId) {
      conditions.push(eq(tickets.caller_id, filters.customerId));
    }

    if (filters.companyId) {
      conditions.push(eq(tickets.caller_company_id, filters.companyId));
    }

    if (filters.category) {
      conditions.push(eq(tickets.category, filters.category));
    }

    if (filters.dateFrom) {
      conditions.push(gte(tickets.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(tickets.createdAt, filters.dateTo));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(tickets.subject, `%${filters.search}%`),
          ilike(tickets.description, `%${filters.search}%`),
          ilike(tickets.number, `%${filters.search}%`)
        )
      );
    }

    // Count total results with error handling
    let total = 0;
    try {
      console.log('🔍 [DrizzleTicketRepository] Filters applied:', JSON.stringify(filters, null, 2));
      console.log('🔍 [DrizzleTicketRepository] Conditions count:', conditions.length);

      const totalResult = await db
        .select({ count: count() })
        .from(tickets)
        .where(and(...conditions));

      total = totalResult[0]?.count || 0;
      console.log('📊 [DrizzleTicketRepository] Total tickets found:', total);
    } catch (error) {
      console.error('❌ [DrizzleTicketRepository] Error counting tickets:', error);
      console.error('❌ [DrizzleTicketRepository] Error details:', error.stack);
      throw new Error(`Database error counting tickets: ${error.message}`);
    }

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Build order by
    const orderColumn = tickets[pagination.sortBy as keyof typeof tickets] || tickets.createdAt;
    const orderDirection = pagination.sortOrder === 'asc' ? asc : desc;

    // Fetch paginated results
    const ticketResults = await db
      .select()
      .from(tickets)
      .where(and(...conditions))
      .orderBy(orderDirection(orderColumn))
      .limit(pagination.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      tickets: ticketResults,
      total,
      page: pagination.page,
      totalPages
    };
  }

  async findByTenant(tenantId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(eq(tickets.tenantId, tenantId))
      .orderBy(desc(tickets.createdAt));

    return result;
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.assigned_to_id, userId),
          eq(tickets.tenantId, tenantId)
        )
      )
      .orderBy(desc(tickets.createdAt));
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.caller_id, customerId),
          eq(tickets.tenantId, tenantId)
        )
      )
      .orderBy(desc(tickets.createdAt));
  }

  async findByStatus(status: string, tenantId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.status, status),
          eq(tickets.tenantId, tenantId)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return result;
  }

  async findAll(tenantId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(eq(tickets.tenantId, tenantId))
      .orderBy(desc(tickets.createdAt));

    return result;
  }

  async countByFilters(filters: TicketFilters, tenantId: string): Promise<number> {
    const conditions = [
      eq(tickets.tenantId, tenantId)
    ];

    // Apply same filters as findByFilters
    if (filters.status?.length) {
      conditions.push(inArray(tickets.status, filters.status));
    }

    if (filters.priority?.length) {
      conditions.push(inArray(tickets.priority, filters.priority));
    }

    if (filters.assignedToId) {
      conditions.push(eq(tickets.assigned_to_id, filters.assignedToId));
    }

    if (filters.customerId) {
      conditions.push(eq(tickets.caller_id, filters.customerId));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(tickets.subject, `%${filters.search}%`),
          ilike(tickets.description, `%${filters.search}%`),
          ilike(tickets.number, `%${filters.search}%`)
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
    // Get basic statistics
    const totalTickets = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.tenantId, tenantId));

    const total = totalTickets[0]?.count || 0;

    // Get status distribution
    // Note: This is a simplified version. In a real implementation,
    // you might want to use more sophisticated grouping queries
    const statusStats: Record<string, number> = {};
    const priorityStats: Record<string, number> = {};

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayResult = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          gte(tickets.createdAt, today)
        )
      );

    const todayCount = todayResult[0]?.count || 0;

    // Calculate overdue (simplified - tickets older than SLA limits)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const overdueResult = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          inArray(tickets.status, ['new', 'open', 'in_progress']),
          lte(tickets.createdAt, oneDayAgo)
        )
      );

    const overdueCount = overdueResult[0]?.count || 0;

    return {
      total,
      byStatus: statusStats,
      byPriority: priorityStats,
      overdueCount,
      todayCount
    };
  }

  async findTicketsForEscalation(tenantId: string): Promise<any[]> {
    // Find tickets that might need escalation based on age and priority
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          inArray(tickets.status, ['new', 'open', 'in_progress']),
          or(
            and(
              eq(tickets.priority, 'critical'),
              lte(tickets.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // 1 hour
            ),
            and(
              eq(tickets.priority, 'high'),
              lte(tickets.createdAt, fourHoursAgo)
            ),
            and(
              eq(tickets.priority, 'medium'),
              lte(tickets.createdAt, oneDayAgo)
            )
          )
        )
      )
      .orderBy(asc(tickets.createdAt));

    return result;
  }

  async updateLastActivity(id: string, tenantId: string): Promise<void> {
    await db
      .update(tickets)
      .set({
        updatedAt: new Date()
      })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId)
        )
      );
  }

  async bulkUpdate(
    ids: string[],
    updates: Partial<Ticket>,
    tenantId: string
  ): Promise<any[]> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await db
      .update(tickets)
      .set(updateData)
      .where(
        and(
          inArray(tickets.id, ids),
          eq(tickets.tenantId, tenantId)
        )
      )
      .returning();

    return result;
  }

  async searchTickets(
    searchTerm: string,
    tenantId: string,
    pagination?: PaginationOptions
  ): Promise<TicketListResult> {
    const conditions = [
      eq(tickets.tenantId, tenantId),
      or(
        ilike(tickets.subject, `%${searchTerm}%`),
        ilike(tickets.description, `%${searchTerm}%`),
        ilike(tickets.number, `%${searchTerm}%`)
      )
    ];

    // Count total results with error handling
    let total = 0;
    try {
      console.log('🔍 [DrizzleTicketRepository] Filters applied:', JSON.stringify(filters, null, 2));
      console.log('🔍 [DrizzleTicketRepository] Conditions count:', conditions.length);

      const totalResult = await db
        .select({ count: count() })
        .from(tickets)
        .where(and(...conditions));

      total = totalResult[0]?.count || 0;
      console.log('📊 [DrizzleTicketRepository] Total tickets found:', total);
    } catch (error) {
      console.error('❌ [DrizzleTicketRepository] Error counting tickets:', error);
      console.error('❌ [DrizzleTicketRepository] Error details:', error.stack);
      throw new Error(`Database error counting tickets: ${error.message}`);
    }

    if (!pagination) {
      const ticketResults = await db
        .select()
        .from(tickets)
        .where(and(...conditions))
        .orderBy(desc(tickets.createdAt));

      return {
        tickets: ticketResults,
        total,
        page: 1,
        totalPages: 1
      };
    }

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Fetch paginated results
    const ticketResults = await db
      .select()
      .from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt))
      .limit(pagination.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      tickets: ticketResults,
      total,
      page: pagination.page,
      totalPages
    };
  }
}