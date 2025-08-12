/**
 * Custom Field Repository Interface - Phase 12 Implementation
 * 
 * Interface do repositório para operações de persistência de Custom Fields
 * Define contratos para operações de dados sem dependências externas
 * 
 * @module ICustomFieldRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

import { CustomField, CustomFieldEntity } from '../entities/CustomField';

export interface CustomFieldFilters {
  tenantId?: string;
  moduleType?: string;
  fieldType?: string;
  isRequired?: boolean;
  isActive?: boolean;
  fieldGroup?: string;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CustomFieldStatistics {
  totalFields: number;
  activeFields: number;
  inactiveFields: number;
  fieldsByModule: Record<string, number>;
  fieldsByType: Record<string, number>;
  requiredFields: number;
  optionalFields: number;
  fieldsWithOptions: number;
  fieldsWithValidation: number;
  fieldsWithConditionalLogic: number;
}

export interface ModuleFieldSchema {
  moduleType: string;
  fields: Array<{
    name: string;
    schema: Record<string, any>;
  }>;
  totalFields: number;
  requiredFields: number;
}

export interface ICustomFieldRepository {
  // ===== CRUD OPERATIONS =====
  
  /**
   * Create a new custom field
   */
  create(field: CustomField): Promise<CustomField>;
  
  /**
   * Find custom field by ID
   */
  findById(id: string, tenantId: string): Promise<CustomField | null>;
  
  /**
   * Find custom field by name within module
   */
  findByName(fieldName: string, moduleType: string, tenantId: string): Promise<CustomField | null>;
  
  /**
   * Find all custom fields with optional filtering
   */
  findAll(filters: CustomFieldFilters): Promise<CustomField[]>;
  
  /**
   * Update custom field by ID
   */
  update(id: string, tenantId: string, updateData: Partial<CustomField>): Promise<CustomField | null>;
  
  /**
   * Delete custom field (soft delete)
   */
  delete(id: string, tenantId: string): Promise<boolean>;
  
  /**
   * Hard delete custom field
   */
  hardDelete(id: string, tenantId: string): Promise<boolean>;
  
  // ===== MODULE-SPECIFIC OPERATIONS =====
  
  /**
   * Find fields by module type
   */
  findByModule(moduleType: string, tenantId: string): Promise<CustomField[]>;
  
  /**
   * Find active fields by module type
   */
  findActiveByModule(moduleType: string, tenantId: string): Promise<CustomField[]>;
  
  /**
   * Find required fields by module type
   */
  findRequiredByModule(moduleType: string, tenantId: string): Promise<CustomField[]>;
  
  /**
   * Find fields by field type
   */
  findByFieldType(fieldType: string, tenantId: string): Promise<CustomField[]>;
  
  /**
   * Find fields by group
   */
  findByGroup(fieldGroup: string, tenantId: string): Promise<CustomField[]>;
  
  /**
   * Get fields ordered by display order
   */
  findOrderedByModule(moduleType: string, tenantId: string): Promise<CustomField[]>;
  
  // ===== VALIDATION OPERATIONS =====
  
  /**
   * Check if field name exists in module
   */
  existsByName(fieldName: string, moduleType: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Validate field configuration
   */
  validateFieldConfiguration(field: Partial<CustomField>): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  
  /**
   * Get available field names for module
   */
  getAvailableFieldNames(moduleType: string, tenantId: string): Promise<string[]>;
  
  /**
   * Get field schema for module
   */
  getModuleFieldSchema(moduleType: string, tenantId: string): Promise<ModuleFieldSchema>;
  
  // ===== ANALYTICS OPERATIONS =====
  
  /**
   * Get custom field statistics
   */
  getStatistics(tenantId: string): Promise<CustomFieldStatistics>;
  
  /**
   * Count fields by filters
   */
  count(filters: CustomFieldFilters): Promise<number>;
  
  /**
   * Get modules with custom fields
   */
  getModulesWithFields(tenantId: string): Promise<Array<{ 
    moduleType: string; 
    fieldCount: number; 
    activeFieldCount: number; 
    requiredFieldCount: number; 
  }>>;
  
  /**
   * Get field types usage statistics
   */
  getFieldTypesUsage(tenantId: string): Promise<Array<{ 
    fieldType: string; 
    count: number; 
    percentage: number; 
  }>>;
  
  // ===== ORDERING OPERATIONS =====
  
  /**
   * Reorder fields in module
   */
  reorderFields(moduleType: string, tenantId: string, fieldOrders: Array<{ 
    fieldId: string; 
    displayOrder: number; 
  }>): Promise<CustomField[]>;
  
  /**
   * Get next display order for module
   */
  getNextDisplayOrder(moduleType: string, tenantId: string): Promise<number>;
  
  /**
   * Move field up in order
   */
  moveFieldUp(id: string, tenantId: string): Promise<boolean>;
  
  /**
   * Move field down in order
   */
  moveFieldDown(id: string, tenantId: string): Promise<boolean>;
  
  // ===== BULK OPERATIONS =====
  
  /**
   * Create multiple custom fields
   */
  createBulk(fields: CustomField[]): Promise<CustomField[]>;
  
  /**
   * Update multiple custom fields
   */
  updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<CustomField> }>): Promise<CustomField[]>;
  
  /**
   * Clone fields from one module to another
   */
  cloneFields(sourceModule: string, targetModule: string, tenantId: string, createdBy?: string): Promise<CustomField[]>;
  
  /**
   * Import fields from configuration
   */
  importFields(fieldsConfig: Array<Partial<CustomField>>, tenantId: string, createdBy?: string): Promise<{
    success: CustomField[];
    errors: Array<{ row: number; error: string; data: Partial<CustomField> }>;
  }>;
  
  /**
   * Export fields configuration
   */
  exportFields(filters: CustomFieldFilters): Promise<CustomField[]>;
  
  // ===== TEMPLATE OPERATIONS =====
  
  /**
   * Get field templates by category
   */
  getFieldTemplates(category?: string): Promise<Array<{
    name: string;
    label: string;
    type: string;
    category: string;
    defaultConfig: Partial<CustomField>;
  }>>;
  
  /**
   * Apply field template
   */
  applyFieldTemplate(templateName: string, moduleType: string, tenantId: string, customizations?: Partial<CustomField>): Promise<CustomField>;
  
  // ===== CONDITIONAL LOGIC OPERATIONS =====
  
  /**
   * Find fields with conditional logic
   */
  findFieldsWithConditionalLogic(moduleType: string, tenantId: string): Promise<CustomField[]>;
  
  /**
   * Validate conditional logic dependencies
   */
  validateConditionalLogicDependencies(field: CustomField, tenantId: string): Promise<{
    isValid: boolean;
    missingDependencies: string[];
    circularReferences: string[];
  }>;
  
  /**
   * Get field dependencies map
   */
  getFieldDependenciesMap(moduleType: string, tenantId: string): Promise<Record<string, string[]>>;
}