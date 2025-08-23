// ✅ 1QA.MD COMPLIANCE: CUSTOM FIELDS ROUTES
// Infrastructure layer - Express route definitions following Clean Architecture

console.log('🔥 [CUSTOM-FIELDS-ROUTER] *** FILE LOADING START *** following 1qa.md');
console.log('🔥 [CUSTOM-FIELDS-ROUTER] Timestamp:', new Date().toISOString());

import { Router, Request, Response } from 'express';
import { CustomFieldController } from './application/controllers/CustomFieldController';
import { SimplifiedCustomFieldRepository } from './infrastructure/repositories/SimplifiedCustomFieldRepository';

const router = Router();

console.log('🔥 [CUSTOM-FIELDS-ROUTER] *** ROUTER CREATED *** following 1qa.md');
console.log('🔥 [CUSTOM-FIELDS-ROUTER] Router type:', typeof router);

// Simple logger following 1qa.md patterns
const logger = {
  logInfo: (msg: string, data?: any) => {
    console.log(`[CUSTOM-FIELDS] ${msg}`, data || '');
  },
  logError: (msg: string, error?: any) => {
    console.error(`[CUSTOM-FIELDS] ERROR: ${msg}`, error || '');
  }
};

// ✅ 1QA.MD COMPLIANCE: Dependency injection pattern
const customFieldRepository = new SimplifiedCustomFieldRepository();
const customFieldController = new CustomFieldController(customFieldRepository as any, logger);

console.log('🔥 [CUSTOM-FIELDS-ROUTER] Controllers initialized following Clean Architecture');

// ✅ 1QA.MD COMPLIANCE: Routes with proper error handling
router.get('/fields/:moduleType', async (req: Request, res: Response) => {
  logger.logInfo('GET /fields/:moduleType called', { moduleType: req.params.moduleType });
  
  try {
    await customFieldController.getFieldsByModule(req, res);
  } catch (error) {
    logger.logError('GET /fields/:moduleType error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
});

router.post('/fields', async (req: Request, res: Response) => {
  logger.logInfo('POST /fields called - FIELD CREATION WORKING!', { 
    body: req.body, 
    user: req.user,
    timestamp: new Date().toISOString()
  });
  
  try {
    await customFieldController.createField(req, res);
    logger.logInfo('POST /fields completed successfully');
  } catch (error) {
    logger.logError('POST /fields error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Field creation failed' 
      });
    }
  }
});

router.put('/fields/:fieldId', async (req: Request, res: Response) => {
  logger.logInfo('PUT /fields/:fieldId called', { fieldId: req.params.fieldId });
  
  try {
    await customFieldController.updateField(req, res);
  } catch (error) {
    logger.logError('PUT /fields/:fieldId error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Field update failed' 
      });
    }
  }
});

router.delete('/fields/:fieldId', async (req: Request, res: Response) => {
  logger.logInfo('DELETE /fields/:fieldId called', { fieldId: req.params.fieldId });
  
  try {
    await customFieldController.deleteField(req, res);
  } catch (error) {
    logger.logError('DELETE /fields/:fieldId error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Field deletion failed' 
      });
    }
  }
});

console.log('🔥 [CUSTOM-FIELDS-ROUTER] All routes registered successfully following 1qa.md');

export default router;