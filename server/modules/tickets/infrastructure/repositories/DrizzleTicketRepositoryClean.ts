/**
 * INFRASTRUCTURE LAYER - DRIZZLE TICKET REPOSITORY CLEAN
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, sql } from 'drizzle-orm';
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

export class DrizzleTicketRepositoryClean implements ITicketRepository {
  constructor(private logger: Logger) {}

  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    try {
      console.log(`🔍 [DrizzleTicketRepositoryClean] findById called with id: ${id}, tenantId: ${tenantId}`);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE id = ${id} AND is_active = true
        LIMIT 1
      `);

      const ticket = result.rows[0] || null;
      console.log(`✅ [DrizzleTicketRepositoryClean] findById result: ${ticket ? 'found' : 'not found'}`);

      return ticket as Ticket | null;
    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] findById error:', error);
      this.logger.error('Failed to find ticket by ID', { error: error.message, id, tenantId });
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
          company_id as "companyId", beneficiary_id as "beneficiaryId"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE number = ${number} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] as Ticket | null;
    } catch (error: any) {
      this.logger.error('Failed to find ticket by number', { error: error.message, number, tenantId });
      throw error;
    }
  }

  async findWithFilters(
    filters: TicketFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<TicketListResult> {
    try {
      console.log('🔍 [DrizzleTicketRepositoryClean] findWithFilters called with:', { filters, pagination, tenantId });

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const offset = (pagination.page - 1) * pagination.limit;

      // Build WHERE conditions
      let whereClause = '';
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

      if (filters.search) {
        whereClause += ` AND (subject ILIKE ? OR description ILIKE ?)`;
        whereParams.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // Count total records - ONLY ACTIVE tickets
      const countResult = await db.execute(sql.raw(`
        SELECT COUNT(*) as total
        FROM ${schemaName}.tickets
        WHERE is_active = true ${whereClause}
      `, whereParams));

      const total = Number(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / pagination.limit);

      // Fetch paginated results - ONLY ACTIVE tickets
      const results = await db.execute(sql.raw(`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId"
        FROM ${schemaName}.tickets
        WHERE is_active = true ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${pagination.limit} OFFSET ${offset}
      `, whereParams));

      return {
        tickets: results.rows,
        total,
        page: pagination.page,
        totalPages
      };

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] findWithFilters error:', error);
      this.logger.error('Failed to find tickets with filters', { error: error.message, filters, pagination, tenantId });
      throw error;
    }
  }

  async findAll(tenantId: string): Promise<Ticket[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE is_active = true
        ORDER BY created_at DESC
      `);

      return result.rows as Ticket[];
    } catch (error: any) {
      this.logger.error('Failed to find all tickets', { error: error.message, tenantId });
      throw error;
    }
  }

  async findByUserId(userId: string, tenantId: string): Promise<Ticket[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const result = await db.execute(sql`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE assigned_to_id = ${userId}
        ORDER BY created_at DESC
      `);

      return result.rows as Ticket[];
    } catch (error: any) {
      this.logger.error('Failed to find tickets by user ID', { error: error.message, userId, tenantId });
      throw error;
    }
  }

  async create(ticket: Partial<Ticket>): Promise<Ticket> {
    try {
      const [newTicket] = await db
        .insert(tickets)
        .values(ticket as any)
        .returning();

      return newTicket as Ticket;
    } catch (error: any) {
      this.logger.error('Failed to create ticket', { error: error.message });
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async update(id: string, updates: Partial<Ticket>, tenantId: string): Promise<Ticket> {
    try {
      console.log('🔧 [DrizzleTicketRepositoryClean] update called with id:', id, 'tenantId:', tenantId);
      console.log('📝 Update data:', updates);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Build dynamic SET clause based on provided fields
      const setClauses = [];
      const values = [];
      let paramCount = 0;

      if (updates.subject !== undefined) {
        setClauses.push(`subject = $${++paramCount}`);
        values.push(updates.subject);
      }
      if (updates.description !== undefined) {
        setClauses.push(`description = $${++paramCount}`);
        values.push(updates.description);
      }
      if (updates.status !== undefined) {
        setClauses.push(`status = $${++paramCount}`);
        values.push(updates.status);
      }
      if (updates.priority !== undefined) {
        setClauses.push(`priority = $${++paramCount}`);
        values.push(updates.priority);
      }
      if (updates.urgency !== undefined) {
        setClauses.push(`urgency = $${++paramCount}`);
        values.push(updates.urgency);
      }
      if (updates.impact !== undefined) {
        setClauses.push(`impact = $${++paramCount}`);
        values.push(updates.impact);
      }
      if (updates.category !== undefined) {
        setClauses.push(`category = $${++paramCount}`);
        values.push(updates.category);
      }
      if (updates.subcategory !== undefined) {
        setClauses.push(`subcategory = $${++paramCount}`);
        values.push(updates.subcategory);
      }
      if (updates.assignedToId !== undefined) {
        setClauses.push(`assigned_to_id = $${++paramCount}`);
        values.push(updates.assignedToId);
      }
      if (updates.companyId !== undefined) {
        setClauses.push(`company_id = $${++paramCount}`);
        values.push(updates.companyId);
      }
      if (updates.beneficiaryId !== undefined) {
        setClauses.push(`beneficiary_id = $${++paramCount}`);
        values.push(updates.beneficiaryId);
      }
      if (updates.callerId !== undefined) {
        setClauses.push(`caller_id = $${++paramCount}`);
        values.push(updates.callerId);
      }

      // Always update the updated_at timestamp
      setClauses.push('updated_at = NOW()');

      // Add WHERE clause parameters
      const whereId = `$${++paramCount}`;
      values.push(id);

      if (setClauses.length === 1) { // Only updated_at
        throw new Error('No fields to update');
      }

      const sqlQuery = `
        UPDATE ${schemaName}.tickets 
        SET ${setClauses.join(', ')}
        WHERE id = ${whereId} AND is_active = true
        RETURNING 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId"
      `;

      console.log('🔧 SQL:', sqlQuery);
      console.log('📊 Values:', values);

      const result = await db.execute(sql.raw(sqlQuery, values));

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Ticket not found or update failed');
      }

      console.log('✅ [DrizzleTicketRepositoryClean] update successful');
      return result.rows[0] as Ticket;

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] update error:', error);
      this.logger.error('Failed to update ticket', { error: error.message, id, tenantId });
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      console.log(`🗑️ [DrizzleTicketRepositoryClean] delete called with id: ${id}, tenantId: ${tenantId}`);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Use SOFT DELETE instead of hard delete - FIXED following 1qa.md
      const query = sql`
        UPDATE ${sql.identifier(schemaName)}.tickets 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id} AND is_active = true
        RETURNING id
      `;

      const result = await db.execute(query);
      const deletedTicket = result.rows?.[0];

      if (!deletedTicket) {
        throw new Error('Ticket not found or already deleted');
      }

      console.log(`✅ [DrizzleTicketRepositoryClean] delete successful - ticket soft deleted with ID: ${deletedTicket.id}`);
    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] delete error:', error);
      this.logger.error('Failed to delete ticket', { error: error.message, id, tenantId });
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  async updateLastActivity(ticketId: string, tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.tickets
        SET updated_at = NOW()
        WHERE id = ${ticketId}
      `);
    } catch (error: any) {
      this.logger.error('Failed to update last activity', { error: error.message, ticketId, tenantId });
      // Non-critical error, don't throw
    }
  }

  async getStatistics(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdueCount: number;
    todayCount: number;
  }> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Get total count
      const totalResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM ${sql.identifier(schemaName)}.tickets
      `);

      const total = Number(totalResult.rows[0]?.total || 0);

      return {
        total,
        byStatus: {},
        byPriority: {},
        overdueCount: 0,
        todayCount: 0
      };
    } catch (error: any) {
      this.logger.error('Failed to get statistics', { error: error.message, tenantId });
      throw error;
    }
  }
}