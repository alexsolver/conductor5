
import { db } from '../../../../db';
import { sql } from 'drizzle-orm';
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';

export class SimplifiedCustomFieldRepository {
  // ✅ Basic implementation for essential operations only - per 1qa.md
  // ✅ Full ICustomFieldRepository implementation pending Clean Architecture refactor
  async create(fieldData: Partial<CustomField>): Promise<CustomField> {
    console.log('[CUSTOM-FIELDS] Repository create method started with:', fieldData);
    
    const schemaName = fieldData.tenantId!.replace(/-/g, '_');
    const tableName = `"${schemaName}"."custom_fields_metadata"`;
    
    console.log('[CUSTOM-FIELDS] Using table:', tableName);
    
    try {
      const result = await db.execute(sql.raw(`
        INSERT INTO ${tableName} (
          id, tenant_id, module_type, field_name, field_type, field_label, 
          is_required, validation_rules, field_options, placeholder, 
          default_value, display_order, is_active, created_at, updated_at, help_text, created_by
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), $13, $1
        ) RETURNING *
      `), [
        fieldData.tenantId,
        fieldData.moduleType,
        fieldData.fieldName,
        fieldData.fieldType,
        fieldData.fieldLabel,
        fieldData.isRequired || false,
        JSON.stringify(fieldData.validationRules || {}),
        JSON.stringify(fieldData.fieldOptions || []),
        fieldData.placeholder || '',
        fieldData.defaultValue || '',
        fieldData.displayOrder || 0,
        true,
        fieldData.helpText || ''
      ]);

      console.log('[CUSTOM-FIELDS] Repository insert success:', result);
      return result[0] as CustomField || null;
    } catch (error) {
      console.error('[CUSTOM-FIELDS] Repository error:', error);
      throw error;
    }
  }

  async findByModule(moduleType: string, tenantId: string): Promise<CustomField[]> {
    const schemaName = tenantId.replace(/-/g, '_');
    const tableName = `"${schemaName}"."custom_fields_metadata"`;
    
    const result = await db.execute(sql.raw(`
      SELECT * FROM ${tableName} 
      WHERE module_type = $1 AND is_active = true 
      ORDER BY display_order ASC, created_at ASC
    `), [moduleType]);

    return result as CustomField[];
  }

  async findById(fieldId: string, tenantId: string): Promise<CustomField | null> {
    const schemaName = tenantId.replace(/-/g, '_');
    const tableName = `"${schemaName}"."custom_fields_metadata"`;
    
    const result = await db.execute(sql.raw(`
      SELECT * FROM ${tableName} 
      WHERE id = $1 AND is_active = true
    `), [fieldId]);

    return result[0] as CustomField || null;
  }

  async update(fieldId: string, tenantId: string, updateData: Partial<CustomField>): Promise<CustomField | null> {
    const schemaName = tenantId.replace(/-/g, '_');
    const tableName = `"${schemaName}"."custom_fields_metadata"`;
    
    const result = await db.execute(sql.raw(`
      UPDATE ${tableName} 
      SET 
        field_label = COALESCE($2, field_label),
        is_required = COALESCE($3, is_required),
        validation_rules = COALESCE($4, validation_rules),
        field_options = COALESCE($5, field_options),
        placeholder = COALESCE($6, placeholder),
        default_value = COALESCE($7, default_value),
        display_order = COALESCE($8, display_order),
        help_text = COALESCE($9, help_text),
        updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING *
    `), [
      fieldId,
      updateData.fieldLabel,
      updateData.isRequired,
      updateData.validationRules ? JSON.stringify(updateData.validationRules) : null,
      updateData.fieldOptions ? JSON.stringify(updateData.fieldOptions) : null,
      updateData.placeholder,
      updateData.defaultValue,
      updateData.displayOrder,
      updateData.helpText
    ]);

    return result[0] as CustomField || null;
  }

  async delete(fieldId: string, tenantId: string): Promise<boolean> {
    const schemaName = tenantId.replace(/-/g, '_');
    const tableName = `"${schemaName}"."custom_fields_metadata"`;
    
    const result = await db.execute(sql.raw(`
      UPDATE ${tableName} 
      SET is_active = false, updated_at = NOW() 
      WHERE id = $1
    `), [fieldId]);
    
    return true; // Soft delete sempre retorna true
  }

  async findAll(tenantId: string): Promise<CustomField[]> {
    const schemaName = tenantId.replace(/-/g, '_');
    const tableName = `"${schemaName}"."custom_fields_metadata"`;
    
    const result = await db.execute(sql.raw(`
      SELECT * FROM ${tableName} 
      WHERE is_active = true 
      ORDER BY module_type, display_order ASC, created_at ASC
    `));

    return result as CustomField[];
  }
}
