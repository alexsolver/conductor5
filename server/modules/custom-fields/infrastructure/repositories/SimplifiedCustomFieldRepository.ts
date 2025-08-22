/**
 * Simplified Custom Field Repository - Phase 12 Implementation
 * Clean Architecture - Infrastructure Layer
 * 
 * @module SimplifiedCustomFieldRepository
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';

export class SimplifiedCustomFieldRepository implements ICustomFieldRepository {

  async findByModule(moduleType: string, tenantId: string): Promise<CustomField[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`🔍 [CUSTOM-FIELD-REPO] Finding fields for module: ${moduleType}, schema: ${schemaName}`);

      const query = sql`
        SELECT 
          id,
          tenant_id,
          module_type,
          field_name,
          field_type,
          field_label,
          is_required,
          validation_rules,
          field_options,
          placeholder,
          default_value,
          display_order,
          is_active,
          help_text,
          created_at,
          updated_at,
          created_by
        FROM ${sql.identifier(schemaName)}.custom_fields 
        WHERE module_type = ${moduleType} 
          AND tenant_id = ${tenantId}
          AND is_active = true
        ORDER BY display_order ASC, created_at ASC
      `;

      const result = await db.execute(query);

      console.log(`✅ [CUSTOM-FIELD-REPO] Found ${result.length} fields`);

      return result.map(this.mapRowToCustomField);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-REPO] Error finding fields by module:', error);
      return [];
    }
  }

  async findByFieldName(fieldName: string, moduleType: string, tenantId: string): Promise<CustomField | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const query = sql`
        SELECT 
          id,
          tenant_id,
          module_type,
          field_name,
          field_type,
          field_label,
          is_required,
          validation_rules,
          field_options,
          placeholder,
          default_value,
          display_order,
          is_active,
          help_text,
          created_at,
          updated_at,
          created_by
        FROM ${sql.identifier(schemaName)}.custom_fields 
        WHERE field_name = ${fieldName} 
          AND module_type = ${moduleType}
          AND tenant_id = ${tenantId}
          AND is_active = true
        LIMIT 1
      `;

      const result = await db.execute(query);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToCustomField(result[0]);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-REPO] Error finding field by name:', error);
      return null;
    }
  }

  async findById(id: string, tenantId: string): Promise<CustomField | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const query = sql`
        SELECT 
          id,
          tenant_id,
          module_type,
          field_name,
          field_type,
          field_label,
          is_required,
          validation_rules,
          field_options,
          placeholder,
          default_value,
          display_order,
          is_active,
          help_text,
          created_at,
          updated_at,
          created_by
        FROM ${sql.identifier(schemaName)}.custom_fields 
        WHERE id = ${id} 
          AND tenant_id = ${tenantId}
        LIMIT 1
      `;

      const result = await db.execute(query);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToCustomField(result[0]);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-REPO] Error finding field by ID:', error);
      return null;
    }
  }

  async create(field: Partial<CustomField>): Promise<CustomField> {
    try {
      const schemaName = `tenant_${field.tenantId!.replace(/-/g, '_')}`;
      const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`🔍 [CUSTOM-FIELD-REPO] Creating field in schema: ${schemaName}`);

      const query = sql`
        INSERT INTO ${sql.identifier(schemaName)}.custom_fields (
          id,
          tenant_id,
          module_type,
          field_name,
          field_type,
          field_label,
          is_required,
          validation_rules,
          field_options,
          placeholder,
          default_value,
          display_order,
          is_active,
          help_text,
          created_at,
          updated_at,
          created_by
        ) VALUES (
          ${fieldId},
          ${field.tenantId},
          ${field.moduleType},
          ${field.fieldName},
          ${field.fieldType},
          ${field.fieldLabel},
          ${field.isRequired || false},
          ${field.validationRules ? JSON.stringify(field.validationRules) : null},
          ${field.fieldOptions ? JSON.stringify(field.fieldOptions) : null},
          ${field.placeholder || null},
          ${field.defaultValue || null},
          ${field.displayOrder || 0},
          ${field.isActive !== false},
          ${field.helpText || null},
          NOW(),
          NOW(),
          ${field.createdBy}
        )
        RETURNING *
      `;

      const result = await db.execute(query);

      console.log('✅ [CUSTOM-FIELD-REPO] Field created successfully');

      return this.mapRowToCustomField(result[0]);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-REPO] Error creating field:', error);
      throw error;
    }
  }

  async update(id: string, field: Partial<CustomField>, tenantId: string): Promise<CustomField> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const query = sql`
        UPDATE ${sql.identifier(schemaName)}.custom_fields 
        SET 
          field_label = ${field.fieldLabel},
          is_required = ${field.isRequired},
          validation_rules = ${field.validationRules ? JSON.stringify(field.validationRules) : null},
          field_options = ${field.fieldOptions ? JSON.stringify(field.fieldOptions) : null},
          placeholder = ${field.placeholder || null},
          default_value = ${field.defaultValue || null},
          display_order = ${field.displayOrder},
          help_text = ${field.helpText || null},
          updated_at = NOW()
        WHERE id = ${id} 
          AND tenant_id = ${tenantId}
        RETURNING *
      `;

      const result = await db.execute(query);

      if (result.length === 0) {
        throw new Error('Field not found or could not be updated');
      }

      return this.mapRowToCustomField(result[0]);
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-REPO] Error updating field:', error);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const query = sql`
        UPDATE ${sql.identifier(schemaName)}.custom_fields 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id} 
          AND tenant_id = ${tenantId}
      `;

      await db.execute(query);

      console.log('✅ [CUSTOM-FIELD-REPO] Field soft deleted successfully');
    } catch (error) {
      console.error('❌ [CUSTOM-FIELD-REPO] Error deleting field:', error);
      throw error;
    }
  }

  private mapRowToCustomField(row: any): CustomField {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      moduleType: row.module_type,
      fieldName: row.field_name,
      fieldType: row.field_type,
      fieldLabel: row.field_label,
      isRequired: row.is_required,
      validationRules: row.validation_rules ? JSON.parse(row.validation_rules) : null,
      fieldOptions: row.field_options ? JSON.parse(row.field_options) : null,
      placeholder: row.placeholder,
      defaultValue: row.default_value,
      displayOrder: row.display_order,
      isActive: row.is_active,
      helpText: row.help_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }
}