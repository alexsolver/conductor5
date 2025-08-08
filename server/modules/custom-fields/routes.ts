import { Router } from 'express';
import { CustomFieldsController } from './CustomFieldsController';
import { CustomFieldsRepository } from './CustomFieldsRepository';
import { schemaManager } from '../../db';
import { AuthenticatedRequest } from './CustomFieldsController';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Hybrid authentication middleware - supports both JWT and session
const hybridAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for JWT token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        // Use JWT auth
        const { jwtAuth } = await import('../../middleware/jwtAuth');
        return jwtAuth(req, res, next);
      }
    }

    // Fall back to session authentication
    if (req.session && req.session.user) {
      req.user = {
        id: req.session.user.id,
        tenantId: req.session.user.tenantId || req.session.user.tenant_id,
        role: req.session.user.role,
        email: req.session.user.email
      };
      return next();
    }

    return res.status(401).json({ 
      message: 'Authentication required - use JWT token or browser session' 
    });
  } catch (error) {
    console.error('❌ [Custom Fields Auth] Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

try {
  const customFieldsRepository = new CustomFieldsRepository(schemaManager);
  const customFieldsController = new CustomFieldsController(customFieldsRepository);

  // Apply hybrid authentication middleware
  router.use(hybridAuth);

  console.log('🔧 [Custom Fields Routes] Hybrid authentication middleware applied');


  // Routes for field metadata management
  router.get('/fields/:moduleType', async (req, res) => {
    try {
      await customFieldsController.getFieldsByModule(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in getFieldsByModule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/fields/single/:fieldId', async (req, res) => {
    try {
      await customFieldsController.getFieldById(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in getFieldById:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/fields', async (req, res) => {
    try {
      await customFieldsController.createField(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in createField:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.put('/fields/:fieldId', async (req, res) => {
    try {
      await customFieldsController.updateField(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in updateField:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/fields/:fieldId', async (req, res) => {
    try {
      await customFieldsController.deleteField(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in deleteField:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Routes for field ordering
  router.post('/fields/:moduleType/reorder', async (req, res) => {
    try {
      await customFieldsController.reorderFields(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in reorderFields:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Routes for entity values
  router.get('/values/:entityType/:entityId', async (req, res) => {
    try {
      await customFieldsController.getEntityValues(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in getEntityValues:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/values/:entityType/:entityId', async (req, res) => {
    try {
      await customFieldsController.saveEntityValues(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in saveEntityValues:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/values/:entityType/:entityId', async (req, res) => {
    try {
      await customFieldsController.deleteEntityValues(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in deleteEntityValues:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Routes for module access management
  router.get('/access', async (req, res) => {
    try {
      await customFieldsController.getTenantModuleAccess(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in getTenantModuleAccess:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.put('/access/:moduleType', async (req, res) => {
    try {
      await customFieldsController.updateModuleAccess(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in updateModuleAccess:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Routes for statistics
  router.get('/stats/:moduleType', async (req, res) => {
    try {
      await customFieldsController.getModuleFieldStats(req as any, res);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error in getModuleFieldStats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  console.log('✅ [CUSTOM-FIELDS] Routes initialized successfully');

} catch (error) {
  console.error('❌ [CUSTOM-FIELDS] Failed to initialize routes:', error);

  // Fallback error route
  router.use('*', (req, res) => {
    res.status(500).json({
      error: 'Custom fields module is temporarily unavailable',
      message: 'Please try again later'
    });
  });
}

export default router;