import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../middleware/jwtAuth';
import { getStorage } from '../storage-simple';
import { logInfo, logError } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/standardResponse';
import { Response } from 'express';

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// Search tickets
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const query = req.query.q as string;

    if (!tenantId) {
      return sendError(res as any, "Tenant ID is required", "Tenant ID is required", 400);
    }

    if (!query || query.length < 3) {
      return sendSuccess(res as any, [], "Query too short - minimum 3 characters required");
    }

    const storage = await getStorage();
    const tickets = await storage.searchTickets(tenantId, query);
    return sendSuccess(res as any, tickets, "Tickets searched successfully");
  } catch (error) {
    logError('Error searching tickets', error as any, { tenantId: req.user?.tenantId, query: req.query.q });
    return sendError(res as any, error as any, "Failed to search tickets", 500);
  }
});

// Get ticket relationships
router.get('/:id/relationships', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    logInfo('Getting ticket relationships', { tenantId, ticketId: id });

    if (!tenantId) {
      return sendError(res as any, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const relationships = await storage.getTicketRelationships(tenantId, id);

    logInfo('Ticket relationships fetched', { 
      tenantId, 
      ticketId: id, 
      count: Array.isArray(relationships) ? relationships.length : 0,
      relationships: relationships 
    });

    return sendSuccess(res as any, relationships || [], "Ticket relationships retrieved successfully");
  } catch (error) {
    logError('Error fetching ticket relationships', error as any, { tenantId: req.user?.tenantId, ticketId: req.params.id });
    return sendError(res as any, error as any, "Failed to fetch ticket relationships", 500);
  }
});

// Create ticket relationship
router.post('/:id/relationships', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendError(res as any, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const relationship = await storage.createTicketRelationship(tenantId, id, req.body);

    logInfo('Ticket relationship created', { tenantId, ticketId: id, relationshipId: relationship?.id });
    return sendSuccess(res as any, relationship, "Ticket relationship created successfully", 201);
  } catch (error) {
    logError('Error creating ticket relationship', error as any, { tenantId: req.user?.tenantId, ticketId: req.params.id, data: req.body });
    return sendError(res as any, error as any, "Failed to create ticket relationship", 500);
  }
});

// 🔧 [1QA-COMPLIANCE] Batch check ticket relationships - Clean Architecture
router.post('/batch-relationships', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ticketIds } = req.body;

    logInfo('Batch relationships request', { 
      tenantId, 
      ticketIdsCount: Array.isArray(ticketIds) ? ticketIds.length : 0,
      requestBody: req.body 
    });

    if (!tenantId) {
      logError('Batch relationships: Missing tenant ID', {}, { tenantId });
      return sendError(res as any, "Tenant ID is required", "Tenant ID is required", 400);
    }

    if (!ticketIds || !Array.isArray(ticketIds)) {
      logError('Batch relationships: Invalid ticketIds', { ticketIds: typeof ticketIds }, { tenantId });
      return sendError(res as any, "ticketIds array is required", "ticketIds array is required", 400);
    }

    if (ticketIds.length === 0) {
      logInfo('Batch relationships: Empty ticketIds array', { tenantId });
      return sendSuccess(res as any, {}, "No tickets to check relationships for");
    }

    const storage = await getStorage();
    const batchResults: Record<string, any[]> = {};
    let totalRelationships = 0;
    let successCount = 0;
    let errorCount = 0;

    // 🚀 Processar relacionamentos em batch com error handling
    for (const ticketId of ticketIds) {
      try {
        if (!ticketId || typeof ticketId !== 'string') {
          logError('Invalid ticketId in batch', { ticketId }, { tenantId });
          batchResults[String(ticketId)] = [];
          errorCount++;
          continue;
        }

        const relationships = await storage.getTicketRelationships(tenantId, ticketId);
        const relationshipsArray = Array.isArray(relationships) ? relationships : [];

        batchResults[ticketId] = relationshipsArray;
        totalRelationships += relationshipsArray.length;
        successCount++;

        if (relationshipsArray.length > 0) {
          logInfo('Ticket relationships found', {
            ticketId,
            relationshipsCount: relationshipsArray.length
          });
        }

      } catch (error) {
        logError('Error fetching relationships for ticket', error as any, { tenantId, ticketId });
        batchResults[ticketId] = [];
        errorCount++;
      }
    }

    const summary = {
      tenantId,
      requestedTickets: ticketIds.length,
      successfulChecks: successCount,
      failedChecks: errorCount,
      totalRelationships,
      ticketsWithRelationships: Object.values(batchResults).filter(rels => rels.length > 0).length
    };

    logInfo('Batch relationships completed', summary);

    return sendSuccess(res as any, batchResults, `Batch relationships retrieved for ${ticketIds.length} tickets (${successCount} successful, ${errorCount} errors)`);

  } catch (error) {
    logError('Error in batch relationships check', error as any, { 
      tenantId: req.user?.tenantId, 
      ticketIds: req.body?.ticketIds,
      requestBody: req.body
    });
    return sendError(res as any, error as any, "Failed to fetch batch relationships", 500);
  }
});

