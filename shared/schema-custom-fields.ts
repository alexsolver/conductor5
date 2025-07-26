import { pgTable, uuid, varchar, boolean, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===========================
// CUSTOM FIELDS METADATA TABLE
// ===========================

export const customFieldsMetadata = pgTable('custom_fields_metadata', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  moduleType: varchar('module_type', { length: 50 }).notNull(), // 'customers', 'tickets', 'favorecidos', etc.
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  fieldType: varchar('field_type', { length: 30 }).notNull(), // 'text', 'number', 'select', etc.
  fieldLabel: varchar('field_label', { length: 200 }).notNull(),
  isRequired: boolean('is_required').default(false),
  validationRules: jsonb('validation_rules'), // regex, min/max length, custom validations
  fieldOptions: jsonb('field_options'), // para selects: [{"value": "opt1", "label": "Opção 1", "color": "#ff0000"}]
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: uuid('updated_by')
});

// ===========================
// CUSTOM FIELDS VALUES TABLE
// ===========================

export const customFieldsValues = pgTable('custom_fields_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  fieldId: uuid('field_id').notNull().references(() => customFieldsMetadata.id),
  entityId: uuid('entity_id').notNull(), // ID do registro (customer, ticket, etc.)
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'customers', 'tickets', etc.
  fieldValue: jsonb('field_value'), // valor dinâmico do campo
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ===========================
// TENANT MODULE ACCESS TABLE
// ===========================

export const tenantModuleAccess = pgTable('tenant_module_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  moduleType: varchar('module_type', { length: 50 }).notNull(),
  isEnabled: boolean('is_enabled').default(true),
  configuration: jsonb('configuration'), // configurações específicas do módulo
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ===========================
// ZOD SCHEMAS
// ===========================

// Validation rules schema
export const validationRulesSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(), // regex
  customMessage: z.string().optional(),
  min: z.number().optional(), // for numbers
  max: z.number().optional(), // for numbers
}).optional();

// Field options schema (for select/multiselect)
export const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isDefault: z.boolean().optional()
});

export const fieldOptionsSchema = z.array(fieldOptionSchema).optional();

// Custom Fields Metadata Insert Schema
export const insertCustomFieldMetadataSchema = createInsertSchema(customFieldsMetadata, {
  moduleType: z.enum(['customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations']),
  fieldType: z.enum(['text', 'number', 'select', 'multiselect', 'date', 'boolean', 'textarea', 'file', 'email', 'phone']),
  validationRules: validationRulesSchema,
  fieldOptions: fieldOptionsSchema
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Custom Fields Values Insert Schema
export const insertCustomFieldValueSchema = createInsertSchema(customFieldsValues, {
  entityType: z.enum(['customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations']),
  fieldValue: z.any() // dynamic value
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tenant Module Access Insert Schema
export const insertTenantModuleAccessSchema = createInsertSchema(tenantModuleAccess, {
  moduleType: z.enum(['customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations'])
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ===========================
// TYPES
// ===========================

export type CustomFieldMetadata = typeof customFieldsMetadata.$inferSelect;
export type InsertCustomFieldMetadata = z.infer<typeof insertCustomFieldMetadataSchema>;

export type CustomFieldValue = typeof customFieldsValues.$inferSelect;
export type InsertCustomFieldValue = z.infer<typeof insertCustomFieldValueSchema>;

export type TenantModuleAccess = typeof tenantModuleAccess.$inferSelect;
export type InsertTenantModuleAccess = z.infer<typeof insertTenantModuleAccessSchema>;

export type ValidationRules = z.infer<typeof validationRulesSchema>;
export type FieldOption = z.infer<typeof fieldOptionSchema>;

// Module types
export type ModuleType = 'customers' | 'favorecidos' | 'tickets' | 'skills' | 'materials-services' | 'locations';
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'textarea' | 'file' | 'email' | 'phone';

// ===========================
// FIELD BUILDER INTERFACE
// ===========================

export interface FieldCreationInterface {
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldType;
  isRequired: boolean;
  validation?: ValidationRules;
  options?: FieldOption[]; // Para campos SELECT/MULTISELECT
  displayOrder: number;
}

// ===========================
// TENANT MODULE CONFIGURATION
// ===========================

export interface TenantModuleConfiguration {
  tenantId: string;
  enabledModules: {
    customers: boolean;
    favorecidos: boolean;
    tickets: boolean;
    skills: boolean;
    materialsServices: boolean;
    locations: boolean;
  };
  customFieldsPerModule: Record<ModuleType, CustomFieldMetadata[]>;
}