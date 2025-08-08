import { Router } from 'express';
import { CustomFieldsController } from './CustomFieldsController';
import { CustomFieldsRepository } from './CustomFieldsRepository';
import { schemaManager } from '../../db';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

try {
  const customFieldsRepository = new CustomFieldsRepository(schemaManager);
  const customFieldsController = new CustomFieldsController(customFieldsRepository);

  // Middleware de autenticação para todas as rotas
  router.use(jwtAuth);

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