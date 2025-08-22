
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { CustomFieldController } from './application/controllers/CustomFieldController';
import { SimplifiedCustomFieldRepository } from './infrastructure/repositories/SimplifiedCustomFieldRepository';

const router = Router();

// ✅ 1QA.MD: Initialize dependencies following clean architecture
const customFieldRepository = new SimplifiedCustomFieldRepository();
const logger = {
  logInfo: (message: string, data?: any) => console.log(`[CUSTOM-FIELDS] ${message}`, data),
  logError: (message: string, error?: any) => console.error(`[CUSTOM-FIELDS-ERROR] ${message}`, error)
};
const customFieldController = new CustomFieldController(customFieldRepository, logger);

// ✅ 1QA.MD: Apply authentication middleware to all routes
router.use(jwtAuth);

// ✅ 1QA.MD: CRUD routes for custom fields
router.post('/fields', async (req, res) => {
  try {
    await customFieldController.createField(req, res);
  } catch (error) {
    logger.logError('Error in create field route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/fields/:moduleType', async (req, res) => {
  try {
    await customFieldController.getFieldsByModule(req, res);
  } catch (error) {
    logger.logError('Error in get fields by module route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/fields/:fieldId', async (req, res) => {
  try {
    await customFieldController.updateField(req, res);
  } catch (error) {
    logger.logError('Error in update field route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/fields/:fieldId', async (req, res) => {
  try {
    await customFieldController.deleteField(req, res);
  } catch (error) {
    logger.logError('Error in delete field route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