// Delete ticket relationship
router.delete('/relationships/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendError(res as any, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const success = await storage.deleteTicketRelationship(id);

    if (!success) {
      return sendError(res as any, "Relationship not found", "Relationship not found", 404);
    }

    logInfo('Ticket relationship deleted', { tenantId, relationshipId: id });
    return sendSuccess(res as any, null, "Ticket relationship deleted successfully");
  } catch (error) {
    logError('Error deleting ticket relationship', error as any, { tenantId: req.user?.tenantId, relationshipId: req.params.id });
    return sendError(res as any, error as any, "Failed to delete ticket relationship", 500);
  }
});

// Get ticket hierarchy
router.get('/:id/hierarchy', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendError(res as any, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const hierarchy = await storage.getTicketHierarchy(tenantId, id);
    return sendSuccess(res as any, hierarchy, "Ticket hierarchy retrieved successfully");
  } catch (error) {
    logError('Error fetching ticket hierarchy', error as any, { tenantId: req.user?.tenantId, ticketId: req.params.id });
    return sendError(res as any, error as any, "Failed to fetch ticket hierarchy", 500);
  }
});

// Injecting the modified API endpoint for ticket relationships
// GET /api/ticket-relationships/:ticketId/relationships - Get all relationships for a ticket
  app.get('/api/ticket-relationships/:ticketId/relationships', jwtAuth, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({ success: false, message: "Must be authenticated with a tenant" });
      }

      const { ticketId } = req.params;
      const tenantId = req.user.tenantId;
      const { pool } = await import('../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log('🔗 [TICKET-RELATIONSHIPS] Fetching relationships for:', { ticketId, tenantId, schemaName });

      // Enhanced query with better ticket details and validation
      const query = `
        SELECT 
          tr.id,
          tr.source_ticket_id,
          tr.target_ticket_id,
          tr.relationship_type,
          tr.description,
          tr.created_at,
          tr.created_by,

          -- Target ticket details with fallbacks
          target_t.id as target_ticket_id_resolved,
          COALESCE(target_t.number, 'T-' || SUBSTRING(target_t.id::text, 1, 8)) as target_ticket_number,
          COALESCE(target_t.subject, 'Ticket sem assunto') as target_ticket_subject,
          COALESCE(target_t.status, 'unknown') as target_ticket_status,
          COALESCE(target_t.priority, 'medium') as target_ticket_priority,
          target_t.created_at as target_ticket_created_at,
          target_t.is_active as target_ticket_is_active,

          -- Source ticket details with fallbacks
          source_t.id as source_ticket_id_resolved,
          COALESCE(source_t.number, 'T-' || SUBSTRING(source_t.id::text, 1, 8)) as source_ticket_number,
          COALESCE(source_t.subject, 'Ticket sem assunto') as source_ticket_subject,
          COALESCE(source_t.status, 'unknown') as source_ticket_status,
          COALESCE(source_t.priority, 'medium') as source_ticket_priority,
          source_t.created_at as source_ticket_created_at,
          source_t.is_active as source_ticket_is_active

        FROM "${schemaName}".ticket_relationships tr
        LEFT JOIN "${schemaName}".tickets target_t ON tr.target_ticket_id = target_t.id AND target_t.tenant_id = $2
        LEFT JOIN "${schemaName}".tickets source_t ON tr.source_ticket_id = source_t.id AND source_t.tenant_id = $2
        WHERE (tr.source_ticket_id = $1 OR tr.target_ticket_id = $1)
          AND tr.tenant_id = $2
          AND tr.is_active = true
          -- Ensure we only get relationships where both tickets exist and are active
          AND ((tr.source_ticket_id = $1 AND target_t.is_active = true) 
               OR (tr.target_ticket_id = $1 AND source_t.is_active = true))
        ORDER BY tr.created_at DESC
      `;

      const result = await pool.query(query, [ticketId, tenantId]);

      console.log('🔗 [TICKET-RELATIONSHIPS] Raw query result:', {
        ticketId,
        rowCount: result.rows.length,
        firstRow: result.rows[0]
      });

      // Transform the result to include properly structured nested objects
      const relationships = result.rows
        .filter(row => {
          // Additional validation to ensure we have valid ticket data
          const isSourceRelationship = row.source_ticket_id === ticketId;
          const hasValidTargetTicket = isSourceRelationship ? 
            row.target_ticket_id_resolved && row.target_ticket_is_active : 
            row.source_ticket_id_resolved && row.source_ticket_is_active;

          if (!hasValidTargetTicket) {
            console.log('🔗 [TICKET-RELATIONSHIPS] Filtering out invalid relationship:', {
              relationshipId: row.id,
              isSourceRelationship,
              hasValidTargetTicket,
              targetTicketId: row.target_ticket_id_resolved,
              sourceTicketId: row.source_ticket_id_resolved
            });
          }

          return hasValidTargetTicket;
        })
        .map(row => {
          const isSourceRelationship = row.source_ticket_id === ticketId;

          // Build target ticket object based on relationship direction
          const targetTicket = isSourceRelationship ? {
            id: row.target_ticket_id_resolved,
            number: row.target_ticket_number,
            subject: row.target_ticket_subject,
            status: row.target_ticket_status,
            priority: row.target_ticket_priority,
            createdAt: row.target_ticket_created_at,
            isActive: row.target_ticket_is_active
          } : {
            id: row.source_ticket_id_resolved,
            number: row.source_ticket_number,
            subject: row.source_ticket_subject,
            status: row.source_ticket_status,
            priority: row.source_ticket_priority,
            createdAt: row.source_ticket_created_at,
            isActive: row.source_ticket_is_active
          };

          const relationship = {
            id: row.id,
            sourceTicketId: row.source_ticket_id,
            targetTicketId: row.target_ticket_id,
            relationshipType: row.relationship_type,
            description: row.description || '',
            createdAt: row.created_at,
            createdBy: row.created_by,
            targetTicket,
            // Legacy compatibility fields
            relationship_type: row.relationship_type,
            // Direct fields for simpler access
            number: targetTicket.number,
            subject: targetTicket.subject,
            status: targetTicket.status,
            priority: targetTicket.priority
          };

          console.log('🔗 [TICKET-RELATIONSHIPS] Mapped relationship:', {
            id: relationship.id,
            type: relationship.relationshipType,
            targetTicket: relationship.targetTicket,
            isSourceRelationship
          });

          return relationship;
        });

      console.log('🔗 [TICKET-RELATIONSHIPS] Final relationships response:', {
        ticketId,
        count: relationships.length,
        relationshipTypes: relationships.map(r => r.relationshipType),
        hasValidData: relationships.length > 0 && relationships[0].targetTicket?.id
      });

      res.json({
        success: true,
        data: relationships,
        count: relationships.length,
        metadata: {
          ticketId,
          tenantId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('🔗 [TICKET-RELATIONSHIPS] Error fetching relationships:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching ticket relationships',
        error: error.message
      });
    }
  });

export default router;