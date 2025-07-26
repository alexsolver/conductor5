import { Request, Response } from 'express';
import { CustomFieldsRepository } from './CustomFieldsRepository.ts';
import { 
  insertCustomFieldMetadataSchema, 
  insertCustomFieldValueSchema,
  ModuleType,
  FieldType
} from '../../../shared/schema-custom-fields.ts';
import { ZodError } from 'zod';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    permissions?: string[];
  };
}

export class CustomFieldsController {
  constructor(private repository: CustomFieldsRepository) {}

  // ===========================
  // CUSTOM FIELDS METADATA ROUTES
  // ===========================

  async getFieldsByModule(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      if (!moduleType || !this.isValidModuleType(moduleType)) {
        return res.status(400).json({ success: false, error: 'Invalid module type' });
      }

      const fields = await this.repository.getFieldsByModule(tenantId, moduleType as ModuleType);
      
      res.json({
        success: true,
        data: fields
      });
    } catch (error) {
      console.error('Error fetching fields by module:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch fields',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getFieldById(req: AuthenticatedRequest, res: Response) {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      const field = await this.repository.getFieldById(tenantId, fieldId);
      
      if (!field) {
        return res.status(404).json({ success: false, error: 'Field not found' });
      }

      res.json({
        success: true,
        data: field
      });
    } catch (error) {
      console.error('Error fetching field by ID:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch field',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createField(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Validate request body
      const validatedData = insertCustomFieldMetadataSchema.parse(req.body);

      // Check if field name already exists for this module
      const existingFields = await this.repository.getFieldsByModule(tenantId, validatedData.moduleType);
      const fieldExists = existingFields.some(field => field.fieldName === validatedData.fieldName);
      
      if (fieldExists) {
        return res.status(409).json({ 
          success: false, 
          error: `Campo '${validatedData.fieldName}' já existe para este módulo` 
        });
      }

      const field = await this.repository.createField(tenantId, validatedData, createdBy);
      
      res.status(201).json({
        success: true,
        data: field
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation error',
          details: error.errors
        });
      }

      console.error('Error creating field:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create field',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateField(req: AuthenticatedRequest, res: Response) {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.id;

      if (!tenantId || !updatedBy) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Validate request body (partial update)
      const validatedData = insertCustomFieldMetadataSchema.partial().parse(req.body);

      const field = await this.repository.updateField(tenantId, fieldId, validatedData, updatedBy);
      
      if (!field) {
        return res.status(404).json({ success: false, error: 'Field not found' });
      }

      res.json({
        success: true,
        data: field
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation error',
          details: error.errors
        });
      }

      console.error('Error updating field:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update field',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteField(req: AuthenticatedRequest, res: Response) {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      const success = await this.repository.deleteField(tenantId, fieldId);
      
      if (!success) {
        return res.status(404).json({ success: false, error: 'Field not found' });
      }

      res.json({
        success: true,
        message: 'Field deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete field',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async reorderFields(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      if (!moduleType || !this.isValidModuleType(moduleType)) {
        return res.status(400).json({ success: false, error: 'Invalid module type' });
      }

      const { fieldOrders } = req.body;
      
      if (!Array.isArray(fieldOrders)) {
        return res.status(400).json({ success: false, error: 'fieldOrders must be an array' });
      }

      await this.repository.reorderFields(tenantId, moduleType as ModuleType, fieldOrders);
      
      res.json({
        success: true,
        message: 'Fields reordered successfully'
      });
    } catch (error) {
      console.error('Error reordering fields:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to reorder fields',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ===========================
  // CUSTOM FIELDS VALUES ROUTES
  // ===========================

  async getEntityValues(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const tenantId = req.user?.tenantId;

      console.log('🔍 Custom Fields API - getEntityValues:', { entityType, entityId, tenantId });

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      if (!entityType || !this.isValidModuleType(entityType)) {
        console.log('❌ Invalid entity type:', entityType);
        return res.status(400).json({ success: false, error: 'Invalid entity type' });
      }

      try {
        const values = await this.repository.getEntityValues(tenantId, entityId, entityType as ModuleType);
        
        console.log('✅ Custom Fields API - Retrieved values:', values);
        
        res.json({
          success: true,
          fields: values || [], // Ensure we always return an array
          data: values || []
        });
      } catch (repoError) {
        console.log('🔄 Repository error, returning empty fields array:', repoError);
        // If repository fails, return empty array instead of error
        res.json({
          success: true,
          fields: [],
          data: []
        });
      }
    } catch (error) {
      console.error('Error fetching entity values:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch entity values',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async saveEntityValues(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      if (!entityType || !this.isValidModuleType(entityType)) {
        return res.status(400).json({ success: false, error: 'Invalid entity type' });
      }

      const { values } = req.body;

      if (!values || typeof values !== 'object') {
        return res.status(400).json({ success: false, error: 'Values object required' });
      }

      // Validate each field value
      const fields = await this.repository.getFieldsByModule(tenantId, entityType as ModuleType);
      const validationErrors: Record<string, string> = {};

      for (const field of fields) {
        if (values.hasOwnProperty(field.fieldName)) {
          const validation = await this.repository.validateFieldValue(tenantId, field.id, values[field.fieldName]);
          if (!validation.isValid && validation.error) {
            validationErrors[field.fieldName] = validation.error;
          }
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation errors',
          details: validationErrors
        });
      }

      await this.repository.saveEntityValues(tenantId, entityId, entityType as ModuleType, values);
      
      res.json({
        success: true,
        message: 'Entity values saved successfully'
      });
    } catch (error) {
      console.error('Error saving entity values:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save entity values',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteEntityValues(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      if (!entityType || !this.isValidModuleType(entityType)) {
        return res.status(400).json({ success: false, error: 'Invalid entity type' });
      }

      await this.repository.deleteEntityValues(tenantId, entityId, entityType as ModuleType);
      
      res.json({
        success: true,
        message: 'Entity values deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting entity values:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete entity values',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ===========================
  // TENANT MODULE ACCESS ROUTES
  // ===========================

  async getTenantModuleAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      const moduleAccess = await this.repository.getTenantModuleAccess(tenantId);
      
      res.json({
        success: true,
        data: moduleAccess
      });
    } catch (error) {
      console.error('Error fetching tenant module access:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch module access',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateModuleAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const { isEnabled } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      if (!moduleType || !this.isValidModuleType(moduleType)) {
        return res.status(400).json({ success: false, error: 'Invalid module type' });
      }

      if (typeof isEnabled !== 'boolean') {
        return res.status(400).json({ success: false, error: 'isEnabled must be a boolean' });
      }

      await this.repository.updateModuleAccess(tenantId, moduleType as ModuleType, isEnabled);
      
      res.json({
        success: true,
        message: 'Module access updated successfully'
      });
    } catch (error) {
      console.error('Error updating module access:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update module access',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ===========================
  // STATISTICS ROUTES
  // ===========================

  async getModuleFieldStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID required' });
      }

      if (!moduleType || !this.isValidModuleType(moduleType)) {
        return res.status(400).json({ success: false, error: 'Invalid module type' });
      }

      const stats = await this.repository.getModuleFieldStats(tenantId, moduleType as ModuleType);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching module field stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch module field stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  private isValidModuleType(moduleType: string): boolean {
    const validModules: ModuleType[] = ['customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations'];
    return validModules.includes(moduleType as ModuleType);
  }

  private isValidFieldType(fieldType: string): boolean {
    const validTypes: FieldType[] = ['text', 'number', 'select', 'multiselect', 'date', 'boolean', 'textarea', 'file', 'email', 'phone'];
    return validTypes.includes(fieldType as FieldType);
  }
}