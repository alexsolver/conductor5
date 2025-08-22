
import { Router } from 'express';
import { CustomFieldController } from './application/controllers/CustomFieldController';
import { SimplifiedCustomFieldRepository } from './infrastructure/repositories/SimplifiedCustomFieldRepository';
import { Logger } from '../shared/infrastructure/services/Logger';

const router = Router();

// Dependency injection
const logger = new Logger();
const customFieldRepository = new SimplifiedCustomFieldRepository();
const customFieldController = new CustomFieldController(customFieldRepository, logger);

// Routes
router.get('/fields/:moduleType', (req, res) => customFieldController.getFieldsByModule(req, res));
router.post('/fields', (req, res) => customFieldController.createField(req, res));
router.put('/fields/:fieldId', (req, res) => customFieldController.updateField(req, res));
router.delete('/fields/:fieldId', (req, res) => customFieldController.deleteField(req, res));

export default router;
