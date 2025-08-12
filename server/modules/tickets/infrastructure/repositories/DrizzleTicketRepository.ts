/**
 * INFRASTRUCTURE LAYER - DRIZZLE TICKET REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull } from 'drizzle-orm';
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
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async findByNumber(number: string, tenantId: string): Promise<Ticket | null> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.number, number),
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      )
      .limit(1);

    return result[0] || null;
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
      .values(insertData)
      .returning();

    return result[0];
  }

  async update(id: string, updates: Partial<Ticket>, tenantId: string): Promise<Ticket> {
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
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('Ticket not found or already deleted');
    }

    return result[0];
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const result = await db
      .update(tickets)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, tenantId)
        )
      );

    if (result.rowCount === 0) {
      throw new Error('Ticket not found');
    }
  }

  async findByFilters(
    filters: TicketFilters, 
    pagination: PaginationOptions, 
    tenantId: string
  ): Promise<TicketListResult> {
    // Build where conditions
    const conditions = [
      eq(tickets.tenantId, tenantId),
      eq(tickets.isActive, true)
    ];

    // Apply filters
    if (filters.status?.length) {
      conditions.push(inArray(tickets.status, filters.status));
    }

    if (filters.priority?.length) {
      conditions.push(inArray(tickets.priority, filters.priority));
    }

    if (filters.assignedToId) {
      conditions.push(eq(tickets.assignedToId, filters.assignedToId));
    }

    if (filters.customerId) {
      conditions.push(eq(tickets.customerId, filters.customerId));
    }

    if (filters.companyId) {
      conditions.push(eq(tickets.companyId, filters.companyId));
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
          like(tickets.subject, `%${filters.search}%`),
          like(tickets.description, `%${filters.search}%`),
          like(tickets.number, `%${filters.search}%`)
        )
      );
    }

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

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

  async findByTenant(tenantId: string): Promise<Ticket[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return result;
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<Ticket[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.assignedToId, userId),
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return result;
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.customerId, customerId),
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return result;
  }

  async findByStatus(status: string, tenantId: string): Promise<Ticket[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.status, status),
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      )
      .orderBy(desc(tickets.createdAt));

    return result;
  }

  async countByFilters(filters: TicketFilters, tenantId: string): Promise<number> {
    const conditions = [
      eq(tickets.tenantId, tenantId),
      eq(tickets.isActive, true)
    ];

    // Apply same filters as findByFilters
    if (filters.status?.length) {
      conditions.push(inArray(tickets.status, filters.status));
    }

    if (filters.priority?.length) {
      conditions.push(inArray(tickets.priority, filters.priority));
    }

    if (filters.assignedToId) {
      conditions.push(eq(tickets.assignedToId, filters.assignedToId));
    }

    if (filters.customerId) {
      conditions.push(eq(tickets.customerId, filters.customerId));
    }

    if (filters.search) {
      conditions.push(
        or(
          like(tickets.subject, `%${filters.search}%`),
          like(tickets.description, `%${filters.search}%`),
          like(tickets.number, `%${filters.search}%`)
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
    const totalResult = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
        )
      );

    const total = totalResult[0]?.count || 0;

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
          eq(tickets.isActive, true),
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
          eq(tickets.isActive, true),
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

  async findTicketsForEscalation(tenantId: string): Promise<Ticket[]> {
    // Find tickets that might need escalation based on age and priority
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true),
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
  ): Promise<Ticket[]> {
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
          eq(tickets.tenantId, tenantId),
          eq(tickets.isActive, true)
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
      eq(tickets.isActive, true),
      or(
        like(tickets.subject, `%${searchTerm}%`),
        like(tickets.description, `%${searchTerm}%`),
        like(tickets.number, `%${searchTerm}%`)
      )
    ];

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

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