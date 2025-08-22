
import { Router } from 'express';
import { CustomFieldController } from './application/controllers/CustomFieldController';
import { SimplifiedCustomFieldRepository } from './infrastructure/repositories/SimplifiedCustomFieldRepository';
import { logInfo, logError } from '../../utils/logger.js';

const router = Router();

// Dependency injection
const customFieldRepository = new SimplifiedCustomFieldRepository();
const customFieldController = new CustomFieldController(customFieldRepository as any, { logInfo, logError });

// Routes
router.get('/fields/:moduleType', (req, res) => customFieldController.getFieldsByModule(req, res));
router.post('/fields', (req, res) => customFieldController.createField(req, res));
router.put('/fields/:fieldId', (req, res) => customFieldController.updateField(req, res));
router.delete('/fields/:fieldId', (req, res) => customFieldController.deleteField(req, res));

export default router;
