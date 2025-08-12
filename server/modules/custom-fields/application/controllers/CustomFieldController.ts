/**
 * Custom Field Controller - Phase 12 Implementation
 * 
 * Controlador para operações de campos personalizados
 * Camada de aplicação seguindo Clean Architecture
 * 
 * @module CustomFieldController
 * @version 1.0.0
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

import type { Request, Response } from 'express';
import type { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField, CustomFieldEntity } from '../../domain/entities/CustomField';

// AuthenticatedRequest type definition
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

import { z } from 'zod';

// Validation schemas
const createCustomFieldSchema = z.object({
  moduleType: z.enum(['tickets', 'customers', 'users', 'companies', 'locations', 'beneficiaries', 'inventory', 'teams', 'projects', 'contacts']),
  fieldName: z.string().min(1, 'Nome do campo é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres').regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Nome deve ser um identificador válido'),
  fieldType: z.enum(['text', 'number', 'email', 'phone', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'textarea', 'file', 'url']),
  fieldLabel: z.string().min(1, 'Label do campo é obrigatório').max(100, 'Label deve ter no máximo 100 caracteres'),
  isRequired: z.boolean().default(false),
  validationRules: z.record(z.any()).optional(),
  fieldOptions: z.array(z.string()).optional(),
  displayOrder: z.number().min(0, 'Ordem deve ser positiva').default(0),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  fieldGroup: z.string().optional(),
  conditionalLogic: z.record(z.any()).optional()
});

const updateCustomFieldSchema = createCustomFieldSchema.partial();

const reorderFieldsSchema = z.object({
  fieldOrders: z.array(z.object({
    fieldId: z.string().uuid('ID do campo inválido'),
    displayOrder: z.number().min(0, 'Ordem deve ser positiva')
  })).min(1, 'Pelo menos um campo deve ser reordenado')
});

export class CustomFieldController {
  constructor(private customFieldRepository: ICustomFieldRepository) {}

  /**
   * Create custom field
   * POST /api/custom-fields-integration/working/fields
   */
  async createField(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      // Validate input
      const fieldData = createCustomFieldSchema.parse(req.body);

      // Check if field name already exists in module
      const fieldExists = await this.customFieldRepository.existsByName(
        fieldData.fieldName, 
        fieldData.moduleType, 
        tenantId
      );
      
      if (fieldExists) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: `Campo '${fieldData.fieldName}' já existe no módulo '${fieldData.moduleType}'`
        });
        return;
      }

      // Create custom field entity
      const fieldEntity = CustomFieldEntity.create({
        tenantId,
        ...fieldData,
        createdBy: req.user?.id
      });

      // Convert to CustomField interface
      const field: CustomField = {
        id: fieldEntity.id,
        tenantId: fieldEntity.tenantId,
        moduleType: fieldEntity.moduleType,
        fieldName: fieldEntity.fieldName,
        fieldType: fieldEntity.fieldType,
        fieldLabel: fieldEntity.fieldLabel,
        isRequired: fieldEntity.isRequired,
        validationRules: fieldEntity.validationRules || undefined,
        fieldOptions: fieldEntity.fieldOptions || undefined,
        displayOrder: fieldEntity.displayOrder,
        isActive: fieldEntity.isActive,
        defaultValue: fieldEntity.defaultValue || undefined,
        placeholder: fieldEntity.placeholder || undefined,
        helpText: fieldEntity.helpText || undefined,
        fieldGroup: fieldEntity.fieldGroup || undefined,
        conditionalLogic: fieldEntity.conditionalLogic || undefined,
        createdAt: fieldEntity.createdAt,
        updatedAt: fieldEntity.updatedAt,
        createdBy: fieldEntity.createdBy || undefined,
        updatedBy: fieldEntity.updatedBy || undefined
      };

      // Save to repository
      const createdField = await this.customFieldRepository.create(field);

      res.status(201).json({
        success: true,
        data: createdField,
        message: 'Campo personalizado criado com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[CUSTOM-FIELD-CONTROLLER] Error creating field:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao criar campo personalizado'
      });
    }
  }

  /**
   * Get custom fields
   * GET /api/custom-fields-integration/working/fields
   */
  async getFields(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { moduleType, fieldType, isRequired, isActive, fieldGroup, search } = req.query;

      const filters = {
        tenantId,
        ...(moduleType && { moduleType: moduleType as string }),
        ...(fieldType && { fieldType: fieldType as string }),
        ...(isRequired !== undefined && { isRequired: isRequired === 'true' }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(fieldGroup && { fieldGroup: fieldGroup as string }),
        ...(search && { search: search as string })
      };

      const fields = await this.customFieldRepository.findAll(filters);

      res.json({
        success: true,
        data: fields,
        pagination: {
          page: 1,
          limit: 100,
          total: fields.length,
          totalPages: 1
        },
        message: 'Campos personalizados recuperados com sucesso'
      });

    } catch (error) {
      console.error('[CUSTOM-FIELD-CONTROLLER] Error fetching fields:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar campos personalizados'
      });
    }
  }

  /**
   * Get custom field by ID
   * GET /api/custom-fields-integration/working/fields/:id
   */
  async getFieldById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const field = await this.customFieldRepository.findById(id, tenantId);
      if (!field) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Campo personalizado não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: field,
        message: 'Campo encontrado com sucesso'
      });

    } catch (error) {
      console.error('[CUSTOM-FIELD-CONTROLLER] Error fetching field:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar campo personalizado'
      });
    }
  }

  /**
   * Get fields by module
   * GET /api/custom-fields-integration/working/modules/:moduleType/fields
   */
  async getFieldsByModule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { moduleType } = req.params;
      const { activeOnly } = req.query;

      let fields;
      if (activeOnly === 'true') {
        fields = await this.customFieldRepository.findActiveByModule(moduleType, tenantId);
      } else {
        fields = await this.customFieldRepository.findOrderedByModule(moduleType, tenantId);
      }

      res.json({
        success: true,
        data: fields,
        count: fields.length,
        message: `Campos do módulo '${moduleType}' recuperados com sucesso`
      });

    } catch (error) {
      console.error('[CUSTOM-FIELD-CONTROLLER] Error fetching fields by module:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar campos do módulo'
      });
    }
  }

  /**
   * Update custom field
   * PUT /api/custom-fields-integration/working/fields/:id
   */
  async updateField(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      // Validate input
      const updateData = updateCustomFieldSchema.parse(req.body);

      // Check if field exists
      const existingField = await this.customFieldRepository.findById(id, tenantId);
      if (!existingField) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Campo personalizado não encontrado'
        });
        return;
      }

      // Check if new field name conflicts (if fieldName is being updated)
      if (updateData.fieldName && updateData.fieldName !== existingField.fieldName) {
        const fieldExists = await this.customFieldRepository.existsByName(
          updateData.fieldName, 
          existingField.moduleType, 
          tenantId, 
          id
        );
        
        if (fieldExists) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `Campo '${updateData.fieldName}' já existe no módulo '${existingField.moduleType}'`
          });
          return;
        }
      }

      // Update field
      const updatedField = await this.customFieldRepository.update(id, tenantId, {
        ...updateData,
        updatedBy: req.user?.id,
        updatedAt: new Date()
      });

      if (!updatedField) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Campo personalizado não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedField,
        message: 'Campo personalizado atualizado com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[CUSTOM-FIELD-CONTROLLER] Error updating field:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao atualizar campo personalizado'
      });
    }
  }

  /**
   * Delete custom field
   * DELETE /api/custom-fields-integration/working/fields/:id
   */
  async deleteField(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const deleted = await this.customFieldRepository.delete(id, tenantId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Campo personalizado não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Campo personalizado desativado com sucesso'
      });

    } catch (error) {
      console.error('[CUSTOM-FIELD-CONTROLLER] Error deleting field:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao desativar campo personalizado'
      });
    }
  }

  /**
   * Get custom field statistics
   * GET /api/custom-fields-integration/working/statistics
   */
  async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const statistics = await this.customFieldRepository.getStatistics(tenantId);

      res.json({
        success: true,
        data: statistics,
        message: 'Estatísticas recuperadas com sucesso'
      });

    } catch (error) {
      console.error('[CUSTOM-FIELD-CONTROLLER] Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Get module field schema
   * GET /api/custom-fields-integration/working/modules/:moduleType/schema
   */
  async getModuleFieldSchema(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { moduleType } = req.params;

      const schema = await this.customFieldRepository.getModuleFieldSchema(moduleType, tenantId);

      res.json({
        success: true,
        data: schema,
        message: 'Schema do módulo recuperado com sucesso'
      });

    } catch (error) {
      console.error('[CUSTOM-FIELD-CONTROLLER] Error fetching module schema:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar schema do módulo'
      });
    }
  }

  /**
   * Reorder fields
   * POST /api/custom-fields-integration/working/modules/:moduleType/reorder
   */
  async reorderFields(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { moduleType } = req.params;
      const reorderData = reorderFieldsSchema.parse(req.body);

      const reorderedFields = await this.customFieldRepository.reorderFields(
        moduleType, 
        tenantId, 
        reorderData.fieldOrders
      );

      res.json({
        success: true,
        data: reorderedFields,
        message: 'Campos reordenados com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[CUSTOM-FIELD-CONTROLLER] Error reordering fields:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao reordenar campos'
      });
    }
  }
}