
import { schemaManager } from '../../db';
import { sql } from 'drizzle-orm';

export class CustomFieldsRepository {
  private schemaManager: any;

  constructor(schemaManager: any) {
    this.schemaManager = schemaManager;
  }

  // Get all fields for a specific module
  async getFieldsByModule(tenantId: string, moduleType: string) {
    try {
      const schema = await this.schemaManager.getSchema(tenantId);
      const db = await this.schemaManager.getConnection(tenantId);

      const result = await db.execute(sql`
        SELECT 
          id,
          module_type,
          field_name,
          field_type,
          field_label,
          is_required,
          validation_rules,
          field_options,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM custom_fields_metadata 
        WHERE tenant_id = ${tenantId} 
          AND module_type = ${moduleType}
          AND is_active = true
        ORDER BY display_order ASC, created_at ASC
      `);

      return result.rows || [];
    } catch (error) {
      console.error('Error getting fields by module:', error);
      throw error;
    }
  }

  // Get specific field by ID
  async getFieldById(tenantId: string, fieldId: string) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      const result = await db.execute(sql`
        SELECT 
          id,
          module_type,
          field_name,
          field_type,
          field_label,
          is_required,
          validation_rules,
          field_options,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM custom_fields_metadata 
        WHERE tenant_id = ${tenantId} 
          AND id = ${fieldId}
          AND is_active = true
      `);

      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error getting field by ID:', error);
      throw error;
    }
  }

  // Create new field
  async createField(fieldData: any) {
    try {
      const db = await this.schemaManager.getConnection(fieldData.tenantId);

      const result = await db.execute(sql`
        INSERT INTO custom_fields_metadata (
          tenant_id,
          module_type,
          field_name,
          field_type,
          field_label,
          is_required,
          validation_rules,
          field_options,
          display_order,
          created_by,
          updated_by
        ) VALUES (
          ${fieldData.tenantId},
          ${fieldData.moduleType},
          ${fieldData.fieldName},
          ${fieldData.fieldType},
          ${fieldData.fieldLabel},
          ${fieldData.isRequired || false},
          ${JSON.stringify(fieldData.validationRules || {})},
          ${JSON.stringify(fieldData.fieldOptions || {})},
          ${fieldData.displayOrder || 0},
          ${fieldData.createdBy},
          ${fieldData.updatedBy}
        )
        RETURNING *
      `);

      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error creating field:', error);
      throw error;
    }
  }

  // Update field
  async updateField(tenantId: string, fieldId: string, updateData: any) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      const result = await db.execute(sql`
        UPDATE custom_fields_metadata 
        SET 
          field_label = ${updateData.fieldLabel},
          is_required = ${updateData.isRequired},
          validation_rules = ${JSON.stringify(updateData.validationRules || {})},
          field_options = ${JSON.stringify(updateData.fieldOptions || {})},
          display_order = ${updateData.displayOrder},
          updated_by = ${updateData.updatedBy},
          updated_at = NOW()
        WHERE tenant_id = ${tenantId} 
          AND id = ${fieldId}
          AND is_active = true
        RETURNING *
      `);

      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  }

  // Delete field (soft delete)
  async deleteField(tenantId: string, fieldId: string) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      await db.execute(sql`
        UPDATE custom_fields_metadata 
        SET is_active = false, updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND id = ${fieldId}
      `);

      // Also delete related values
      await db.execute(sql`
        DELETE FROM custom_fields_values 
        WHERE tenant_id = ${tenantId} AND field_id = ${fieldId}
      `);
    } catch (error) {
      console.error('Error deleting field:', error);
      throw error;
    }
  }

  // Reorder fields
  async reorderFields(tenantId: string, moduleType: string, fieldOrders: Array<{ fieldId: string; order: number }>) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      for (const { fieldId, order } of fieldOrders) {
        await db.execute(sql`
          UPDATE custom_fields_metadata 
          SET display_order = ${order}, updated_at = NOW()
          WHERE tenant_id = ${tenantId} 
            AND id = ${fieldId}
            AND module_type = ${moduleType}
        `);
      }
    } catch (error) {
      console.error('Error reordering fields:', error);
      throw error;
    }
  }

  // Get entity values
  async getEntityValues(tenantId: string, entityType: string, entityId: string) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      const result = await db.execute(sql`
        SELECT 
          cfv.field_id,
          cfv.field_value,
          cfm.field_name,
          cfm.field_type,
          cfm.field_label
        FROM custom_fields_values cfv
        JOIN custom_fields_metadata cfm ON cfv.field_id = cfm.id
        WHERE cfv.tenant_id = ${tenantId} 
          AND cfv.entity_type = ${entityType}
          AND cfv.entity_id = ${entityId}
          AND cfm.is_active = true
      `);

      return result.rows || [];
    } catch (error) {
      console.error('Error getting entity values:', error);
      throw error;
    }
  }

  // Save entity values
  async saveEntityValues(tenantId: string, entityType: string, entityId: string, values: Record<string, any>, userId: string) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      // Delete existing values
      await db.execute(sql`
        DELETE FROM custom_fields_values 
        WHERE tenant_id = ${tenantId} 
          AND entity_type = ${entityType}
          AND entity_id = ${entityId}
      `);

      // Insert new values
      for (const [fieldId, value] of Object.entries(values)) {
        if (value !== null && value !== undefined && value !== '') {
          await db.execute(sql`
            INSERT INTO custom_fields_values (
              tenant_id,
              field_id,
              entity_type,
              entity_id,
              field_value,
              created_by,
              updated_by
            ) VALUES (
              ${tenantId},
              ${fieldId},
              ${entityType},
              ${entityId},
              ${JSON.stringify(value)},
              ${userId},
              ${userId}
            )
          `);
        }
      }
    } catch (error) {
      console.error('Error saving entity values:', error);
      throw error;
    }
  }

  // Delete entity values
  async deleteEntityValues(tenantId: string, entityType: string, entityId: string) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      await db.execute(sql`
        DELETE FROM custom_fields_values 
        WHERE tenant_id = ${tenantId} 
          AND entity_type = ${entityType}
          AND entity_id = ${entityId}
      `);
    } catch (error) {
      console.error('Error deleting entity values:', error);
      throw error;
    }
  }

  // Get tenant module access
  async getTenantModuleAccess(tenantId: string) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      const result = await db.execute(sql`
        SELECT module_type, has_access 
        FROM tenant_module_access 
        WHERE tenant_id = ${tenantId}
      `);

      return result.rows || [];
    } catch (error) {
      console.error('Error getting tenant module access:', error);
      return [];
    }
  }

  // Update module access
  async updateModuleAccess(tenantId: string, moduleType: string, hasAccess: boolean) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      await db.execute(sql`
        INSERT INTO tenant_module_access (tenant_id, module_type, has_access)
        VALUES (${tenantId}, ${moduleType}, ${hasAccess})
        ON CONFLICT (tenant_id, module_type) 
        DO UPDATE SET has_access = ${hasAccess}, updated_at = NOW()
      `);
    } catch (error) {
      console.error('Error updating module access:', error);
      throw error;
    }
  }

  // Get module field statistics
  async getModuleFieldStats(tenantId: string, moduleType: string) {
    try {
      const db = await this.schemaManager.getConnection(tenantId);

      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_fields,
          COUNT(CASE WHEN is_required = true THEN 1 END) as required_fields,
          COUNT(CASE WHEN field_type = 'text' THEN 1 END) as text_fields,
          COUNT(CASE WHEN field_type = 'select' THEN 1 END) as select_fields
        FROM custom_fields_metadata 
        WHERE tenant_id = ${tenantId} 
          AND module_type = ${moduleType}
          AND is_active = true
      `);

      return result.rows?.[0] || {};
    } catch (error) {
      console.error('Error getting module field stats:', error);
      throw error;
    }
  }
}

export default CustomFieldsRepository;
