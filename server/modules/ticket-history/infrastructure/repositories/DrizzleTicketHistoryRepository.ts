/**
 * DrizzleTicketHistoryRepository - Clean Architecture Implementation
 * Follows 1qa.md specifications exactly
 * 
 * @module DrizzleTicketHistoryRepository
 * @created 2025-08-14 - Clean Architecture compliance
 */

import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';
import { TicketHistory, CreateTicketHistoryData } from '../../domain/entities/TicketHistory';
import { pool } from '../../../../db';
import { v4 as uuidv4 } from 'uuid';

export class DrizzleTicketHistoryRepository implements ITicketHistoryRepository {
  
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async create(data: CreateTicketHistoryData): Promise<TicketHistory> {
    console.log('📝 [DrizzleTicketHistoryRepository] Creating history entry:', { 
      ticketId: data.ticketId,
      actionType: data.actionType,
      fieldName: data.fieldName
    });

    try {
      const schemaName = this.getSchemaName(data.tenantId);
      const id = uuidv4();
      const now = new Date().toISOString();

      const query = `
        INSERT INTO "${schemaName}".ticket_history (
          id, ticket_id, action_type, field_name, old_value, new_value,
          performed_by, performed_by_name, ip_address, user_agent, session_id,
          description, metadata, created_at, tenant_id, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `;

      const values = [
        id,
        data.ticketId,
        data.actionType,
        data.fieldName || null,
        data.oldValue || null,
        data.newValue || null,
        data.performedBy,
        data.performedByName,
        data.ipAddress || null,
        data.userAgent || null,
        data.sessionId || 'no-session',
        data.description,
        JSON.stringify(data.metadata || {}),
        now,
        data.tenantId,
        true
      ];

      const result = await pool.query(query, values);
      const row = result.rows[0];

      console.log('✅ [DrizzleTicketHistoryRepository] History created:', row.id);

      return {
        id: row.id,
        ticketId: row.ticket_id,
        actionType: row.action_type,
        fieldName: row.field_name,
        oldValue: row.old_value,
        newValue: row.new_value,
        performedBy: row.performed_by,
        performedByName: row.performed_by_name,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        sessionId: row.session_id,
        description: row.description,
        metadata: row.metadata,
        createdAt: row.created_at,
        tenantId: row.tenant_id,
        isActive: row.is_active
      };

    } catch (error: any) {
      console.error('❌ [DrizzleTicketHistoryRepository] Error creating history:', error);
      throw new Error(`Failed to create ticket history: ${error.message}`);
    }
  }

  async findByTicketId(ticketId: string, tenantId: string): Promise<TicketHistory[]> {
    console.log('🔍 [DrizzleTicketHistoryRepository] Finding history for ticket:', ticketId);

    try {
      const schemaName = this.getSchemaName(tenantId);

      const query = `
        SELECT 
          id, ticket_id, action_type, field_name, old_value, new_value,
          performed_by, performed_by_name, ip_address, user_agent, session_id,
          description, metadata, created_at, tenant_id, is_active
        FROM "${schemaName}".ticket_history
        WHERE ticket_id = $1 AND tenant_id = $2 AND is_active = true
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [ticketId, tenantId]);

      console.log('✅ [DrizzleTicketHistoryRepository] Found history entries:', result.rows.length);

      return result.rows.map(row => ({
        id: row.id,
        ticketId: row.ticket_id,
        actionType: row.action_type,
        fieldName: row.field_name,
        oldValue: row.old_value,
        newValue: row.new_value,
        performedBy: row.performed_by,
        performedByName: row.performed_by_name,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        sessionId: row.session_id,
        description: row.description,
        metadata: row.metadata,
        createdAt: row.created_at,
        tenantId: row.tenant_id,
        isActive: row.is_active
      }));

    } catch (error: any) {
      console.error('❌ [DrizzleTicketHistoryRepository] Error finding history:', error);
      throw new Error(`Failed to find ticket history: ${error.message}`);
    }
  }

  async findById(id: string, tenantId: string): Promise<TicketHistory | null> {
    console.log('🔍 [DrizzleTicketHistoryRepository] Finding history by ID:', id);

    try {
      const schemaName = this.getSchemaName(tenantId);

      const query = `
        SELECT 
          id, ticket_id, action_type, field_name, old_value, new_value,
          performed_by, performed_by_name, ip_address, user_agent, session_id,
          description, metadata, created_at, tenant_id, is_active
        FROM "${schemaName}".ticket_history
        WHERE id = $1 AND tenant_id = $2 AND is_active = true
        LIMIT 1
      `;

      const result = await pool.query(query, [id, tenantId]);

      if (result.rows.length === 0) {
        console.log('❌ [DrizzleTicketHistoryRepository] History not found:', id);
        return null;
      }

      const row = result.rows[0];
      console.log('✅ [DrizzleTicketHistoryRepository] History found:', row.id);

      return {
        id: row.id,
        ticketId: row.ticket_id,
        actionType: row.action_type,
        fieldName: row.field_name,
        oldValue: row.old_value,
        newValue: row.new_value,
        performedBy: row.performed_by,
        performedByName: row.performed_by_name,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        sessionId: row.session_id,
        description: row.description,
        metadata: row.metadata,
        createdAt: row.created_at,
        tenantId: row.tenant_id,
        isActive: row.is_active
      };

    } catch (error: any) {
      console.error('❌ [DrizzleTicketHistoryRepository] Error finding history by ID:', error);
      throw new Error(`Failed to find ticket history by ID: ${error.message}`);
    }
  }
}