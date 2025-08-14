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

export default router;