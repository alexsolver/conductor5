import { Router } from 'express';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission } from '../middleware/rbacMiddleware';

const router = Router();

// Get all ticket templates for tenant
router.get('/',
  jwtAuth,
  requirePermission('tickets', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Simplified - return empty array for now
      res.json({ templates: [] });
    } catch (error) {
      console.error('Error fetching ticket templates:', error);
      res.status(500).json({ message: 'Failed to fetch ticket templates' });
    }
  }
);

export default router;