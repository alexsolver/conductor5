
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
router.get('/fields/:moduleType', jwtAuth, async (req: any, res: any) => {
  const startTime = Date.now();
  logger.logInfo('=== GET /fields/:moduleType ROUTE CALLED ===', { 
    moduleType: req.params.moduleType,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  try {
    logger.logInfo('Route middleware validation passed, calling controller...');
    await customFieldController.getFieldsByModule(req, res);
    
    const duration = Date.now() - startTime;
    logger.logInfo(`Route completed successfully in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(`Route error after ${duration}ms:`, error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error in custom fields route',
        details: (error as Error).message 
      });
    }
  }
});

router.post('/fields', jwtAuth, async (req: any, res: any) => {
  const startTime = Date.now();
  logger.logInfo('=== POST /fields ROUTE CALLED ===', {
    body: req.body,
    user: req.user,
    timestamp: new Date().toISOString()
  });

  try {
    await customFieldController.createField(req, res);
    
    const duration = Date.now() - startTime;
    logger.logInfo(`POST /fields completed successfully in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(`POST /fields error after ${duration}ms:`, error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error in create custom field route',
        details: (error as Error).message 
      });
    }
  }
});

router.put('/fields/:fieldId', jwtAuth, async (req: any, res: any) => {
  const startTime = Date.now();
  logger.logInfo('=== PUT /fields/:fieldId ROUTE CALLED ===', { 
    fieldId: req.params.fieldId,
    timestamp: new Date().toISOString()
  });

  try {
    await customFieldController.updateField(req, res);
    
    const duration = Date.now() - startTime;
    logger.logInfo(`PUT /fields/:fieldId completed successfully in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(`PUT /fields/:fieldId error after ${duration}ms:`, error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error in update custom field route',
        details: (error as Error).message 
      });
    }
  }
});

router.delete('/fields/:fieldId', jwtAuth, async (req: any, res: any) => {
  const startTime = Date.now();
  logger.logInfo('=== DELETE /fields/:fieldId ROUTE CALLED ===', { 
    fieldId: req.params.fieldId,
    timestamp: new Date().toISOString()
  });

  try {
    await customFieldController.deleteField(req, res);
    
    const duration = Date.now() - startTime;
    logger.logInfo(`DELETE /fields/:fieldId completed successfully in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(`DELETE /fields/:fieldId error after ${duration}ms:`, error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error in delete custom field route',
        details: (error as Error).message 
      });
    }
  }
});

console.log('🔥 [CUSTOM-FIELDS-ROUTER] All routes registered successfully following 1qa.md');

export default router;
