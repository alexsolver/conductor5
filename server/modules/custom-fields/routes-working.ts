
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
 * @route GET /api/custom-fields/fields/:moduleType
 * @desc Get custom fields for a specific module
 * @access Private
 */
router.get('/fields/:moduleType', async (req, res) => {
  try {
    console.log('🔍 [CUSTOM-FIELDS] GET fields for module:', req.params.moduleType);
    
    const result = await customFieldController.getFieldsByModule(req, res);
    
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: result || []
      });
    }
  } catch (error) {
    console.error('❌ [CUSTOM-FIELDS] Error getting fields:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * @route POST /api/custom-fields/fields
 * @desc Create a new custom field
 * @access Private
 */
router.post('/fields', async (req, res) => {
  try {
    console.log('🔍 [CUSTOM-FIELDS] POST create field:', req.body);
    
    // Validate required fields
    const { moduleType, fieldName, fieldType, fieldLabel } = req.body;
    
    if (!moduleType || !fieldName || !fieldType || !fieldLabel) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: moduleType, fieldName, fieldType, fieldLabel'
      });
    }

    // Validate field name format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldName)) {
      return res.status(400).json({
        success: false,
        message: 'Field name must be a valid identifier (letters, numbers, underscore)'
      });
    }

    // Validate field type
    const validFieldTypes = ['text', 'number', 'select', 'multiselect', 'date', 'boolean', 'textarea', 'file', 'email', 'phone', 'url'];
    if (!validFieldTypes.includes(fieldType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field type'
      });
    }

    // Validate module type
    const validModuleTypes = ['customers', 'tickets', 'beneficiaries', 'materials', 'services', 'locations'];
    if (!validModuleTypes.includes(moduleType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module type'
      });
    }

    const result = await customFieldController.createField(req, res);
    
    if (!res.headersSent) {
      res.status(201).json({
        success: true,
        message: 'Custom field created successfully',
        data: result
      });
    }
  } catch (error) {
    console.error('❌ [CUSTOM-FIELDS] Error creating field:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * @route PUT /api/custom-fields/fields/:fieldId
 * @desc Update a custom field
 * @access Private
 */
router.put('/fields/:fieldId', async (req, res) => {
  try {
    console.log('🔍 [CUSTOM-FIELDS] PUT update field:', req.params.fieldId, req.body);
    
    const result = await customFieldController.updateField(req, res);
    
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        message: 'Custom field updated successfully',
        data: result
      });
    }
  } catch (error) {
    console.error('❌ [CUSTOM-FIELDS] Error updating field:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * @route DELETE /api/custom-fields/fields/:fieldId
 * @desc Delete a custom field
 * @access Private
 */
router.delete('/fields/:fieldId', async (req, res) => {
  try {
    console.log('🔍 [CUSTOM-FIELDS] DELETE field:', req.params.fieldId);
    
    const result = await customFieldController.deleteField(req, res);
    
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        message: 'Custom field deleted successfully'
      });
    }
  } catch (error) {
    console.error('❌ [CUSTOM-FIELDS] Error deleting field:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

export default router;
