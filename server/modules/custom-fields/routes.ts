import { Router } from 'express';
import { CustomFieldsController, AuthenticatedRequest } from './CustomFieldsController.ts';
import { CustomFieldsRepository } from './CustomFieldsRepository.ts';
import { jwtAuth } from '../../middleware/jwtAuth.js';
import { schemaManager } from '../../db.js';

const router = Router();

// Initialize repository and controller
const customFieldsRepository = new CustomFieldsRepository(schemaManager);
const customFieldsController = new CustomFieldsController(customFieldsRepository);

// Middleware to validate module access
const moduleAccessMiddleware = (req: AuthenticatedRequest, res: any, next: any) => {
  const { moduleType } = req.params;
  // TODO: Add module access validation here when implementing SaaS features
  // For now, allow all modules
  next();
};

// ===========================
// CUSTOM FIELDS METADATA ROUTES
// ===========================

// Get all fields for a module
router.get('/fields/:moduleType', jwtAuth, moduleAccessMiddleware, (req, res) => {
  customFieldsController.getFieldsByModule(req as AuthenticatedRequest, res);
});

// Get specific field by ID
router.get('/fields/detail/:fieldId', jwtAuth, (req, res) => {
  customFieldsController.getFieldById(req as AuthenticatedRequest, res);
});

// Create new field
router.post('/fields', jwtAuth, (req, res) => {
  customFieldsController.createField(req as AuthenticatedRequest, res);
});

// Update field
router.put('/fields/:fieldId', jwtAuth, (req, res) => {
  customFieldsController.updateField(req as AuthenticatedRequest, res);
});

// Delete field (soft delete)
router.delete('/fields/:fieldId', jwtAuth, (req, res) => {
  customFieldsController.deleteField(req as AuthenticatedRequest, res);
});

// Reorder fields for a module
router.post('/fields/:moduleType/reorder', jwtAuth, moduleAccessMiddleware, (req, res) => {
  customFieldsController.reorderFields(req as AuthenticatedRequest, res);
});

// ===========================
// CUSTOM FIELDS VALUES ROUTES
// ===========================

// Get values for an entity
router.get('/values/:entityType/:entityId', jwtAuth, moduleAccessMiddleware, (req, res) => {
  customFieldsController.getEntityValues(req as AuthenticatedRequest, res);
});

// Save values for an entity
router.post('/values/:entityType/:entityId', jwtAuth, moduleAccessMiddleware, (req, res) => {
  customFieldsController.saveEntityValues(req as AuthenticatedRequest, res);
});

// Delete values for an entity
router.delete('/values/:entityType/:entityId', jwtAuth, moduleAccessMiddleware, (req, res) => {
  customFieldsController.deleteEntityValues(req as AuthenticatedRequest, res);
});

// ===========================
// SIMPLIFIED TICKET ROUTES FOR DRAG-AND-DROP
// ===========================

// Get custom fields for a specific ticket
router.get('/ticket/:ticketId', jwtAuth, (req, res) => {
  // Modify params to match the entity values route structure
  const modifiedReq = req as AuthenticatedRequest;
  modifiedReq.params = {
    ...modifiedReq.params,
    entityType: 'tickets',
    entityId: req.params.ticketId
  };
  customFieldsController.getEntityValues(modifiedReq, res);
});

// Save custom fields for a specific ticket
router.post('/ticket/:ticketId', jwtAuth, (req, res) => {
  // Modify params to match the entity values route structure
  const modifiedReq = req as AuthenticatedRequest;
  modifiedReq.params = {
    ...modifiedReq.params,
    entityType: 'tickets',
    entityId: req.params.ticketId
  };
  customFieldsController.saveEntityValues(modifiedReq, res);
});

// Delete custom fields for a specific ticket
router.delete('/ticket/:ticketId', jwtAuth, (req, res) => {
  // Modify params to match the entity values route structure
  const modifiedReq = req as AuthenticatedRequest;
  modifiedReq.params = {
    ...modifiedReq.params,
    entityType: 'tickets',
    entityId: req.params.ticketId
  };
  customFieldsController.deleteEntityValues(modifiedReq, res);
});

// ===========================
// TENANT MODULE ACCESS ROUTES
// ===========================

// Get tenant module access configuration
router.get('/modules/access', jwtAuth, (req, res) => {
  customFieldsController.getTenantModuleAccess(req as AuthenticatedRequest, res);
});

// Update module access
router.put('/modules/:moduleType/access', jwtAuth, (req, res) => {
  customFieldsController.updateModuleAccess(req as AuthenticatedRequest, res);
});

// ===========================
// STATISTICS ROUTES
// ===========================

// Get field statistics for a module
router.get('/stats/:moduleType', jwtAuth, moduleAccessMiddleware, (req, res) => {
  customFieldsController.getModuleFieldStats(req as AuthenticatedRequest, res);
});

export default router;