/**
 * INFRASTRUCTURE LAYER - DRIZZLE TICKET REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, sql, count, isNull } from 'drizzle-orm';
import { db } from '../../../../db';
import { tickets, users, customers, companies } from '@shared/schema';
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
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
        )
      )
      .limit(1);

    return result[0] as any || null;
  }

  async findByNumber(number: string, tenantId: string): Promise<Ticket | null> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.number, number),
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async create(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<any> {
    try {
      const now = new Date();

      // Mapear campos camelCase para snake_case do banco
      const insertData = {
        tenant_id: tenantId,
        subject: ticketData.subject,
        description: ticketData.description,
        status: ticketData.status || 'new',
        priority: ticketData.priority || 'medium',
        urgency: ticketData.urgency || 'medium',
        category: ticketData.category,
        subcategory: ticketData.subcategory,
        action: ticketData.action,
        caller_id: ticketData.callerId,
        beneficiary_id: ticketData.beneficiaryId,
        customer_company_id: ticketData.customerCompanyId,
        assigned_to_id: ticketData.assignedToId,
        assignment_group_id: ticketData.assignmentGroupId,
        location: ticketData.location,
        symptoms: ticketData.symptoms,
        business_impact: ticketData.businessImpact,
        workaround: ticketData.workaround,
        created_by_id: ticketData.createdById,
        created_at: now,
        updated_at: now,
        is_active: true
      };

      // Remover campos undefined/null para evitar erros SQL
      const cleanData = Object.fromEntries(
        Object.entries(insertData).filter(([_, value]) => value !== undefined && value !== null)
      );

      const result = await db
        .insert(tickets)
        .values(cleanData)
        .returning();

      return result[0];
    } catch (error) {
      console.error('[DrizzleTicketRepository] Error in create:', error);
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
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
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
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
        is_active: false, 
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenant_id, tenantId)
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
    try {
      console.log('[DrizzleTicketRepository] findByFilters called with:', { filters, pagination, tenantId });

      // Build where conditions - usando campos corretos do schema
      const conditions = [
        eq(tickets.tenant_id, tenantId)
      ];

      // Apply filters com validação de campos existentes
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
        conditions.push(eq(tickets.customer_company_id, filters.companyId));
      }

      if (filters.category) {
        conditions.push(eq(tickets.category, filters.category));
      }

      if (filters.dateFrom) {
        conditions.push(gte(tickets.created_at, filters.dateFrom));
      }

      if (filters.dateTo) {
        conditions.push(lte(tickets.created_at, filters.dateTo));
      }

      if (filters.search && filters.search.trim().length > 0) {
        const searchTerm = `%${filters.search.trim()}%`;
        conditions.push(
          or(
            like(tickets.subject, searchTerm),
            like(tickets.description, searchTerm)
          )
        );
      }

      console.log('[DrizzleTicketRepository] Built conditions:', conditions.length);

      // Count total results
      const totalResult = await db
        .select({ count: count() })
        .from(tickets)
        .where(and(...conditions));

      const total = totalResult[0]?.count || 0;
      console.log('[DrizzleTicketRepository] Total tickets found:', total);

      // Calculate offset
      const offset = (pagination.page - 1) * pagination.limit;

      // Fetch paginated results with proper ordering
      const ticketResults = await db
        .select()
        .from(tickets)
        .where(and(...conditions))
        .orderBy(desc(tickets.created_at))
        .limit(pagination.limit)
        .offset(offset);

      console.log('[DrizzleTicketRepository] Query executed successfully, results:', ticketResults.length);

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        tickets: ticketResults,
        total,
        page: pagination.page,
        totalPages
      };
    } catch (error) {
      console.error('[DrizzleTicketRepository] Error in findByFilters:', error);
      console.error('[DrizzleTicketRepository] Error details:', {
        message: error.message,
        stack: error.stack,
        filters,
        tenantId
      });
      
      // Em caso de erro, tentar busca simples por tenant
      try {
        console.log('[DrizzleTicketRepository] Attempting fallback query...');
        const fallbackResults = await db
          .select()
          .from(tickets)
          .where(eq(tickets.tenant_id, tenantId))
          .orderBy(desc(tickets.created_at))
          .limit(pagination.limit);

        console.log('[DrizzleTicketRepository] Fallback query successful:', fallbackResults.length);

        return {
          tickets: fallbackResults,
          total: fallbackResults.length,
          page: pagination.page,
          totalPages: Math.ceil(fallbackResults.length / pagination.limit)
        };
      } catch (fallbackError) {
        console.error('[DrizzleTicketRepository] Fallback query also failed:', fallbackError);
        return {
          tickets: [],
          total: 0,
          page: pagination.page,
          totalPages: 0
        };
      }
    }
  }

  async findByTenant(tenantId: string): Promise<any[]> {
    try {
      console.log('[DrizzleTicketRepository] findByTenant called for tenant:', tenantId);

      const result = await db
        .select()
        .from(tickets)
        .where(eq(tickets.tenant_id, tenantId))
        .orderBy(desc(tickets.created_at));

      console.log('[DrizzleTicketRepository] findByTenant found:', result.length, 'tickets');
      return result;
    } catch (error) {
      console.error('[DrizzleTicketRepository] Error in findByTenant:', error);
      console.error('[DrizzleTicketRepository] Tenant ID:', tenantId);
      return [];
    }
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.assigned_to_id, userId),
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
        )
      )
      .orderBy(desc(tickets.created_at));

    return result;
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.caller_id, customerId),
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
        )
      )
      .orderBy(desc(tickets.created_at));

    return result;
  }

  async findByStatus(status: string, tenantId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.status, status),
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
        )
      )
      .orderBy(desc(tickets.created_at));

    return result;
  }

  async findAll(tenantId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
        )
      )
      .orderBy(desc(tickets.created_at));

    return result;
  }

  async countByFilters(filters: TicketFilters, tenantId: string): Promise<number> {
    const conditions = [
      eq(tickets.tenant_id, tenantId),
      eq(tickets.is_active, true)
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
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
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
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true),
          gte(tickets.created_at, today)
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
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true),
          inArray(tickets.status, ['new', 'open', 'in_progress']),
          lte(tickets.created_at, oneDayAgo)
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
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true),
          inArray(tickets.status, ['new', 'open', 'in_progress']),
          or(
            and(
              eq(tickets.priority, 'critical'),
              lte(tickets.created_at, new Date(Date.now() - 60 * 60 * 1000)) // 1 hour
            ),
            and(
              eq(tickets.priority, 'high'),
              lte(tickets.created_at, fourHoursAgo)
            ),
            and(
              eq(tickets.priority, 'medium'),
              lte(tickets.created_at, oneDayAgo)
            )
          )
        )
      )
      .orderBy(asc(tickets.created_at));

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
          eq(tickets.tenant_id, tenantId)
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
          eq(tickets.tenant_id, tenantId),
          eq(tickets.is_active, true)
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
      eq(tickets.tenant_id, tenantId),
      eq(tickets.is_active, true),
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
        .orderBy(desc(tickets.created_at));

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
      .orderBy(desc(tickets.created_at))
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