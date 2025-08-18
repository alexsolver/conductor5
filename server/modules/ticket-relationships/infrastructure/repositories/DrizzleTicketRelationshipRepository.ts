/**
 * DrizzleTicketRelationshipRepository - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module DrizzleTicketRelationshipRepository
 */

import { ITicketRelationshipRepository } from '../../domain/repositories/ITicketRelationshipRepository';
import { TicketRelationship, TicketRelationshipWithDetails } from '../../domain/entities/TicketRelationship';

export class DrizzleTicketRelationshipRepository implements ITicketRelationshipRepository {
  private pool: any;

  constructor() {
    this.initializePool();
  }

  private async initializePool() {
    const { schemaManager } = await import('../../../../db');
    this.pool = schemaManager.getPool();
  }

  async findRelationshipsByTicketId(ticketId: string, tenantId: string): Promise<TicketRelationshipWithDetails[]> {
    console.log('🔍 [DrizzleTicketRelationshipRepository] Finding relationships for ticket:', ticketId);

    const { schemaManager } = await import('../../../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);

    try {
      // Get relationships with related ticket details following 1qa.md patterns
      // FIXED: Use direct ticket lookup for accurate, real-time data
      const result = await pool.query(`
        SELECT 
          tr.*,
          CASE 
            WHEN tr.source_ticket_id = $1 THEN 'outgoing'
            ELSE 'incoming'
          END as direction,
          CASE 
            WHEN tr.source_ticket_id = $1 THEN tr.target_ticket_id
            ELSE tr.source_ticket_id
          END as related_ticket_id
        FROM "${schemaName}".ticket_relationships tr
        WHERE (tr.source_ticket_id = $1 OR tr.target_ticket_id = $1)
        ORDER BY tr.created_at DESC
      `, [ticketId]);

      console.log(`🔗 [RELATIONSHIP-REPOSITORY] Found ${result.rows.length} relationships for ticket ${ticketId}`);
      console.log(`🔗 [RELATIONSHIP-REPOSITORY] Raw query results:`, result.rows);

      if (result.rows.length === 0) {
        console.log(`🔗 [RELATIONSHIP-REPOSITORY] No relationships found for ticket ${ticketId}`);
        return [];
      }

      // For each relationship, get current ticket data to ensure accuracy
      const relationshipsWithDetails = await Promise.all(
        result.rows.map(async (row) => {
          const relatedTicketId = row.direction === 'outgoing' ? row.target_ticket_id : row.source_ticket_id;

          try {
            // Get fresh ticket data to avoid stale information
            const ticketResult = await pool.query(`
              SELECT id, number, subject, status, priority, category, updated_at
              FROM "${schemaName}".tickets 
              WHERE id = $1
            `, [relatedTicketId]);

            const relatedTicket = ticketResult.rows[0];

            return {
              ...row,
              related_ticket_id: relatedTicketId,
              related_ticket_number: relatedTicket?.number || 'N/A',
              related_ticket_subject: relatedTicket?.subject || 'Ticket não encontrado',
              related_ticket_status: relatedTicket?.status || 'unknown',
              related_ticket_priority: relatedTicket?.priority || null,
              related_ticket_category: relatedTicket?.category || null,
              related_ticket_updated_at: relatedTicket?.updated_at || null
            };
          } catch (ticketError: any) {
            console.warn('⚠️ [DrizzleTicketRelationshipRepository] Could not fetch related ticket:', relatedTicketId, ticketError.message);
            return {
              ...row,
              related_ticket_id: relatedTicketId,
              related_ticket_number: 'ERR-' + relatedTicketId.slice(-8),
              related_ticket_subject: 'Erro ao carregar ticket',
              related_ticket_status: 'error',
              related_ticket_priority: null,
              related_ticket_category: null,
              related_ticket_updated_at: null
            };
          }
        })
      );

      console.log('✅ [DrizzleTicketRelationshipRepository] Found relationships:', relationshipsWithDetails.length);

      return relationshipsWithDetails.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        sourceTicketId: row.source_ticket_id,
        targetTicketId: row.target_ticket_id,
        relationshipType: row.relationship_type,
        description: row.description,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: true,
        direction: row.direction,
        relatedTicketId: row.related_ticket_id,
        relatedTicketNumber: row.related_ticket_number,
        relatedTicketSubject: row.related_ticket_subject,
        relatedTicketStatus: row.related_ticket_status
      }));

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRelationshipRepository] Error finding relationships:', error);
      throw new Error(`Failed to find relationships: ${error.message}`);
    }
  }

  async countRelationshipsByTicketId(ticketId: string, tenantId: string): Promise<number> {
    console.log('📊 [DrizzleTicketRelationshipRepository] Counting relationships for ticket:', ticketId);

    const { schemaManager } = await import('../../../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);

    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM "${schemaName}".ticket_relationships 
        WHERE source_ticket_id = $1 OR target_ticket_id = $1
      `, [ticketId]);

      const count = parseInt(result.rows[0]?.count || '0');
      console.log('✅ [DrizzleTicketRelationshipRepository] Relationship count:', count);
      return count;

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRelationshipRepository] Error counting relationships:', error);
      throw new Error(`Failed to count relationships: ${error.message}`);
    }
  }

  async create(relationship: Omit<TicketRelationship, 'id' | 'createdAt' | 'updatedAt'>): Promise<TicketRelationship> {
    console.log('📝 [DrizzleTicketRelationshipRepository] Creating relationship');

    const { schemaManager } = await import('../../../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(relationship.tenantId);
    const { v4: uuidv4 } = await import('uuid');

    try {
      const relationshipId = uuidv4();
      const result = await pool.query(`
        INSERT INTO "${schemaName}".ticket_relationships 
        (id, tenant_id, source_ticket_id, target_ticket_id, relationship_type, description, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        relationshipId,
        relationship.tenantId,
        relationship.sourceTicketId,
        relationship.targetTicketId,
        relationship.relationshipType,
        relationship.description || null,
        relationship.createdBy
      ]);

      console.log('✅ [DrizzleTicketRelationshipRepository] Relationship created:', relationshipId);

      const row = result.rows[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        sourceTicketId: row.source_ticket_id,
        targetTicketId: row.target_ticket_id,
        relationshipType: row.relationship_type,
        description: row.description,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: row.is_active
      };

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRelationshipRepository] Error creating relationship:', error);
      throw new Error(`Failed to create relationship: ${error.message}`);
    }
  }

  async findById(id: string, tenantId: string): Promise<TicketRelationship | null> {
    console.log('🔍 [DrizzleTicketRelationshipRepository] Finding relationship by ID:', id);

    const { schemaManager } = await import('../../../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);

    try {
      const result = await pool.query(`
        SELECT * FROM "${schemaName}".ticket_relationships 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]);

      if (result.rows.length === 0) {
        console.log('❌ [DrizzleTicketRelationshipRepository] Relationship not found:', id);
        return null;
      }

      const row = result.rows[0];
      console.log('✅ [DrizzleTicketRelationshipRepository] Relationship found:', id);

      return {
        id: row.id,
        tenantId: row.tenant_id,
        sourceTicketId: row.source_ticket_id,
        targetTicketId: row.target_ticket_id,
        relationshipType: row.relationship_type,
        description: row.description,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: row.is_active
      };

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRelationshipRepository] Error finding relationship:', error);
      throw new Error(`Failed to find relationship: ${error.message}`);
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    console.log('🗑️ [DrizzleTicketRelationshipRepository] Deleting relationship:', id);

    const { schemaManager } = await import('../../../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);

    try {
      const result = await pool.query(`
        DELETE FROM "${schemaName}".ticket_relationships 
        WHERE id = $1 AND tenant_id = $2
        RETURNING id
      `, [id, tenantId]);

      const deleted = result.rows.length > 0;
      console.log('✅ [DrizzleTicketRelationshipRepository] Relationship deleted:', deleted);
      return deleted;

    } catch (error: any) {
      console.error('❌ [DrizzleTicketRelationshipRepository] Error deleting relationship:', error);
      throw new Error(`Failed to delete relationship: ${error.message}`);
    }
  }
}