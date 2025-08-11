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
    console.error('Error fetching tickets with relationships:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar tickets com relacionamentos' });
  }
});

export default router;