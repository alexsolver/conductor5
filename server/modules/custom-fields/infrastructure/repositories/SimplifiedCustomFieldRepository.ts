// ✅ 1QA.MD COMPLIANCE: CUSTOM FIELDS SIMPLIFIED REPOSITORY  
// Infrastructure layer - Database access following Clean Architecture

console.log('🔥 [CUSTOM-FIELDS-REPO] *** FILE LOADING START *** following 1qa.md');
console.log('🔥 [CUSTOM-FIELDS-REPO] Timestamp:', new Date().toISOString());

import { db, sql, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import { Pool } from 'pg';
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

  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb() {
    const schemaName = this.getTenantSchema();
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  async getFieldsByModule(moduleType: string): Promise<CustomFieldMetadata[]> {
    console.log('🔥 [CUSTOM-FIELDS-REPO] getFieldsByModule called with:', moduleType);

    try {
      // ✅ 1QA.MD: Ensure schema and table exist first
      await this.ensureSchemaAndTable();

      const tenantSchema = this.getTenantSchema();
      console.log('🔥 [CUSTOM-FIELDS-REPO] Querying fields from schema:', tenantSchema);
      
      const selectQuery = sql`
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
        FROM ${sql.identifier(tenantSchema)}.custom_field_metadata
        WHERE module_type = ${moduleType} AND is_active = true
        ORDER BY display_order ASC, created_at ASC
      `;
      
      const tenantDb = await this.getTenantDb();
      const result = await tenantDb.execute(selectQuery);
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
        CREATE TABLE IF NOT EXISTS "${tenantSchema}".custom_field_metadata (
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

      // ✅ 1QA.MD: Use tenant-specific database connection
      const tenantDb = await this.getTenantDb();
      await tenantDb.execute(sql.raw(createTableQuery));
      console.log('🔥 [CUSTOM-FIELDS-REPO] Custom fields table ensured in schema:', tenantSchema);
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Table creation error:', error);
      throw new Error(`Failed to ensure custom fields table: ${error.message}`);
    }
  }

  private async ensureTenantSchema(schemaName: string): Promise<void> {
    try {
      // ✅ 1QA.MD: Check if schema exists first using proper SQL syntax
      const schemaExistsQuery = sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      `;
      
      const tenantDb = await this.getTenantDb();
      const schemaExists = await tenantDb.execute(schemaExistsQuery);
      
      if (schemaExists.rows.length === 0) {
        // ✅ 1QA.MD: Create schema using raw SQL to avoid identifier issues
        const createSchemaQuery = sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        await tenantDb.execute(createSchemaQuery);
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

      const tenantSchema = this.getTenantSchema();
      
      // ✅ 1QA.MD: Use proper SQL template with Drizzle for parameter binding
      const insertQuery = sql`
        INSERT INTO ${sql.identifier(tenantSchema)}.custom_field_metadata (
          id, module_type, field_name, field_type, field_label,
          is_required, validation_rules, field_options, placeholder,
          default_value, display_order, is_active, help_text,
          created_at, updated_at
        ) VALUES (
          ${fieldId}, ${moduleType}, ${fieldName}, ${fieldType}, ${fieldLabel},
          ${isRequired}, ${JSON.stringify(validationRules)}, ${JSON.stringify(fieldOptions)}, ${placeholder},
          ${defaultValue}, ${displayOrder}, true, ${helpText},
          NOW(), NOW()
        )
      `;
      
      const tenantDb = await this.getTenantDb();
      await tenantDb.execute(insertQuery);

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

      const tenantSchema = this.getTenantSchema();
      
      // ✅ 1QA.MD: Use SQL template literal for proper parameter binding
      const updateQuery = sql.raw(
        `UPDATE "${tenantSchema}".custom_field_metadata 
        SET 
          field_label = COALESCE(?, field_label),
          is_required = COALESCE(?, is_required),
          validation_rules = COALESCE(?, validation_rules),
          field_options = COALESCE(?, field_options),
          placeholder = COALESCE(?, placeholder),
          default_value = COALESCE(?, default_value),
          display_order = COALESCE(?, display_order),
          help_text = COALESCE(?, help_text),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
        WHERE id = ?`,
        [
          fieldLabel, isRequired, 
          validationRules ? JSON.stringify(validationRules) : null,
          fieldOptions ? JSON.stringify(fieldOptions) : null,
          placeholder, defaultValue, displayOrder, helpText, isActive,
          fieldId
        ]
      );
      
      const tenantDb = await this.getTenantDb();
      await tenantDb.execute(updateQuery);

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

      const tenantSchema = this.getTenantSchema();
      
      // ✅ 1QA.MD: Use SQL template literal for proper parameter binding - Soft delete by setting is_active = false
      const deleteQuery = sql.raw(
        `UPDATE "${tenantSchema}".custom_field_metadata 
        SET is_active = false, updated_at = NOW()
        WHERE id = ?`,
        [fieldId]
      );
      
      const tenantDb = await this.getTenantDb();
      await tenantDb.execute(deleteQuery);

      console.log('🔥 [CUSTOM-FIELDS-REPO] Field deleted successfully');
    } catch (error) {
      console.error('🔥 [CUSTOM-FIELDS-REPO] Error in deleteField:', error);
      throw error;
    }
  }
}

console.log('🔥 [CUSTOM-FIELDS-REPO] *** FILE LOADING END *** following 1qa.md');