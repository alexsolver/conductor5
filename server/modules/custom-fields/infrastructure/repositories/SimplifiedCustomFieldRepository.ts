/**
 * Simplified Custom Field Repository - Phase 12 Implementation
 * 
 * Implementação simplificada do repositório de campos personalizados
 * Para uso imediato enquanto integração com banco não está disponível
 * 
 * @module SimplifiedCustomFieldRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

import { CustomField } from '../../domain/entities/CustomField';
import { 
  ICustomFieldRepository, 
  CustomFieldFilters, 
  CustomFieldStatistics, 
  ModuleFieldSchema 
} from '../../domain/repositories/ICustomFieldRepository';

export class SimplifiedCustomFieldRepository implements ICustomFieldRepository {
  private fields: CustomField[] = [];

  async create(field: CustomField): Promise<CustomField> {
    this.fields.push(field);
    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Created field: ${field.id} (${field.fieldName} - ${field.fieldLabel}) for module: ${field.moduleType} tenant: ${field.tenantId}`);
    return field;
  }

  async findById(id: string, tenantId: string): Promise<CustomField | null> {
    const field = this.fields.find(f => f.id === id && f.tenantId === tenantId);
    return field || null;
  }

  async findByName(fieldName: string, moduleType: string, tenantId: string): Promise<CustomField | null> {
    const field = this.fields.find(f => 
      f.fieldName === fieldName && 
      f.moduleType === moduleType && 
      f.tenantId === tenantId
    );
    return field || null;
  }

  async findAll(filters: CustomFieldFilters): Promise<CustomField[]> {
    let filteredFields = this.fields.filter(field => {
      if (filters.tenantId && field.tenantId !== filters.tenantId) return false;
      if (filters.moduleType && field.moduleType !== filters.moduleType) return false;
      if (filters.fieldType && field.fieldType !== filters.fieldType) return false;
      if (filters.isRequired !== undefined && field.isRequired !== filters.isRequired) return false;
      if (filters.isActive !== undefined && field.isActive !== filters.isActive) return false;
      if (filters.fieldGroup && field.fieldGroup !== filters.fieldGroup) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = field.fieldName.toLowerCase().includes(searchLower);
        const matchesLabel = field.fieldLabel.toLowerCase().includes(searchLower);
        const matchesHelpText = field.helpText?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesLabel && !matchesHelpText) return false;
      }
      if (filters.createdAfter && field.createdAt < filters.createdAfter) return false;
      if (filters.createdBefore && field.createdAt > filters.createdBefore) return false;
      return true;
    });

    return filteredFields.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async update(id: string, tenantId: string, updateData: Partial<CustomField>): Promise<CustomField | null> {
    const index = this.fields.findIndex(f => f.id === id && f.tenantId === tenantId);
    if (index === -1) return null;

    this.fields[index] = { ...this.fields[index], ...updateData, updatedAt: new Date() };
    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Updated field: ${id} for tenant: ${tenantId}`);
    return this.fields[index];
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const index = this.fields.findIndex(f => f.id === id && f.tenantId === tenantId);
    if (index === -1) return false;

    this.fields[index].isActive = false;
    this.fields[index].updatedAt = new Date();
    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Soft deleted field: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async hardDelete(id: string, tenantId: string): Promise<boolean> {
    const index = this.fields.findIndex(f => f.id === id && f.tenantId === tenantId);
    if (index === -1) return false;

    this.fields.splice(index, 1);
    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Hard deleted field: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async findByModule(moduleType: string, tenantId: string): Promise<CustomField[]> {
    return this.fields
      .filter(f => f.moduleType === moduleType && f.tenantId === tenantId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findActiveByModule(moduleType: string, tenantId: string): Promise<CustomField[]> {
    return this.fields
      .filter(f => f.moduleType === moduleType && f.tenantId === tenantId && f.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findRequiredByModule(moduleType: string, tenantId: string): Promise<CustomField[]> {
    return this.fields
      .filter(f => f.moduleType === moduleType && f.tenantId === tenantId && f.isRequired && f.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findByFieldType(fieldType: string, tenantId: string): Promise<CustomField[]> {
    return this.fields.filter(f => f.fieldType === fieldType && f.tenantId === tenantId);
  }

  async findByGroup(fieldGroup: string, tenantId: string): Promise<CustomField[]> {
    return this.fields
      .filter(f => f.fieldGroup === fieldGroup && f.tenantId === tenantId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findOrderedByModule(moduleType: string, tenantId: string): Promise<CustomField[]> {
    return this.findByModule(moduleType, tenantId);
  }

  async existsByName(fieldName: string, moduleType: string, tenantId: string, excludeId?: string): Promise<boolean> {
    return this.fields.some(field => 
      field.fieldName === fieldName && 
      field.moduleType === moduleType && 
      field.tenantId === tenantId && 
      (!excludeId || field.id !== excludeId)
    );
  }

  async validateFieldConfiguration(field: Partial<CustomField>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!field.fieldName) errors.push('Nome do campo é obrigatório');
    if (!field.fieldLabel) errors.push('Label do campo é obrigatório');
    if (!field.fieldType) errors.push('Tipo do campo é obrigatório');
    if (!field.moduleType) errors.push('Tipo de módulo é obrigatório');

    // Field name format validation
    if (field.fieldName && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.fieldName)) {
      errors.push('Nome do campo deve ser um identificador válido');
    }

    // Select field validation
    if ((field.fieldType === 'select' || field.fieldType === 'multiselect') && 
        (!field.fieldOptions || field.fieldOptions.length === 0)) {
      errors.push('Campos do tipo select/multiselect devem ter opções definidas');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async getAvailableFieldNames(moduleType: string, tenantId: string): Promise<string[]> {
    const moduleFields = await this.findByModule(moduleType, tenantId);
    return moduleFields.map(f => f.fieldName);
  }

  async getModuleFieldSchema(moduleType: string, tenantId: string): Promise<ModuleFieldSchema> {
    const fields = await this.findActiveByModule(moduleType, tenantId);
    const requiredFields = fields.filter(f => f.isRequired);

    return {
      moduleType,
      fields: fields.map(field => ({
        name: field.fieldName,
        schema: {
          type: field.fieldType,
          label: field.fieldLabel,
          required: field.isRequired,
          order: field.displayOrder,
          ...(field.defaultValue && { defaultValue: field.defaultValue }),
          ...(field.placeholder && { placeholder: field.placeholder }),
          ...(field.helpText && { helpText: field.helpText }),
          ...(field.fieldGroup && { group: field.fieldGroup }),
          ...(field.fieldOptions && { options: field.fieldOptions }),
          ...(field.validationRules && { validation: field.validationRules }),
          ...(field.conditionalLogic && { conditional: field.conditionalLogic })
        }
      })),
      totalFields: fields.length,
      requiredFields: requiredFields.length
    };
  }

  async getStatistics(tenantId: string): Promise<CustomFieldStatistics> {
    const tenantFields = this.fields.filter(f => f.tenantId === tenantId);
    
    const totalFields = tenantFields.length;
    const activeFields = tenantFields.filter(f => f.isActive).length;
    const inactiveFields = tenantFields.filter(f => !f.isActive).length;
    const requiredFields = tenantFields.filter(f => f.isRequired).length;
    const optionalFields = tenantFields.filter(f => !f.isRequired).length;
    const fieldsWithOptions = tenantFields.filter(f => f.fieldOptions && f.fieldOptions.length > 0).length;
    const fieldsWithValidation = tenantFields.filter(f => f.validationRules && Object.keys(f.validationRules).length > 0).length;
    const fieldsWithConditionalLogic = tenantFields.filter(f => f.conditionalLogic && Object.keys(f.conditionalLogic).length > 0).length;

    const fieldsByModule = tenantFields.reduce((acc, field) => {
      acc[field.moduleType] = (acc[field.moduleType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const fieldsByType = tenantFields.reduce((acc, field) => {
      acc[field.fieldType] = (acc[field.fieldType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFields,
      activeFields,
      inactiveFields,
      fieldsByModule,
      fieldsByType,
      requiredFields,
      optionalFields,
      fieldsWithOptions,
      fieldsWithValidation,
      fieldsWithConditionalLogic
    };
  }

  async count(filters: CustomFieldFilters): Promise<number> {
    const fields = await this.findAll(filters);
    return fields.length;
  }

  async getModulesWithFields(tenantId: string): Promise<Array<{ 
    moduleType: string; 
    fieldCount: number; 
    activeFieldCount: number; 
    requiredFieldCount: number; 
  }>> {
    const tenantFields = this.fields.filter(f => f.tenantId === tenantId);
    const moduleMap = new Map<string, { total: number; active: number; required: number }>();

    tenantFields.forEach(field => {
      if (!moduleMap.has(field.moduleType)) {
        moduleMap.set(field.moduleType, { total: 0, active: 0, required: 0 });
      }
      
      const stats = moduleMap.get(field.moduleType)!;
      stats.total++;
      if (field.isActive) stats.active++;
      if (field.isRequired) stats.required++;
    });

    return Array.from(moduleMap.entries()).map(([moduleType, stats]) => ({
      moduleType,
      fieldCount: stats.total,
      activeFieldCount: stats.active,
      requiredFieldCount: stats.required
    }));
  }

  async getFieldTypesUsage(tenantId: string): Promise<Array<{ 
    fieldType: string; 
    count: number; 
    percentage: number; 
  }>> {
    const tenantFields = this.fields.filter(f => f.tenantId === tenantId);
    const total = tenantFields.length;
    
    if (total === 0) return [];

    const typeMap = tenantFields.reduce((acc, field) => {
      acc[field.fieldType] = (acc[field.fieldType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeMap).map(([fieldType, count]) => ({
      fieldType,
      count,
      percentage: Math.round((count / total) * 100 * 100) / 100
    }));
  }

  async reorderFields(moduleType: string, tenantId: string, fieldOrders: Array<{ 
    fieldId: string; 
    displayOrder: number; 
  }>): Promise<CustomField[]> {
    const updatedFields: CustomField[] = [];

    for (const { fieldId, displayOrder } of fieldOrders) {
      const updated = await this.update(fieldId, tenantId, { 
        displayOrder, 
        updatedAt: new Date() 
      });
      if (updated) {
        updatedFields.push(updated);
      }
    }

    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Reordered ${updatedFields.length} fields in module: ${moduleType}`);
    return updatedFields;
  }

  async getNextDisplayOrder(moduleType: string, tenantId: string): Promise<number> {
    const moduleFields = await this.findByModule(moduleType, tenantId);
    if (moduleFields.length === 0) return 0;
    
    const maxOrder = Math.max(...moduleFields.map(f => f.displayOrder));
    return maxOrder + 1;
  }

  async moveFieldUp(id: string, tenantId: string): Promise<boolean> {
    const field = await this.findById(id, tenantId);
    if (!field || field.displayOrder === 0) return false;

    const moduleFields = await this.findByModule(field.moduleType, tenantId);
    const currentIndex = moduleFields.findIndex(f => f.id === id);
    
    if (currentIndex <= 0) return false;

    const previousField = moduleFields[currentIndex - 1];
    
    // Swap orders
    await this.update(id, tenantId, { displayOrder: previousField.displayOrder });
    await this.update(previousField.id, tenantId, { displayOrder: field.displayOrder });
    
    return true;
  }

  async moveFieldDown(id: string, tenantId: string): Promise<boolean> {
    const field = await this.findById(id, tenantId);
    if (!field) return false;

    const moduleFields = await this.findByModule(field.moduleType, tenantId);
    const currentIndex = moduleFields.findIndex(f => f.id === id);
    
    if (currentIndex === -1 || currentIndex >= moduleFields.length - 1) return false;

    const nextField = moduleFields[currentIndex + 1];
    
    // Swap orders
    await this.update(id, tenantId, { displayOrder: nextField.displayOrder });
    await this.update(nextField.id, tenantId, { displayOrder: field.displayOrder });
    
    return true;
  }

  // Simplified implementations for bulk operations
  async createBulk(fields: CustomField[]): Promise<CustomField[]> {
    const createdFields: CustomField[] = [];
    for (const field of fields) {
      createdFields.push(await this.create(field));
    }
    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Created ${createdFields.length} fields in bulk`);
    return createdFields;
  }

  async updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<CustomField> }>): Promise<CustomField[]> {
    const updatedFields: CustomField[] = [];
    
    for (const update of updates) {
      const updatedField = await this.update(update.id, update.tenantId, update.data);
      if (updatedField) {
        updatedFields.push(updatedField);
      }
    }

    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Updated ${updatedFields.length} fields in bulk`);
    return updatedFields;
  }

  async cloneFields(sourceModule: string, targetModule: string, tenantId: string, createdBy?: string): Promise<CustomField[]> {
    const sourceFields = await this.findActiveByModule(sourceModule, tenantId);
    const clonedFields: CustomField[] = [];

    for (const sourceField of sourceFields) {
      const clonedField: CustomField = {
        ...sourceField,
        id: `field_cloned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        moduleType: targetModule,
        fieldName: `${sourceField.fieldName}_copy`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        updatedBy: undefined
      };

      const created = await this.create(clonedField);
      clonedFields.push(created);
    }

    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Cloned ${clonedFields.length} fields from ${sourceModule} to ${targetModule}`);
    return clonedFields;
  }

  async importFields(fieldsConfig: Array<Partial<CustomField>>, tenantId: string, createdBy?: string): Promise<{
    success: CustomField[];
    errors: Array<{ row: number; error: string; data: Partial<CustomField> }>;
  }> {
    const success: CustomField[] = [];
    const errors: Array<{ row: number; error: string; data: Partial<CustomField> }> = [];

    for (let i = 0; i < fieldsConfig.length; i++) {
      const fieldConfig = fieldsConfig[i];
      
      try {
        // Basic validation
        if (!fieldConfig.fieldName || !fieldConfig.fieldLabel || !fieldConfig.fieldType || !fieldConfig.moduleType) {
          throw new Error('Field name, label, type, and module type are required');
        }

        // Check for duplicate field name
        const fieldExists = await this.existsByName(fieldConfig.fieldName, fieldConfig.moduleType, tenantId);
        if (fieldExists) {
          throw new Error(`Field '${fieldConfig.fieldName}' already exists in module '${fieldConfig.moduleType}'`);
        }

        // Create the field
        const field: CustomField = {
          id: `field_import_${Date.now()}_${i}`,
          tenantId,
          moduleType: fieldConfig.moduleType!,
          fieldName: fieldConfig.fieldName,
          fieldType: fieldConfig.fieldType as any,
          fieldLabel: fieldConfig.fieldLabel,
          isRequired: fieldConfig.isRequired || false,
          validationRules: fieldConfig.validationRules,
          fieldOptions: fieldConfig.fieldOptions,
          displayOrder: fieldConfig.displayOrder || 0,
          isActive: fieldConfig.isActive !== false,
          defaultValue: fieldConfig.defaultValue,
          placeholder: fieldConfig.placeholder,
          helpText: fieldConfig.helpText,
          fieldGroup: fieldConfig.fieldGroup,
          conditionalLogic: fieldConfig.conditionalLogic,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy,
          updatedBy: undefined
        };

        const createdField = await this.create(field);
        success.push(createdField);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: fieldConfig
        });
      }
    }

    console.log(`[SIMPLIFIED-CUSTOM-FIELD-REPO] Imported ${success.length} fields, ${errors.length} errors`);
    return { success, errors };
  }

  async exportFields(filters: CustomFieldFilters): Promise<CustomField[]> {
    return await this.findAll(filters);
  }

  // Simplified template operations
  async getFieldTemplates(category?: string): Promise<Array<{
    name: string;
    label: string;
    type: string;
    category: string;
    defaultConfig: Partial<CustomField>;
  }>> {
    const templates = [
      {
        name: 'basic_text',
        label: 'Basic Text Field',
        type: 'text',
        category: 'basic',
        defaultConfig: {
          fieldType: 'text' as const,
          isRequired: false,
          placeholder: 'Enter text...'
        }
      },
      {
        name: 'email_field',
        label: 'Email Field',
        type: 'email',
        category: 'contact',
        defaultConfig: {
          fieldType: 'email' as const,
          isRequired: true,
          placeholder: 'user@example.com',
          validationRules: { email: true }
        }
      },
      {
        name: 'phone_field',
        label: 'Phone Field',
        type: 'phone',
        category: 'contact',
        defaultConfig: {
          fieldType: 'phone' as const,
          placeholder: '(11) 99999-9999',
          validationRules: { phone: true }
        }
      },
      {
        name: 'date_field',
        label: 'Date Field',
        type: 'date',
        category: 'datetime',
        defaultConfig: {
          fieldType: 'date' as const,
          isRequired: false
        }
      },
      {
        name: 'yes_no_select',
        label: 'Yes/No Select',
        type: 'select',
        category: 'choice',
        defaultConfig: {
          fieldType: 'select' as const,
          fieldOptions: ['Yes', 'No'],
          defaultValue: 'No'
        }
      }
    ];

    return category ? templates.filter(t => t.category === category) : templates;
  }

  async applyFieldTemplate(templateName: string, moduleType: string, tenantId: string, customizations?: Partial<CustomField>): Promise<CustomField> {
    const templates = await this.getFieldTemplates();
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const nextOrder = await this.getNextDisplayOrder(moduleType, tenantId);
    
    const field: CustomField = {
      id: `field_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      moduleType,
      fieldName: customizations?.fieldName || `${template.name}_field`,
      fieldLabel: customizations?.fieldLabel || template.label,
      displayOrder: customizations?.displayOrder || nextOrder,
      ...template.defaultConfig,
      ...customizations,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as CustomField;

    return await this.create(field);
  }

  async findFieldsWithConditionalLogic(moduleType: string, tenantId: string): Promise<CustomField[]> {
    const fields = await this.findByModule(moduleType, tenantId);
    return fields.filter(f => f.conditionalLogic && Object.keys(f.conditionalLogic).length > 0);
  }

  async validateConditionalLogicDependencies(field: CustomField, tenantId: string): Promise<{
    isValid: boolean;
    missingDependencies: string[];
    circularReferences: string[];
  }> {
    // Simplified implementation
    const missingDependencies: string[] = [];
    const circularReferences: string[] = [];

    if (field.conditionalLogic) {
      // Check if dependent fields exist
      const moduleFields = await this.findByModule(field.moduleType, tenantId);
      const fieldNames = moduleFields.map(f => f.fieldName);

      // Simple check for referenced fields in conditional logic
      const dependencies = Object.keys(field.conditionalLogic);
      for (const dep of dependencies) {
        if (!fieldNames.includes(dep)) {
          missingDependencies.push(dep);
        }
      }
    }

    return {
      isValid: missingDependencies.length === 0 && circularReferences.length === 0,
      missingDependencies,
      circularReferences
    };
  }

  async getFieldDependenciesMap(moduleType: string, tenantId: string): Promise<Record<string, string[]>> {
    const fields = await this.findFieldsWithConditionalLogic(moduleType, tenantId);
    const dependenciesMap: Record<string, string[]> = {};

    fields.forEach(field => {
      if (field.conditionalLogic) {
        dependenciesMap[field.fieldName] = Object.keys(field.conditionalLogic);
      }
    });

    return dependenciesMap;
  }
}