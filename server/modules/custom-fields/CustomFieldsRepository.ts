import { eq, and, desc } from 'drizzle-orm';
import { SchemaManager } from '../../storage.ts';
import { 
  customFieldsMetadata, 
  customFieldsValues, 
  tenantModuleAccess,
  CustomFieldMetadata,
  InsertCustomFieldMetadata,
  CustomFieldValue,
  InsertCustomFieldValue,
  TenantModuleAccess,
  InsertTenantModuleAccess,
  ModuleType
} from '../../../shared/schema-custom-fields.js';

export class CustomFieldsRepository {
  constructor(private schemaManager: SchemaManager) {}

  // ===========================
  // CUSTOM FIELDS METADATA METHODS
  // ===========================

  async getFieldsByModule(tenantId: string, moduleType: ModuleType): Promise<CustomFieldMetadata[]> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    return await db
      .select()
      .from(customFieldsMetadata)
      .where(
        and(
          eq(customFieldsMetadata.tenantId, tenantId),
          eq(customFieldsMetadata.moduleType, moduleType),
          eq(customFieldsMetadata.isActive, true)
        )
      )
      .orderBy(customFieldsMetadata.displayOrder, customFieldsMetadata.createdAt);
  }

  async getFieldById(tenantId: string, fieldId: string): Promise<CustomFieldMetadata | null> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    const [field] = await db
      .select()
      .from(customFieldsMetadata)
      .where(
        and(
          eq(customFieldsMetadata.tenantId, tenantId),
          eq(customFieldsMetadata.id, fieldId)
        )
      );
    
    return field || null;
  }

  async createField(tenantId: string, fieldData: Omit<InsertCustomFieldMetadata, 'tenantId'>, createdBy: string): Promise<CustomFieldMetadata> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    const [created] = await db
      .insert(customFieldsMetadata)
      .values({
        ...fieldData,
        tenantId,
        createdBy,
        updatedBy: createdBy
      })
      .returning();
    
    return created;
  }

  async updateField(tenantId: string, fieldId: string, fieldData: Partial<InsertCustomFieldMetadata>, updatedBy: string): Promise<CustomFieldMetadata | null> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    const [updated] = await db
      .update(customFieldsMetadata)
      .set({
        ...fieldData,
        updatedBy,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(customFieldsMetadata.tenantId, tenantId),
          eq(customFieldsMetadata.id, fieldId)
        )
      )
      .returning();
    
    return updated || null;
  }

  async deleteField(tenantId: string, fieldId: string): Promise<boolean> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    // Soft delete - mark as inactive
    const [updated] = await db
      .update(customFieldsMetadata)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(customFieldsMetadata.tenantId, tenantId),
          eq(customFieldsMetadata.id, fieldId)
        )
      )
      .returning();
    
    return !!updated;
  }

  async reorderFields(tenantId: string, moduleType: ModuleType, fieldOrders: { fieldId: string; order: number }[]): Promise<void> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    for (const { fieldId, order } of fieldOrders) {
      await db
        .update(customFieldsMetadata)
        .set({
          displayOrder: order,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(customFieldsMetadata.tenantId, tenantId),
            eq(customFieldsMetadata.id, fieldId),
            eq(customFieldsMetadata.moduleType, moduleType)
          )
        );
    }
  }

  // ===========================
  // CUSTOM FIELDS VALUES METHODS
  // ===========================

  async getEntityValues(tenantId: string, entityId: string, entityType: ModuleType): Promise<Record<string, any>> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    const values = await db
      .select({
        fieldName: customFieldsMetadata.fieldName,
        fieldValue: customFieldsValues.fieldValue,
        fieldType: customFieldsMetadata.fieldType
      })
      .from(customFieldsValues)
      .innerJoin(customFieldsMetadata, eq(customFieldsValues.fieldId, customFieldsMetadata.id))
      .where(
        and(
          eq(customFieldsValues.tenantId, tenantId),
          eq(customFieldsValues.entityId, entityId),
          eq(customFieldsValues.entityType, entityType)
        )
      );
    
    const result: Record<string, any> = {};
    for (const value of values) {
      result[value.fieldName] = value.fieldValue;
    }
    
    return result;
  }

  async saveEntityValues(tenantId: string, entityId: string, entityType: ModuleType, values: Record<string, any>): Promise<void> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    // Get field definitions for this module
    const fields = await this.getFieldsByModule(tenantId, entityType);
    
    for (const field of fields) {
      if (values.hasOwnProperty(field.fieldName)) {
        const fieldValue = values[field.fieldName];
        
        // Check if value already exists
        const [existingValue] = await db
          .select()
          .from(customFieldsValues)
          .where(
            and(
              eq(customFieldsValues.tenantId, tenantId),
              eq(customFieldsValues.fieldId, field.id),
              eq(customFieldsValues.entityId, entityId),
              eq(customFieldsValues.entityType, entityType)
            )
          );
        
        if (existingValue) {
          // Update existing value
          await db
            .update(customFieldsValues)
            .set({
              fieldValue,
              updatedAt: new Date()
            })
            .where(eq(customFieldsValues.id, existingValue.id));
        } else {
          // Insert new value
          await db
            .insert(customFieldsValues)
            .values({
              tenantId,
              fieldId: field.id,
              entityId,
              entityType,
              fieldValue
            });
        }
      }
    }
  }

  async deleteEntityValues(tenantId: string, entityId: string, entityType: ModuleType): Promise<void> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    await db
      .delete(customFieldsValues)
      .where(
        and(
          eq(customFieldsValues.tenantId, tenantId),
          eq(customFieldsValues.entityId, entityId),
          eq(customFieldsValues.entityType, entityType)
        )
      );
  }

  // ===========================
  // TENANT MODULE ACCESS METHODS
  // ===========================

  async getTenantModuleAccess(tenantId: string): Promise<Record<ModuleType, boolean>> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    const modules = await db
      .select()
      .from(tenantModuleAccess)
      .where(eq(tenantModuleAccess.tenantId, tenantId));
    
    const result: Record<ModuleType, boolean> = {
      customers: true,
      favorecidos: true,
      tickets: true,
      skills: true,
      'materials-services': true,
      locations: true
    };
    
    for (const module of modules) {
      result[module.moduleType as ModuleType] = module.isEnabled;
    }
    
    return result;
  }

  async updateModuleAccess(tenantId: string, moduleType: ModuleType, isEnabled: boolean): Promise<void> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    const [existing] = await db
      .select()
      .from(tenantModuleAccess)
      .where(
        and(
          eq(tenantModuleAccess.tenantId, tenantId),
          eq(tenantModuleAccess.moduleType, moduleType)
        )
      );
    
    if (existing) {
      await db
        .update(tenantModuleAccess)
        .set({
          isEnabled,
          updatedAt: new Date()
        })
        .where(eq(tenantModuleAccess.id, existing.id));
    } else {
      await db
        .insert(tenantModuleAccess)
        .values({
          tenantId,
          moduleType,
          isEnabled
        });
    }
  }

  // ===========================
  // VALIDATION METHODS
  // ===========================

  async validateFieldValue(tenantId: string, fieldId: string, value: any): Promise<{ isValid: boolean; error?: string }> {
    const field = await this.getFieldById(tenantId, fieldId);
    
    if (!field) {
      return { isValid: false, error: 'Campo não encontrado' };
    }

    // Check if required
    if (field.isRequired && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `Campo ${field.fieldLabel} é obrigatório` };
    }

    // Type-specific validations
    if (value !== null && value !== undefined && value !== '') {
      switch (field.fieldType) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return { isValid: false, error: 'Email inválido' };
          }
          break;
        
        case 'phone':
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            return { isValid: false, error: 'Telefone inválido' };
          }
          break;
        
        case 'number':
          if (isNaN(Number(value))) {
            return { isValid: false, error: 'Valor deve ser um número' };
          }
          break;
      }

      // Custom validation rules
      if (field.validationRules) {
        const rules = field.validationRules as any;
        
        if (rules.minLength && value.length < rules.minLength) {
          return { isValid: false, error: `Mínimo ${rules.minLength} caracteres` };
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          return { isValid: false, error: `Máximo ${rules.maxLength} caracteres` };
        }
        
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          return { isValid: false, error: rules.customMessage || 'Formato inválido' };
        }
        
        if (rules.min && Number(value) < rules.min) {
          return { isValid: false, error: `Valor mínimo: ${rules.min}` };
        }
        
        if (rules.max && Number(value) > rules.max) {
          return { isValid: false, error: `Valor máximo: ${rules.max}` };
        }
      }
    }

    return { isValid: true };
  }

  // ===========================
  // STATISTICS METHODS
  // ===========================

  async getModuleFieldStats(tenantId: string, moduleType: ModuleType): Promise<{
    totalFields: number;
    activeFields: number;
    requiredFields: number;
    fieldsByType: Record<string, number>;
  }> {
    const { db } = await this.schemaManager.getTenantDb(tenantId);
    
    const fields = await db
      .select()
      .from(customFieldsMetadata)
      .where(
        and(
          eq(customFieldsMetadata.tenantId, tenantId),
          eq(customFieldsMetadata.moduleType, moduleType)
        )
      );
    
    const fieldsByType: Record<string, number> = {};
    let requiredFields = 0;
    let activeFields = 0;
    
    for (const field of fields) {
      if (field.isActive) activeFields++;
      if (field.isRequired) requiredFields++;
      
      fieldsByType[field.fieldType] = (fieldsByType[field.fieldType] || 0) + 1;
    }
    
    return {
      totalFields: fields.length,
      activeFields,
      requiredFields,
      fieldsByType
    };
  }
}