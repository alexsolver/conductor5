
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

// Routes
router.get('/fields/:moduleType', (req, res) => customFieldController.getFieldsByModule(req, res));
router.post('/fields', (req, res) => customFieldController.createField(req, res));
router.put('/fields/:fieldId', (req, res) => customFieldController.updateField(req, res));
router.delete('/fields/:fieldId', (req, res) => customFieldController.deleteField(req, res));

export default router;
