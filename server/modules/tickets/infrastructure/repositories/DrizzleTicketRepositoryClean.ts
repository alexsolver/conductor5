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
        WHERE id = ${id}
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
        WHERE number = ${number}
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

      // Count total records
      const countResult = await db.execute(sql.raw(`
        SELECT COUNT(*) as total
        FROM ${schemaName}.tickets
        WHERE 1=1 ${whereClause}
      `, whereParams));

      const total = Number(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / pagination.limit);

      // Fetch paginated results
      const results = await db.execute(sql.raw(`
        SELECT 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId"
        FROM ${schemaName}.tickets
        WHERE 1=1 ${whereClause}
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
      console.log(`🔧 [DrizzleTicketRepositoryClean] update called with id: ${id}, tenantId: ${tenantId}`);
      console.log(`📝 Update data:`, updates);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Use SQL directly to avoid Drizzle field mapping issues - FINAL FIX
      const updatePairs = [];
      const values = [];
      let paramIndex = 1;

      if (updates.subject !== undefined) {
        updatePairs.push(`subject = $${paramIndex++}`);
        values.push(updates.subject);
      }
      if (updates.description !== undefined) {
        updatePairs.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }
      if (updates.status !== undefined) {
        updatePairs.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.priority !== undefined) {
        updatePairs.push(`priority = $${paramIndex++}`);
        values.push(updates.priority);
      }
      if (updates.urgency !== undefined) {
        updatePairs.push(`urgency = $${paramIndex++}`);
        values.push(updates.urgency);
      }
      if (updates.impact !== undefined) {
        updatePairs.push(`impact = $${paramIndex++}`);
        values.push(updates.impact);
      }
      if (updates.category !== undefined) {
        updatePairs.push(`category = $${paramIndex++}`);
        values.push(updates.category);
      }
      if (updates.subcategory !== undefined) {
        updatePairs.push(`subcategory = $${paramIndex++}`);
        values.push(updates.subcategory);
      }
      if (updates.assignedToId !== undefined) {
        updatePairs.push(`assigned_to_id = $${paramIndex++}`);
        values.push(updates.assignedToId);
      }
      if (updates.companyId !== undefined) {
        updatePairs.push(`company_id = $${paramIndex++}`);
        values.push(updates.companyId);
      }
      if (updates.beneficiaryId !== undefined) {
        updatePairs.push(`beneficiary_id = $${paramIndex++}`);
        values.push(updates.beneficiaryId);
      }
      if (updates.callerId !== undefined) {
        updatePairs.push(`caller_id = $${paramIndex++}`);
        values.push(updates.callerId);
      }

      // Always update timestamp
      updatePairs.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE ${schemaName}.tickets 
        SET ${updatePairs.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id, number, subject, description, status, priority, urgency, impact,
          category, subcategory, caller_id as "callerId", assigned_to_id as "assignedToId",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt",
          company_id as "companyId", beneficiary_id as "beneficiaryId"
      `;

      console.log(`🔧 Final SQL query:`, query);
      console.log(`📊 Parameters:`, values);

      const result = await db.execute(sql.raw(query, values));
      const updatedTicket = result.rows[0];
      
      if (!updatedTicket) {
        throw new Error('Ticket not found or update failed');
      }

      console.log(`✅ [DrizzleTicketRepositoryClean] update successful`);
      return updatedTicket as Ticket;
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
      
      // First delete all related records to avoid foreign key violations
      await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_history WHERE ticket_id = ${id}
      `);
      
      await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_notes WHERE ticket_id = ${id}
      `);
      
      await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_communications WHERE ticket_id = ${id}
      `);
      
      await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_attachments WHERE ticket_id = ${id}
      `);
      
      await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.ticket_relationships WHERE source_ticket_id = ${id} OR target_ticket_id = ${id}
      `);

      // Finally delete the ticket
      const result = await db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.tickets
        WHERE id = ${id}
      `);

      if (!result.rowCount || result.rowCount === 0) {
        throw new Error('Ticket not found or delete failed');
      }

      console.log(`✅ [DrizzleTicketRepositoryClean] delete successful - removed ticket and all related data`);
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