/**
 * Custom Field Controller - Phase 12 Implementation
 * Clean Architecture - Application Layer
 * 
 * @module CustomFieldController
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';

export class CustomFieldController {
  constructor(private customFieldRepository: ICustomFieldRepository) {}

  async getFieldsByModule(req: Request, res: Response) {
    try {
      const { moduleType } = req.params;
      const user = (req as any).user;

      if (!user || !user.tenantId) {
        throw new Error('User or tenant information not available');
      }

      console.log('🔍 [CUSTOM-FIELD-CONTROLLER] Getting fields for module:', moduleType, 'tenant:', user.tenantId);

      const fields = await this.customFieldRepository.findByModule(moduleType, user.tenantId);

      console.log('✅ [CUSTOM-FIELD-CONTROLLER] Found fields:', fields?.length || 0);

      return fields || [];
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-CONTROLLER] Error getting fields by module:', error);
      throw error;
    }
  }

  async createField(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user || !user.tenantId) {
        throw new Error('User or tenant information not available');
      }

      const fieldData = {
        ...req.body,
        tenantId: user.tenantId,
        createdBy: user.id,
        isActive: true,
        displayOrder: req.body.displayOrder || 0,
        fieldOptions: req.body.fieldOptions || null,
        validationRules: req.body.validationRules || null,
        placeholder: req.body.placeholder || null,
        defaultValue: req.body.defaultValue || null,
        helpText: req.body.helpText || null
      };

      console.log('🔍 [CUSTOM-FIELD-CONTROLLER] Creating field:', fieldData);

      // Check if field name already exists for this module and tenant
      const existingField = await this.customFieldRepository.findByFieldName(
        fieldData.fieldName,
        fieldData.moduleType,
        user.tenantId
      );

      if (existingField) {
        throw new Error('A field with this name already exists for this module');
      }

      const newField = await this.customFieldRepository.create(fieldData);

      console.log('✅ [CUSTOM-FIELD-CONTROLLER] Field created successfully:', newField?.id);

      return newField;
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-CONTROLLER] Error creating field:', error);
      throw error;
    }
  }

  async updateField(req: Request, res: Response) {
    try {
      const { fieldId } = req.params;
      const user = (req as any).user;

      if (!user || !user.tenantId) {
        throw new Error('User or tenant information not available');
      }

      console.log('🔍 [CUSTOM-FIELD-CONTROLLER] Updating field:', fieldId);

      const existingField = await this.customFieldRepository.findById(fieldId, user.tenantId);

      if (!existingField) {
        throw new Error('Field not found');
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date(),
        updatedBy: user.id
      };

      const updatedField = await this.customFieldRepository.update(fieldId, updateData, user.tenantId);

      console.log('✅ [CUSTOM-FIELD-CONTROLLER] Field updated successfully');

      return updatedField;
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-CONTROLLER] Error updating field:', error);
      throw error;
    }
  }

  async deleteField(req: Request, res: Response) {
    try {
      const { fieldId } = req.params;
      const user = (req as any).user;

      if (!user || !user.tenantId) {
        throw new Error('User or tenant information not available');
      }

      console.log('🔍 [CUSTOM-FIELD-CONTROLLER] Deleting field:', fieldId);

      const existingField = await this.customFieldRepository.findById(fieldId, user.tenantId);

      if (!existingField) {
        throw new Error('Field not found');
      }

      await this.customFieldRepository.delete(fieldId, user.tenantId);

      console.log('✅ [CUSTOM-FIELD-CONTROLLER] Field deleted successfully');

      return true;
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-CONTROLLER] Error deleting field:', error);
      throw error;
    }
  }
}