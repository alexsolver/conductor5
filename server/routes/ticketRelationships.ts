import { Router } from 'express''[,;]
import { AuthenticatedRequest, jwtAuth } from '../middleware/jwtAuth''[,;]
import { getStorage } from '../storage-simple''[,;]
import { logInfo, logError } from '../utils/logger''[,;]

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// Search tickets
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const query = req.query.q as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    if (!query || query.length < 3) {
      return res.json([]);
    }

    const storage = await getStorage();
    const tickets = await storage.searchTickets(tenantId, query);
    res.json(tickets);
  } catch (error) {
    logError('Error searching tickets', error, { tenantId: req.user?.tenantId, query: req.query.q });
    res.status(500).json({ error: 'Failed to search tickets' });
  }
});

// Get ticket relationships
router.get('/:id/relationships', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const storage = await getStorage();
    const relationships = await storage.getTicketRelationships(tenantId, id);
    res.json(relationships);
  } catch (error) {
    logError('Error fetching ticket relationships', error, { tenantId: req.user?.tenantId, ticketId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch ticket relationships' });
  }
});

// Create ticket relationship
router.post('/:id/relationships', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const storage = await getStorage();
    const relationship = await storage.createTicketRelationship(tenantId, id, req.body);
    
    logInfo('Ticket relationship created', { tenantId, ticketId: id, relationshipId: relationship?.id });
    res.json(relationship);
  } catch (error) {
    logError('Error creating ticket relationship', error, { tenantId: req.user?.tenantId, ticketId: req.params.id, data: req.body });
    res.status(500).json({ error: 'Failed to create ticket relationship' });
  }
});

// Delete ticket relationship
router.delete('/relationships/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const storage = await getStorage();
    const success = await storage.deleteTicketRelationship(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    logInfo('Ticket relationship deleted', { relationshipId: id });
    res.json({ success: true });
  } catch (error) {
    logError('Error deleting ticket relationship', error, { relationshipId: req.params.id });
    res.status(500).json({ error: 'Failed to delete ticket relationship' });
  }
});

// Get ticket hierarchy
router.get('/:id/hierarchy', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const storage = await getStorage();
    const hierarchy = await storage.getTicketHierarchy(tenantId, id);
    res.json(hierarchy);
  } catch (error) {
    logError('Error fetching ticket hierarchy', error, { tenantId: req.user?.tenantId, ticketId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch ticket hierarchy' });
  }
});

export default router;