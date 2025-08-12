/**
 * Custom Fields Working Routes - Phase 12 Implementation
 * 
 * Working implementation for Phase 12 completion
 * Manages custom fields with Clean Architecture principles
 * 
 * @module CustomFieldsWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { CustomFieldController } from './application/controllers/CustomFieldController';
import { SimplifiedCustomFieldRepository } from './infrastructure/repositories/SimplifiedCustomFieldRepository';

const router = Router();

// Initialize dependencies
const customFieldRepository = new SimplifiedCustomFieldRepository();
const customFieldController = new CustomFieldController(customFieldRepository);

// Apply authentication middleware
router.use(jwtAuth);

/**
 * Phase 12 Status Endpoint
 * GET /working/status
 */
router.get('/working/status', (req, res) => {
  res.json({
    success: true,
    phase: 12,
    module: 'custom-fields',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      fields: {
        create: 'POST /working/fields',
        list: 'GET /working/fields',
        getById: 'GET /working/fields/:id',
        update: 'PUT /working/fields/:id',
        delete: 'DELETE /working/fields/:id'
      },
      modules: {
        getFields: 'GET /working/modules/:moduleType/fields',
        getSchema: 'GET /working/modules/:moduleType/schema',
        reorderFields: 'POST /working/modules/:moduleType/reorder'
      },
      statistics: 'GET /working/statistics'
    },
    features: {
      customFieldsManagement: true,
      fieldTypes: [
        'text', 'number', 'email', 'phone', 'date', 'datetime',
        'boolean', 'select', 'multiselect', 'textarea', 'file', 'url'
      ],
      supportedModules: [
        'tickets', 'customers', 'users', 'companies', 'locations',
        'beneficiaries', 'inventory', 'teams', 'projects', 'contacts'
      ],
      fieldValidation: true,
      conditionalLogic: true,
      fieldOrdering: true,
      fieldTemplates: true,
      bulkOperations: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Create custom field - Working implementation
 * POST /working/fields
 */
router.post('/working/fields', async (req, res) => {
  await customFieldController.createField(req, res);
});

/**
 * List custom fields - Working implementation
 * GET /working/fields
 */
router.get('/working/fields', async (req, res) => {
  await customFieldController.getFields(req, res);
});

/**
 * Get custom field by ID - Working implementation
 * GET /working/fields/:id
 */
router.get('/working/fields/:id', async (req, res) => {
  await customFieldController.getFieldById(req, res);
});

/**
 * Update custom field - Working implementation
 * PUT /working/fields/:id
 */
router.put('/working/fields/:id', async (req, res) => {
  await customFieldController.updateField(req, res);
});

/**
 * Delete custom field - Working implementation
 * DELETE /working/fields/:id
 */
router.delete('/working/fields/:id', async (req, res) => {
  await customFieldController.deleteField(req, res);
});

/**
 * Get fields by module - Working implementation
 * GET /working/modules/:moduleType/fields
 */
router.get('/working/modules/:moduleType/fields', async (req, res) => {
  await customFieldController.getFieldsByModule(req, res);
});

/**
 * Get module field schema - Working implementation
 * GET /working/modules/:moduleType/schema
 */
router.get('/working/modules/:moduleType/schema', async (req, res) => {
  await customFieldController.getModuleFieldSchema(req, res);
});

/**
 * Reorder fields in module - Working implementation
 * POST /working/modules/:moduleType/reorder
 */
router.post('/working/modules/:moduleType/reorder', async (req, res) => {
  await customFieldController.reorderFields(req, res);
});

/**
 * Get custom fields statistics - Working implementation
 * GET /working/statistics
 */
router.get('/working/statistics', async (req, res) => {
  await customFieldController.getStatistics(req, res);
});

export default router;