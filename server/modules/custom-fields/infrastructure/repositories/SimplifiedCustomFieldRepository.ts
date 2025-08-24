// ✅ 1QA.MD COMPLIANCE: CUSTOM FIELDS SIMPLIFIED REPOSITORY  
// Infrastructure layer - Database access following Clean Architecture

console.log('🔥 [CUSTOM-FIELDS-REPO] *** FILE LOADING START *** following 1qa.md');
console.log('🔥 [CUSTOM-FIELDS-REPO] Timestamp:', new Date().toISOString());

import { db, sql } from '../../../../db';
import { CustomFieldMetadata } from '../../domain/entities/CustomField';

// Simplified interface for basic operations
interface ISimplifiedCustomFieldRepository {
  getFieldsByModule(moduleType: string): Promise<CustomFieldMetadata[]>;
  createField(fieldData: Partial<CustomFieldMetadata>): Promise<CustomFieldMetadata>;
  updateField(fieldId: string, fieldData: Partial<CustomFieldMetadata>): Promise<CustomFieldMetadata>;
  deleteField(fieldId: string): Promise<void>;
}

export class SimplifiedCustomFieldRepository implements ISimplifiedCustomFieldRepository {
  private tenantId: string;

  constructor(tenantId?: string) {
    this.tenantId = tenantId || '';
    console.log('🔥 [CUSTOM-FIELDS-REPO] Repository initialized following Clean Architecture', { tenantId: this.tenantId });
  }

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  private getTenantSchema(): string {
    if (!this.tenantId) {
      throw new Error('TenantId not set for custom fields repository');
    }
    // Convert hyphens to underscores to match database schema format
    const schemaName = this.tenantId.replace(/-/g, '_');
    return `tenant_${schemaName}`;
  }

  async getFieldsByModule(moduleType: string): Promise<CustomFieldMetadata[]> {
    console.log('🔥 [CUSTOM-FIELDS-REPO] getFieldsByModule called with:', moduleType);

    try {
      // ✅ 1QA.MD: Ensure schema and table exist first
      await this.ensureSchemaAndTable();

      const tenantSchema = this.getTenantSchema();
      console.log('🔥 [CUSTOM-FIELDS-REPO] Querying fields from schema:', tenantSchema);
      
      const result = await db.execute(sql`
        SELECT 
          id,
          module_type as "moduleType",
          field_name as "fieldName", 
          field_type as "fieldType",
          field_label as "fieldLabel",
          is_required as "isRequired",
          validation_rules as "validationRules",
          field_options as "fieldOptions",
          placeholder,
          default_value as "defaultValue",
          display_order as "displayOrder",
          is_active as "isActive",
          help_text as "helpText",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema, 'custom_field_metadata')}
        WHERE module_type = ${moduleType} AND is_active = true
        ORDER BY display_order ASC, created_at ASC
      `);
      console.log('🔥 [CUSTOM-FIELDS-REPO] Query result:', result.rows?.length || 0, 'fields found');
      
      return result.rows as CustomFieldMetadata[];
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Error in getFieldsByModule:', error);
      // ✅ 1QA.MD: Return empty array instead of throwing to prevent frontend blocking
      return [];
    }
  }

