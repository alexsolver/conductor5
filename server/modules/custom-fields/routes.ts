import { Router, Request, Response } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { enhancedTenantValidator } from "../../middleware/tenantValidator";
import { CustomFieldController } from "./application/controllers/CustomFieldController";
import { DrizzleCustomFieldRepository } from "./infrastructure/repositories/DrizzleCustomFieldRepository";
import { sendSuccess, sendError } from "../../utils/standardResponse";
import { db } from "../../db";

const customFieldsRouter = Router();

// Middleware
customFieldsRouter.use(jwtAuth);
customFieldsRouter.use(enhancedTenantValidator());

// Initialize dependencies
const customFieldRepository = new DrizzleCustomFieldRepository(db);
const customFieldController = new CustomFieldController(customFieldRepository);

// ===========================
// CUSTOM FIELDS METADATA ROUTES
// ===========================

// Get all fields for a module
customFieldsRouter.get('/fields/:moduleType', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.getFieldsByModule(req, res);
});

// Get specific field by ID
customFieldsRouter.get('/fields/detail/:fieldId', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.getFieldById(req, res);
});

// Create new field
customFieldsRouter.post('/fields', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.createField(req, res);
});

// Update field
customFieldsRouter.put('/fields/:fieldId', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.updateField(req, res);
});

// Delete field (soft delete)
customFieldsRouter.delete('/fields/:fieldId', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.deleteField(req, res);
});

// Reorder fields for a module
customFieldsRouter.post('/fields/:moduleType/reorder', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.reorderFields(req, res);
});

// ===========================
// CUSTOM FIELDS VALUES ROUTES
// ===========================

// Get values for an entity
customFieldsRouter.get('/values/:entityType/:entityId', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.getEntityValues(req, res);
});

// Save values for an entity
customFieldsRouter.post('/values/:entityType/:entityId', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.saveEntityValues(req, res);
});

// Delete values for an entity
customFieldsRouter.delete('/values/:entityType/:entityId', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.deleteEntityValues(req, res);
});

// ===========================
// SIMPLIFIED TICKET ROUTES FOR DRAG-AND-DROP
// ===========================

// Get custom fields for a specific ticket
customFieldsRouter.get('/ticket/:ticketId', (req: AuthenticatedRequest, res: Response) => {
  const modifiedReq = { ...req, params: { ...req.params, entityType: 'tickets', entityId: req.params.ticketId } };
  customFieldController.getEntityValues(modifiedReq as AuthenticatedRequest, res);
});

// Save custom fields for a specific ticket
customFieldsRouter.post('/ticket/:ticketId', (req: AuthenticatedRequest, res: Response) => {
  const modifiedReq = { ...req, params: { ...req.params, entityType: 'tickets', entityId: req.params.ticketId } };
  customFieldController.saveEntityValues(modifiedReq as AuthenticatedRequest, res);
});

// Delete custom fields for a specific ticket
customFieldsRouter.delete('/ticket/:ticketId', (req: AuthenticatedRequest, res: Response) => {
  const modifiedReq = { ...req, params: { ...req.params, entityType: 'tickets', entityId: req.params.ticketId } };
  customFieldController.deleteEntityValues(modifiedReq as AuthenticatedRequest, res);
});

// ===========================
// TENANT MODULE ACCESS ROUTES
// ===========================

// Get tenant module access configuration
customFieldsRouter.get('/modules/access', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.getTenantModuleAccess(req, res);
});

// Update module access
customFieldsRouter.put('/modules/:moduleType/access', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.updateModuleAccess(req, res);
});

// ===========================
// STATISTICS ROUTES
// ===========================

// Get field statistics for a module
customFieldsRouter.get('/stats/:moduleType', (req: AuthenticatedRequest, res: Response) => {
  customFieldController.getModuleFieldStats(req, res);
});

export default customFieldsRouter;