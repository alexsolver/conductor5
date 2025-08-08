import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { CustomFieldsController } from './CustomFieldsController';
import { CustomFieldsRepository } from './CustomFieldsRepository';
import { schemaManager } from '../../db';

const router = Router();

// Initialize repository and controller
const customFieldsRepository = new CustomFieldsRepository(schemaManager);
const customFieldsController = new CustomFieldsController(customFieldsRepository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Field management routes
router.get('/fields/:moduleType', (req, res) => customFieldsController.getFieldsByModule(req as any, res));
router.get('/fields/single/:fieldId', (req, res) => customFieldsController.getFieldById(req as any, res));
router.post('/fields', (req, res) => customFieldsController.createField(req as any, res));
router.put('/fields/:fieldId', (req, res) => customFieldsController.updateField(req as any, res));
router.delete('/fields/:fieldId', (req, res) => customFieldsController.deleteField(req as any, res));

// Field reordering
router.put('/fields/:moduleType/reorder', (req, res) => customFieldsController.reorderFields(req as any, res));

// Entity values management
router.get('/values/:entityType/:entityId', (req, res) => customFieldsController.getEntityValues(req as any, res));
router.post('/values/:entityType/:entityId', (req, res) => customFieldsController.saveEntityValues(req as any, res));
router.delete('/values/:entityType/:entityId', (req, res) => customFieldsController.deleteEntityValues(req as any, res));

// Module access management
router.get('/module-access', (req, res) => customFieldsController.getTenantModuleAccess(req as any, res));
router.put('/module-access/:moduleType', (req, res) => customFieldsController.updateModuleAccess(req as any, res));

// Statistics
router.get('/stats/:moduleType', (req, res) => customFieldsController.getModuleFieldStats(req as any, res));

export { router as customFieldsRoutes };