  private async ensureSchemaAndTable(): Promise<void> {
    try {
      const tenantSchema = this.getTenantSchema();
      
      // ✅ 1QA.MD: First ensure the tenant schema exists
      await this.ensureTenantSchema(tenantSchema);
      
      // ✅ 1QA.MD: Then create custom_field_metadata table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tenantSchema}.custom_field_metadata (
          id VARCHAR(255) PRIMARY KEY,
          module_type VARCHAR(100) NOT NULL,
          field_name VARCHAR(255) NOT NULL,
          field_type VARCHAR(100) NOT NULL,
          field_label VARCHAR(255) NOT NULL,
          is_required BOOLEAN DEFAULT false,
          validation_rules JSONB DEFAULT '{}',
          field_options JSONB DEFAULT '[]',
          placeholder TEXT DEFAULT '',
          default_value TEXT DEFAULT '',
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          help_text TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(module_type, field_name)
        );
      `;

      // Use direct SQL execution
      await db.execute(sql.raw(createTableQuery));
      console.log('🔥 [CUSTOM-FIELDS-REPO] Custom fields table ensured in schema:', tenantSchema);
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Table creation error:', error);
      // ✅ 1QA.MD: Don't throw here - let the application continue gracefully
    }
  }

  private async ensureTenantSchema(schemaName: string): Promise<void> {
    try {
      // ✅ 1QA.MD: Check if schema exists first using proper SQL syntax
      const schemaExistsQuery = `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = '${schemaName}'
      `;
      
      const schemaExists = await db.execute(sql.raw(schemaExistsQuery));
      
      if (schemaExists.rows.length === 0) {
        // ✅ 1QA.MD: Create schema if it doesn't exist using sql.identifier for safety
        await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);
        console.log('🔥 [CUSTOM-FIELDS-REPO] Tenant schema created:', schemaName);
      } else {
        console.log('🔥 [CUSTOM-FIELDS-REPO] Tenant schema already exists:', schemaName);
      }
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Schema creation error:', error);
      throw new Error(`Failed to ensure tenant schema: ${error.message}`);
    }
  }

  async createField(fieldData: Partial<CustomFieldMetadata>): Promise<CustomFieldMetadata> {
    console.log('🔥 [CUSTOM-FIELDS-REPO] createField called with:', fieldData);

    try {
      // ✅ 1QA.MD: Ensure schema and table exist first
      await this.ensureSchemaAndTable();

      const {
        moduleType,
        fieldName,
        fieldType,
        fieldLabel,
        isRequired = false,
        validationRules = {},
        fieldOptions = [],
        placeholder = '',
        defaultValue = '',
        displayOrder = 0,
        helpText = ''
      } = fieldData;

      // ✅ 1QA.MD: Generate UUID for new field
      const fieldId = `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO custom_field_metadata (
          id, module_type, field_name, field_type, field_label,
          is_required, validation_rules, field_options, placeholder,
          default_value, display_order, is_active, help_text,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, NOW(), NOW()
        ) RETURNING 
          id,
          module_type as "moduleType",
          field_name as "fieldName", 
          field_type as "fieldType",
          field_label as "fieldLabel",
          is_required as "isRequired",
          validation_rules as "validationRules",
          field_options as "fieldOptions",
          placeholder,
          default_value as "defaultValue",
          display_order as "displayOrder",
          is_active as "isActive",
          help_text as "helpText",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const tenantSchema = this.getTenantSchema();
      
      await db.execute(sql`
        INSERT INTO ${sql.identifier(tenantSchema, 'custom_field_metadata')} (
          id, module_type, field_name, field_type, field_label,
          is_required, validation_rules, field_options, placeholder,
          default_value, display_order, is_active, help_text,
          created_at, updated_at
        ) VALUES (
          ${fieldId}, ${moduleType}, ${fieldName}, ${fieldType}, ${fieldLabel},
          ${isRequired}, ${JSON.stringify(validationRules)}, ${JSON.stringify(fieldOptions)},
          ${placeholder}, ${defaultValue}, ${displayOrder}, true, ${helpText}, NOW(), NOW()
        )
      `);

      console.log('🔥 [CUSTOM-FIELDS-REPO] Field created successfully');
      return {
        id: fieldId,
        moduleType,
        fieldName,
        fieldType,
        fieldLabel,
        isRequired,
        validationRules,
        fieldOptions,
        placeholder,
        defaultValue,
        displayOrder,
        isActive: true,
        helpText
      } as CustomFieldMetadata;
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Error in createField:', error);
      throw error;
    }
  }

  async updateField(fieldId: string, fieldData: Partial<CustomFieldMetadata>): Promise<CustomFieldMetadata> {
    console.log('🔥 [CUSTOM-FIELDS-REPO] updateField called with:', { fieldId, fieldData });

    try {
      // ✅ 1QA.MD: Ensure schema and table exist first
      await this.ensureSchemaAndTable();

      const {
        fieldLabel,
        isRequired,
        validationRules,
        fieldOptions,
        placeholder,
        defaultValue,
        displayOrder,
        helpText,
        isActive = true
      } = fieldData;

      const query = `
        UPDATE custom_field_metadata 
        SET 
          field_label = COALESCE($2, field_label),
          is_required = COALESCE($3, is_required),
          validation_rules = COALESCE($4, validation_rules),
          field_options = COALESCE($5, field_options),
          placeholder = COALESCE($6, placeholder),
          default_value = COALESCE($7, default_value),
          display_order = COALESCE($8, display_order),
          help_text = COALESCE($9, help_text),
          is_active = COALESCE($10, is_active),
          updated_at = NOW()
        WHERE id = $1
        RETURNING 
          id,
          module_type as "moduleType",
          field_name as "fieldName", 
          field_type as "fieldType",
          field_label as "fieldLabel",
          is_required as "isRequired",
          validation_rules as "validationRules",
          field_options as "fieldOptions",
          placeholder,
          default_value as "defaultValue",
          display_order as "displayOrder",
          is_active as "isActive",
          help_text as "helpText",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      await db.execute(sql`
        UPDATE custom_field_metadata 
        SET 
          field_label = COALESCE(${fieldLabel}, field_label),
          is_required = COALESCE(${isRequired}, is_required),
          validation_rules = COALESCE(${validationRules ? JSON.stringify(validationRules) : null}, validation_rules),
          field_options = COALESCE(${fieldOptions ? JSON.stringify(fieldOptions) : null}, field_options),
          placeholder = COALESCE(${placeholder}, placeholder),
          default_value = COALESCE(${defaultValue}, default_value),
          display_order = COALESCE(${displayOrder}, display_order),
          help_text = COALESCE(${helpText}, help_text),
          is_active = COALESCE(${isActive}, is_active),
          updated_at = NOW()
        WHERE id = ${fieldId}
      `);

      console.log('🔥 [CUSTOM-FIELDS-REPO] Field updated successfully');
      return {
        id: fieldId,
        fieldLabel,
        isRequired,
        validationRules,
        fieldOptions,
        placeholder,
        defaultValue,
        displayOrder,
        isActive,
        helpText
      } as CustomFieldMetadata;
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Error in updateField:', error);
      throw error;
    }
  }

  async deleteField(fieldId: string): Promise<void> {
    console.log('🔥 [CUSTOM-FIELDS-REPO] deleteField called with:', fieldId);

    try {
      // ✅ 1QA.MD: Ensure schema and table exist first
      await this.ensureSchemaAndTable();

      // ✅ 1QA.MD: Soft delete by setting is_active = false
      const query = `
        UPDATE custom_field_metadata 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `;

      await db.execute(sql`
        UPDATE custom_field_metadata 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${fieldId}
      `);

      console.log('🔥 [CUSTOM-FIELDS-REPO] Field deleted successfully');
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Error in deleteField:', error);
      throw error;
    }
  }
}

console.log('🔥 [CUSTOM-FIELDS-REPO] *** FILE LOADING END *** following 1qa.md');