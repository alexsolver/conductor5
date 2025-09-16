/**
 * INFRASTRUCTURE LAYER - DRIZZLE TICKET REPOSITORY CLEAN
 * Seguindo Clean Architecture - 1qa.md compliance
 */

// ✅ 1QA.MD COMPLIANCE: TICKETS REPOSITORY PADRONIZADO
import { eq, and, sql } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
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
import { SqlParameterValidator } from '../../../../utils/sqlParameterValidator';


export class DrizzleTicketRepositoryClean implements ITicketRepository {
  constructor(private logger: Logger) {
    console.log('✅ [DrizzleTicketRepositoryClean] Repository initialized following 1qa.md');
  }

  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    console.log('🔍 [DrizzleTicketRepositoryClean] findById called:', { id, tenantId });

    try {
      // ✅ 1QA.MD: Use tenant-specific database instance
      const tenantDb = await this.getTenantDb(tenantId);
      const schemaName = this.getSchemaName(tenantId);

      const result = await tenantDb.execute(sql`
        SELECT 
          t.id,
          t.tenant_id      as "tenantId",
          t.ticket_number  as "ticketNumber",
          t.title,
          t.description,
          t.status,
          t.priority,
          t.category,
          t.subcategory,
          t.customer_id    as "customerId",
          t.assigned_to    as "assignedTo",
          t.company_id     as "companyId",
          t.location_id    as "locationId",
          t.caller_id      as "callerId",
          t.estimated_hours as "estimatedHours",
          t.actual_hours    as "actualHours",
          t.due_date        as "dueDate",
          t.resolution_date as "resolutionDate",
          t.satisfaction_rating  as "satisfactionRating",
          t.satisfaction_comment as "satisfactionComment",
          t.tags,
          t.custom_fields   as "customFields",
          t.metadata,
          t.created_at      as "createdAt",
          t.updated_at      as "updatedAt",
          t.created_by_id   as "createdBy",
          t.updated_by_id   as "updatedBy",
          t.template_name   as "templateName",
          t.template_alternative as "templateAlternative",
          t.is_active       as "isActive",

          -- Dados da empresa
          c.name         as "companyName",
          c.display_name as "companyDisplayName",

          -- Dados do caller (se a tabela customers existe no schema)
          caller.first_name,
          caller.last_name,
          caller.email,
          CONCAT(caller.first_name, ' ', caller.last_name) as "callerName"

        FROM ${sql.identifier(schemaName)}.tickets t
        LEFT JOIN ${sql.identifier(schemaName)}.companies c 
          ON t.company_id = c.id
        LEFT JOIN ${sql.identifier(schemaName)}.customers caller 
          ON t.caller_id = caller.id
        WHERE t.id = ${id} 
          AND t.tenant_id = ${tenantId} 
          AND t.is_active = true
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
      // ✅ 1QA.MD: Use tenant-specific database instance
      const tenantDb = await this.getTenantDb(tenantId);
      const schemaName = this.getSchemaName(tenantId);
      const result = await tenantDb.execute(sql`
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

      // ✅ 1QA.MD: Use tenant-specific database instance
      const tenantDb = await this.getTenantDb(tenantId);
      const schemaName = this.getSchemaName(tenantId);
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
      const countResult = await tenantDb.execute(sql.raw(`
        SELECT COUNT(*) as total
        FROM ${schemaName}.tickets
        WHERE is_active = true ${whereClause}
      `, whereParams));

      const total = Number(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / pagination.limit);

      // Fetch paginated results with JOIN para incluir dados de clientes e empresas
      const results = await tenantDb.execute(sql.raw(`
        SELECT 
          t.id,
          t.ticket_number    AS "number",
          t.title            AS "subject",
          t.description,
          t.status,
          t.priority,
          t.category,
          t.subcategory,
          t.caller_id        AS "callerId",
          t.assigned_to      AS "assignedTo",     -- corrigido
          t.tenant_id        AS "tenantId",
          t.created_at       AS "createdAt",
          t.updated_at       AS "updatedAt",
          t.company_id       AS "companyId",
          t.customer_id      AS "customerId",

          -- Dados da empresa
          c.name             AS "company_name",
          c.display_name     AS "company_display_name",

          -- Dados do cliente/caller
          caller.first_name  AS "caller_first_name",
          caller.last_name   AS "caller_last_name",
          caller.email       AS "caller_email",
          CONCAT(caller.first_name, ' ', caller.last_name) AS "caller_name",

          -- Dados do customer (beneficiário de fato)
          customer.first_name AS "customer_first_name",
          customer.last_name  AS "customer_last_name",
          customer.email      AS "customer_email",
          CONCAT(customer.first_name, ' ', customer.last_name) AS "customer_name"

        FROM ${schemaName}.tickets t
        LEFT JOIN ${schemaName}.companies c
          ON t.company_id = c.id
        LEFT JOIN ${schemaName}.customers caller
          ON t.caller_id = caller.id
        LEFT JOIN ${schemaName}.customers customer
          ON t.customer_id = customer.id
        WHERE t.is_active = true
          ${whereClause}
        ORDER BY t.created_at DESC
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
      // ✅ 1QA.MD: Use tenant-specific database instance
      const tenantDb = await this.getTenantDb(tenantId);
      const schemaName = this.getSchemaName(tenantId);
      const result = await tenantDb.execute(sql`
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
      // ✅ 1QA.MD: Use tenant-specific database instance
      const tenantDb = await this.getTenantDb(tenantId);
      const schemaName = this.getSchemaName(tenantId);
      const result = await tenantDb.execute(sql`
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

  async update(ticketId: string, updateData: any, tenantId: string): Promise<Ticket | null> {
    console.log('🔧 [DrizzleTicketRepositoryClean] Update called with:', {
      ticketId,
      tenantId,
      updateDataKeys: Object.keys(updateData || {}),
      updateDataSample: updateData
    });

    try {
      // ✅ CORREÇÃO CRÍTICA: Garantir que pool está disponível
      if (!this.pool) {
        await this.initializePool();
        if (!this.pool) {
          throw new Error('Database pool not available');
        }
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log('🔧 [DrizzleTicketRepositoryClean] FINAL SCHEMA-COMPLIANT UPDATE');

      // ✅ CORREÇÃO CRÍTICA: Sanitizar e validar dados antes da atualização
      const sanitizedData = {};

      // Map of allowed fields (only fields that exist in the database schema)
      const allowedFields = [
        'title',                // corresponde ao "subject"
        'description',
        'status',
        'priority',
        'category',
        'subcategory',
        'customer_id',
        'assigned_to',
        'company_id',
        'location_id',
        'caller_id',
        'estimated_hours',
        'actual_hours',
        'due_date',
        'resolution_date',
        'satisfaction_rating',
        'satisfaction_comment',
        'tags',
        'custom_fields',
        'metadata',
        'updated_at',
        'updated_by_id',
        'template_name',
        'template_alternative',
        'is_active'
      ];

      // Sanitize input data - only keep allowed fields with non-undefined values
      Object.entries(updateData).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          // Handle special data types
          if (key === 'followers' || key === 'tags') {
            sanitizedData[key] = Array.isArray(value) ? value : [];
          // Time tracking fields removed - not present in current schema
          } else if (key === 'updated_at') {
            sanitizedData[key] = value instanceof Date ? value.toISOString() : value;
          } else if (typeof value === 'string') {
            sanitizedData[key] = value.trim();
          } else {
            sanitizedData[key] = value;
          }
        }
      });

      console.log('🔧 [SANITIZED-DATA] Fields to update:', {
        original: Object.keys(updateData).length,
        sanitized: Object.keys(sanitizedData).length,
        sanitizedFields: Object.keys(sanitizedData),
        sanitizedData: sanitizedData,
        companyIdReceived: updateData.company_id,
        companyIdSanitized: sanitizedData.company_id
      });

      if (Object.keys(sanitizedData).length === 0) {
        console.log('⚠️ [DrizzleTicketRepositoryClean] No valid fields to update after sanitization');
        return this.findById(ticketId, tenantId);
      }

      // Build SQL with parameterized query
      const setFields = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(sanitizedData).forEach(([key, value]) => {
        setFields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      });

      // Add WHERE clause parameters
      const whereIdParam = paramIndex++;
      const whereTenantParam = paramIndex++;
      values.push(ticketId, tenantId);

      const sqlQuery = `
        UPDATE "${schemaName}".tickets 
        SET ${setFields.join(', ')}
        WHERE id = $${whereIdParam} AND tenant_id = $${whereTenantParam}
        RETURNING *
      `;

      console.log('🔧 [SQL-EXECUTION] Executing update:', {
        sql: sqlQuery.replace(/\$\d+/g, '?'),
        fieldsCount: setFields.length,
        valuesCount: values.length,
        parameterMapping: setFields.map((field, idx) => `${field} = ${values[idx]}`)
      });

      // Execute the update
      const { rows } = await this.pool.query(sqlQuery, values);

      if (!rows || rows.length === 0) {
        throw new Error(`No ticket found with ID ${ticketId} in tenant ${tenantId}`);
      }

      console.log('✅ [UPDATE-SUCCESS] Ticket updated successfully:', {
        ticketId,
        fieldsUpdated: Object.keys(sanitizedData).length,
        rowsAffected: rows.length
      });

      // Transform result back to domain entity
      const updatedRow = rows[0];
      const ticket = this.toDomainEntity(updatedRow);

      return ticket;

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRepositoryClean] Error in update:', {
        error: error.message,
        ticketId,
        tenantId,
        stack: error.stack
      });
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  }

  private toDomainEntity(row: any): Ticket {
    return {
      id: row.id,
      number: row.number,
      subject: row.subject,
      description: row.description,
      status: row.status,
      priority: row.priority,
      urgency: row.urgency,
      impact: row.impact,
      category: row.category,
      subcategory: row.subcategory,
      action: row.action,
      callerId: row.caller_id,
      callerType: row.caller_type,
      beneficiaryId: row.beneficiary_id,
      beneficiaryType: row.beneficiary_type,
      assignedToId: row.assigned_to_id,
      assignmentGroupId: row.assignment_group,
      companyId: row.company_id,
      location: row.location,
      contactType: row.contact_type,
      businessImpact: row.business_impact,
      symptoms: row.symptoms,
      workaround: row.workaround,
      environment: row.environment,
      templateAlternative: row.template_alternative,
      linkTicketNumber: row.link_ticket_number,
      linkType: row.link_type,
      linkComment: row.link_comment,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      tenantId: row.tenant_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.opened_by_id,
      updatedBy: row.updated_by_id,
      isActive: row.is_active,
      followers: row.followers || [],
      tags: row.tags || []
    };
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

      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb.execute(query);
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
      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.execute(sql`
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
      const tenantDb = await this.getTenantDb(tenantId);
      const totalResult = await tenantDb.execute(sql`
        SELECT COUNT(*) as total FROM ${sql.identifier(schemaName)}.tickets WHERE is_active = true AND tenant_id = ${tenantId}
      `);
      const total = Number(totalResult.rows[0]?.total || 0);

      // Get count by status
      const statusResult = await tenantDb.execute(sql`
        SELECT status, COUNT(*) as count FROM ${sql.identifier(schemaName)}.tickets WHERE is_active = true AND tenant_id = ${tenantId} GROUP BY status
      `);
      const byStatus: Record<string, number> = statusResult.rows.reduce((acc, row: any) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // Get count by priority
      const priorityResult = await tenantDb.execute(sql`
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
      const todayResult = await tenantDb.execute(sql`
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