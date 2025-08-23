
import { Router } from 'express';
import { CustomFieldController } from './application/controllers/CustomFieldController';
import { SimplifiedCustomFieldRepository } from './infrastructure/repositories/SimplifiedCustomFieldRepository';

const router = Router();

// Simple logger following 1qa.md patterns
const logger = {
  logInfo: (msg: string, data?: any) => console.log(`[CUSTOM-FIELDS] ${msg}`, data || ''),
  logError: (msg: string, error?: any) => console.error(`[CUSTOM-FIELDS] ${msg}`, error || '')
};

// Dependency injection
const customFieldRepository = new SimplifiedCustomFieldRepository();
const customFieldController = new CustomFieldController(customFieldRepository as any, logger);

// Routes with debug logging following 1qa.md patterns
router.get('/fields/:moduleType', (req, res) => {
  logger.logInfo('GET /fields/:moduleType called', req.params);
  customFieldController.getFieldsByModule(req, res);
});

router.post('/fields', (req, res) => {
  logger.logInfo('POST /fields called', { body: req.body, user: req.user });
  customFieldController.createField(req, res);
});

router.put('/fields/:fieldId', (req, res) => {
  logger.logInfo('PUT /fields/:fieldId called', req.params);
  customFieldController.updateField(req, res);
});

router.delete('/fields/:fieldId', (req, res) => {
  logger.logInfo('DELETE /fields/:fieldId called', req.params);
  customFieldController.deleteField(req, res);
});

export default router;
