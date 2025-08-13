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
import { CreateTicketDTO, UpdateTicketDTO } from '../../application/dto/CreateTicketDTO';


export class DrizzleTicketRepositoryClean implements ITicketRepository {
  constructor(private logger: Logger) {}

  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    console.log('🔍 [DrizzleTicketRepositoryClean] findById called:', { id, tenantId });

    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const result = await db.execute(sql`
        SELECT 
          t.id,
          t.number,
          t.subject,
          t.description,
          t.status,
          t.priority,
          t.urgency,
          t.impact,
          t.category,
          t.subcategory,
          t.action,
          t.caller_id as "callerId",
          t.caller_type as "callerType", 
          t.beneficiary_id as "beneficiaryId",
          t.beneficiary_type as "beneficiaryType",
          t.assigned_to_id as "assignedToId",
          t.assignment_group as "assignmentGroupId",
          t.company_id as "companyId",
          t.location,
          t.contact_type as "contactType",
          t.business_impact as "businessImpact",
          t.symptoms,
          t.workaround,
          t.environment,
          t.link_ticket_number as "linkTicketNumber",
          t.link_type as "linkType",
          t.link_comment as "linkComment",
          t.tenant_id as "tenantId",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          t.opened_by_id as "createdBy",
          t.is_active as "isActive"
        FROM ${sql.identifier(schemaName)}.tickets t
        WHERE t.id = ${id} AND t.tenant_id = ${tenantId} AND t.is_active = true
      `);

      if (result.rows.length === 0) {
        console.log('❌ [DrizzleTicketRepositoryClean] Ticket not found');
        return null;
      }

      const ticket = result.rows[0] as any;
      console.log('✅ [DrizzleTicketRepositoryClean] Ticket found:', ticket.id);

