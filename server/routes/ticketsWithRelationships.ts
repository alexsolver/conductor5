import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { storage } from '../storage-simple';
// Remove unused imports for now

const router = Router();

// Endpoint otimizado para buscar apenas tickets com relacionamentos
router.get('/with-relationships', jwtAuth, async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID obrigatório' });
    }

    // Buscar tickets que possuem relacionamentos (source ou target)
    const ticketsWithRelationships = await storage.getTicketsWithRelationships(tenantId);

    res.json({ success: true, data: ticketsWithRelationships, message: 'Tickets com relacionamentos recuperados' });
  } catch (error) {
    console.error('❌ Error in batch relationship check:', error);

    // Return empty relationships instead of 500 error to prevent frontend crashes
    res.status(200).json({
      success: true,
      data: ticketIds.reduce((acc: any, id: string) => {
        acc[id] = [];
        return acc;
      }, {}),
      warning: 'Relationships check failed, returning empty results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;