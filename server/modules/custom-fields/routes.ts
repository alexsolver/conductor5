// ✅ 1QA.MD COMPLIANCE: CUSTOM FIELDS ROUTES
// Infrastructure layer - Express route definitions following Clean Architecture

console.log('🔥 [CUSTOM-FIELDS-ROUTER] *** FILE LOADING START *** following 1qa.md');
console.log('🔥 [CUSTOM-FIELDS-ROUTER] Timestamp:', new Date().toISOString());

import { Router } from 'express';
import { CustomFieldController } from './application/controllers/CustomFieldController';
import { SimplifiedCustomFieldRepository } from './infrastructure/repositories/SimplifiedCustomFieldRepository';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

console.log('🔥 [CUSTOM-FIELDS-ROUTER] *** ROUTER CREATED *** following 1qa.md');
console.log('🔥 [CUSTOM-FIELDS-ROUTER] Router type:', typeof router);

// ✅ 1QA.MD: Initialize repository and controller
const customFieldRepository = new SimplifiedCustomFieldRepository();
const logger = {
  logInfo: (msg: string, data?: any) => console.log(`[CUSTOM-FIELDS] ${msg}`, data || ''),
  logError: (msg: string, error?: any) => console.error(`[CUSTOM-FIELDS-ERROR] ${msg}`, error || '')
};

const customFieldController = new CustomFieldController(customFieldRepository, logger);

console.log('🔥 [CUSTOM-FIELDS-ROUTER] Controllers initialized following Clean Architecture');

// ✅ 1QA.MD: All routes use JWT authentication middleware
router.get('/fields/:moduleType', jwtAuth, async (req, res) => {
  logger.logInfo('GET /fields/:moduleType called', { moduleType: req.params.moduleType });

  try {
    await customFieldController.getFieldsByModule(req, res);
  } catch (error) {
    logger.logError('Route error in getFieldsByModule:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

router.post('/fields', jwtAuth, async (req, res) => {
  logger.logInfo('POST /fields called - FIELD CREATION WORKING!', { 
    body: req.body, 
    user: req.user,
    timestamp: new Date().toISOString()
  });

  try {
    await customFieldController.createField(req, res);
    logger.logInfo('POST /fields completed successfully');
  } catch (error) {
    logger.logError('Route error in createField:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

router.put('/fields/:fieldId', jwtAuth, async (req, res) => {
  logger.logInfo('PUT /fields/:fieldId called', { fieldId: req.params.fieldId });

  try {
    await customFieldController.updateField(req, res);
  } catch (error) {
    logger.logError('Route error in updateField:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

router.delete('/fields/:fieldId', jwtAuth, async (req, res) => {
  logger.logInfo('DELETE /fields/:fieldId called', { fieldId: req.params.fieldId });

  try {
    await customFieldController.deleteField(req, res);
  } catch (error) {
    logger.logError('Route error in deleteField:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

console.log('🔥 [CUSTOM-FIELDS-ROUTER] All routes registered successfully following 1qa.md');

export default router;