      return ticket;
    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] Error in findById:', error);
      throw new Error(`Failed to find ticket: ${error.message}`);
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
          company_id as "companyId", beneficiary_id as "beneficiaryId", assignment_group as "assignmentGroupId"
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE number = ${number} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] as Ticket | null;
    } catch (error: any) {
      this.logger.logger.error('Failed to find ticket by number', { error: error.message, number, tenantId });
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
          company_id as "companyId", beneficiary_id as "beneficiaryId", assignment_group as "assignmentGroupId"
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
          company_id as "companyId", beneficiary_id as "beneficiaryId", assignment_group as "assignmentGroupId"
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
          company_id as "companyId", beneficiary_id as "beneficiaryId", assignment_group as "assignmentGroupId"
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

  async create(data: CreateTicketDTO, tenantId: string): Promise<Ticket> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const [newTicket] = await db
        .insert(tickets)
        .values({...data, tenantId: tenantId } as any) // Assuming tenantId is part of the schema or needs to be added
        .returning();

      return newTicket as Ticket;
    } catch (error: any) {
      this.logger.error('Failed to create ticket', { error: error.message, tenantId, data });
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async update(id: string, data: UpdateTicketDTO, tenantId: string): Promise<Ticket> {
    console.log('💾 [DrizzleTicketRepositoryClean] update called:', { 
      id, 
      tenantId,
      dataKeys: Object.keys(data)
    });

    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Map frontend fields to database columns
      const fieldMapping: Record<string, string> = {
        'subject': 'subject',
        'description': 'description', 
        'priority': 'priority',
        'status': 'status',
        'urgency': 'urgency',
        'impact': 'impact',
        'category': 'category',
        'subcategory': 'subcategory',
        'action': 'action',
        'caller_id': 'caller_id',
        'caller_type': 'caller_type',
        'callerType': 'caller_type',
        'beneficiary_id': 'beneficiary_id', 
        'beneficiary_type': 'beneficiary_type',
        'beneficiaryType': 'beneficiary_type',
        'assigned_to_id': 'assigned_to_id',
        'assignment_group': 'assignment_group',
        'assignmentGroup': 'assignment_group',
        'company_id': 'company_id',
        'location': 'location',
        'contact_type': 'contact_type',
        'contactType': 'contact_type',
        'business_impact': 'business_impact',
        'businessImpact': 'business_impact',
        'symptoms': 'symptoms',
        'workaround': 'workaround', 
        'environment': 'environment',
        'link_ticket_number': 'link_ticket_number',
        'linkTicketNumber': 'link_ticket_number',
        'link_type': 'link_type',
        'linkType': 'link_type',
        'link_comment': 'link_comment',
        'linkComment': 'link_comment',
        'updatedById': 'updated_by'
      };

      const setFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Process each field in the update data
      for (const [key, value] of Object.entries(data)) {
        if (key === 'tenantId' || key === 'updatedAt' || key === 'createdAt' || key === 'isActive' || key === 'id') continue; // Skip meta fields

        const dbColumn = fieldMapping[key] || key;

        if (value !== undefined && value !== null) {
          if (Array.isArray(value) || typeof value === 'object') {
            setFields.push(`${dbColumn} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setFields.push(`${dbColumn} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      }

      // Add updated_at field (using NOW() function, not a parameter)
      setFields.push(`updated_at = NOW()`);

      if (setFields.length === 1) { // Only updated_at field
        console.log('⚠️ [DrizzleTicketRepositoryClean] No actual fields to update beyond timestamp');
        // Return the existing ticket if no actual fields are updated
        const existingTicket = await this.findById(id, tenantId);
        if (!existingTicket) {
            throw new Error('Ticket not found');
        }
        return existingTicket;
      }

      // Add WHERE clause parameters - paramIndex continues from setFields
      values.push(id);
      const whereIdParam = paramIndex++;

      values.push(tenantId);
      const whereTenantParam = paramIndex;

      const updateQuery = `
        UPDATE ${schemaName}.tickets 
        SET ${setFields.join(', ')}
        WHERE id = $${whereIdParam} AND tenant_id = $${whereTenantParam} AND is_active = true
        RETURNING *
      `;

      console.log('🔍 [DrizzleTicketRepositoryClean] Update query:', updateQuery);
      console.log('🔍 [DrizzleTicketRepositoryClean] Values count:', values.length);
      console.log('[UPDATE-DEBUG] Final query:', updateQuery);
      console.log('[UPDATE-DEBUG] Values:', values);
      console.log('[UPDATE-DEBUG] Values length:', values.length);
      console.log('[UPDATE-DEBUG] Set fields count:', setFields.length);

      // Validate parameter count - subtract 1 because updated_at uses NOW() not a parameter
      const actualSetFieldsWithParams = setFields.length - 1; // -1 for updated_at = NOW()
      const expectedParamCount = actualSetFieldsWithParams + 2; // +2 for id and tenant_id
      if (values.length !== expectedParamCount) {
        throw new Error(`Parameter count mismatch: expected ${expectedParamCount}, got ${values.length}. Set fields with params: ${actualSetFieldsWithParams}, WHERE params: 2`);
      }

      const result = await db.execute(sql.raw(updateQuery, values));

      if (result.rows.length === 0) {
        throw new Error('Ticket not found or update failed');
      }

      const updatedTicket = result.rows[0] as any;
      console.log('✅ [DrizzleTicketRepositoryClean] Update successful:', {
        ticketId: updatedTicket.id,
        updatedAt: updatedTicket.updated_at
      });

      // Transform back to frontend format if necessary (based on original Ticket structure)
      return {
        ...updatedTicket,
        callerId: updatedTicket.caller_id,
        callerType: updatedTicket.caller_type,
        beneficiaryId: updatedTicket.beneficiary_id,
        beneficiaryType: updatedTicket.beneficiary_type,
        assignedToId: updatedTicket.assigned_to_id,
        assignmentGroupId: updatedTicket.assignment_group,
        companyId: updatedTicket.company_id,
        contactType: updatedTicket.contact_type,
        businessImpact: updatedTicket.business_impact,
        linkTicketNumber: updatedTicket.link_ticket_number,
        linkType: updatedTicket.link_type,
        linkComment: updatedTicket.link_comment,
        tenantId: updatedTicket.tenant_id,
        createdAt: updatedTicket.created_at,
        updatedAt: updatedTicket.updated_at,
        createdBy: updatedTicket.created_by,
        updatedBy: updatedTicket.updated_by,
        isActive: updatedTicket.is_active,
        followers: [], // Default empty array for missing field
        tags: [] // Default empty array for missing field
      };

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] Error in update:', error);
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  }

  async delete(id: string, tenantId: string, userId: string): Promise<void> {
    try {
      console.log(`🗑️ [DrizzleTicketRepositoryClean] delete called with id: ${id}, tenantId: ${tenantId}, userId: ${userId}`);

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Use SOFT DELETE instead of hard delete - FIXED following 1qa.md
      const query = sql`
        UPDATE ${sql.identifier(schemaName)}.tickets 
        SET is_active = false, updated_at = NOW(), updated_by = ${userId}
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
      this.logger.error('Failed to delete ticket', { error: error.message, id, tenantId, userId });
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  async updateLastActivity(ticketId: string, tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      await db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.tickets
        SET updated_at = NOW()
        WHERE id = ${ticketId} AND tenant_id = ${tenantId}
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

      // Get total count of active tickets
      const totalResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM ${sql.identifier(schemaName)}.tickets WHERE is_active = true AND tenant_id = ${tenantId}
      `);
      const total = Number(totalResult.rows[0]?.total || 0);

      // Get count by status
      const statusResult = await db.execute(sql`
        SELECT status, COUNT(*) as count FROM ${sql.identifier(schemaName)}.tickets WHERE is_active = true AND tenant_id = ${tenantId} GROUP BY status
      `);
      const byStatus: Record<string, number> = statusResult.rows.reduce((acc, row: any) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // Get count by priority
      const priorityResult = await db.execute(sql`
        SELECT priority, COUNT(*) as count FROM ${sql.identifier(schemaName)}.tickets WHERE is_active = true AND tenant_id = ${tenantId} GROUP BY priority
      `);
      const byPriority: Record<string, number> = priorityResult.rows.reduce((acc, row: any) => {
        acc[row.priority] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // Get overdue count (assuming a due_date or similar field exists)
      // This is a placeholder and needs actual schema knowledge. For now, returning 0.
      const overdueCount = 0; 

      // Get today's count (tickets created today)
      const todayResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.identifier(schemaName)}.tickets WHERE is_active = true AND tenant_id = ${tenantId} AND DATE(created_at) = CURRENT_DATE
      `);
      const todayCount = Number(todayResult.rows[0]?.count || 0);


      return {
        total,
        byStatus,
        byPriority,
        overdueCount,
        todayCount
      };
    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] Error in getStatistics:', error);
      this.logger.error('Failed to get statistics', { error: error.message, tenantId });
      throw error;
    }
  }

  // --- Unimplemented methods from original code - keeping placeholders ---
  async findByAssignedUser(userId: string, tenantId: string): Promise<Ticket[]> {
    console.log('findByAssignedUser not implemented');
    throw new Error('FindByAssignedUser method not implemented yet');
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]> {
    console.log('findByCustomer not implemented');
    throw new Error('FindByCustomer method not implemented yet');
  }

  async searchTickets(searchTerm: string, tenantId: string, pagination: PaginationOptions): Promise<PaginatedResult<Ticket>> {
    console.log('searchTickets not implemented');
    throw new Error('SearchTickets method not implemented yet');
  }
}