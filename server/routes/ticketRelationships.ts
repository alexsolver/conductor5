import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../middleware/jwtAuth';
import { getStorage } from '../storage-simple';
import { logInfo, logError } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/standardResponse';

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// Search tickets
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const query = req.query.q as string;

    if (!tenantId) {
      return sendError(res, "Tenant ID is required", "Tenant ID is required", 400);
    }

    if (!query || query.length < 3) {
      return sendSuccess(res, [], "Query too short - minimum 3 characters required");
    }

    const storage = await getStorage();
    const tickets = await storage.searchTickets(tenantId, query);
    return sendSuccess(res, tickets, "Tickets searched successfully");
  } catch (error) {
    logError('Error searching tickets', error, { tenantId: req.user?.tenantId, query: req.query.q });
    return sendError(res, error, "Failed to search tickets", 500);
  }
});

// Get ticket relationships
router.get('/:id/relationships', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!tenantId) {
      return sendError(res, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const relationships = await storage.getTicketRelationships(tenantId, id);
    return sendSuccess(res, relationships, "Ticket relationships retrieved successfully");
  } catch (error) {
    logError('Error fetching ticket relationships', error, { tenantId: req.user?.tenantId, ticketId: req.params.id });
    return sendError(res, error, "Failed to fetch ticket relationships", 500);
  }
});

// Create ticket relationship
router.post('/:id/relationships', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!tenantId) {
      return sendError(res, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const relationship = await storage.createTicketRelationship(tenantId, id, req.body);
    
    logInfo('Ticket relationship created', { tenantId, ticketId: id, relationshipId: relationship?.id });
    return sendSuccess(res, relationship, "Ticket relationship created successfully", 201);
  } catch (error) {
    logError('Error creating ticket relationship', error, { tenantId: req.user?.tenantId, ticketId: req.params.id, data: req.body });
    return sendError(res, error, "Failed to create ticket relationship", 500);
  }
});

// Delete ticket relationship
router.delete('/relationships/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!tenantId) {
      return sendError(res, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const success = await storage.deleteTicketRelationship(tenantId, id);
    
    if (!success) {
      return sendError(res, "Relationship not found", "Relationship not found", 404);
    }

    logInfo('Ticket relationship deleted', { tenantId, relationshipId: id });
    return sendSuccess(res, null, "Ticket relationship deleted successfully", 204);
  } catch (error) {
    logError('Error deleting ticket relationship', error, { tenantId: req.user?.tenantId, relationshipId: req.params.id });
    return sendError(res, error, "Failed to delete ticket relationship", 500);
  }
});

// Get ticket hierarchy
router.get('/:id/hierarchy', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!tenantId) {
      return sendError(res, "Tenant ID is required", "Tenant ID is required", 400);
    }

    const storage = await getStorage();
    const hierarchy = await storage.getTicketHierarchy(tenantId, id);
    return sendSuccess(res, hierarchy, "Ticket hierarchy retrieved successfully");
  } catch (error) {
    logError('Error fetching ticket hierarchy', error, { tenantId: req.user?.tenantId, ticketId: req.params.id });
    return sendError(res, error, "Failed to fetch ticket hierarchy", 500);
  }
});

export default router;