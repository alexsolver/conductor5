/**
 * Internal Forms Module Schema - v2.0
 * Clean Architecture - Domain-Driven Design
 * 
 * Este módulo define formulários personalizados que podem ser anexados a ações internas
 * de tickets para automatizar processos operacionais.
 * 
 * @module schema-internal-forms
 * @version 2.0.0
 * @updated 2025-10-08 - Refatoração completa com novos field types
 */

import { pgTable, uuid, varchar, text, jsonb, boolean, timestamp, integer, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ========================================
// ENUMS & TYPES
// ========================================

export const FormFieldTypeEnum = z.enum([
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'url',
  'date',
  'datetime',
  'time',
  'select',
  'multiselect',
  'radio',
  'checkbox',
  'file',
  'currency',
  'color',
  'rating',
  'signature',
  'user_select',
  'group_select',
]);

export type FormFieldType = z.infer<typeof FormFieldTypeEnum>;

export const FormSubmissionStatusEnum = z.enum([
  'submitted',
  'in_approval',
  'approved',
  'rejected'
]);

export type FormSubmissionStatus = z.infer<typeof FormSubmissionStatusEnum>;

// ========================================
// FIELD DEFINITION SCHEMAS
// ========================================

// AI Metadata Schema - Instruções invisíveis para IA preencher formulários
export const AIMetadataSchema = z.object({
  aiPrompt: z.string().optional(), // Prompt/instruções para a IA sobre este campo
  extractionHints: z.string().optional(), // Dicas de como extrair/validar o valor
  autoActions: z.array(z.string()).optional(), // Ações automáticas: search_client, create_if_not_found, etc
  examples: z.array(z.string()).optional(), // Exemplos de valores válidos para a IA
  aiValidation: z.string().optional(), // Validação pré-envio pela IA
}).optional();

export type AIMetadata = z.infer<typeof AIMetadataSchema>;

const BaseFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome do campo é obrigatório"),
  label: z.string().min(1, "Rótulo do campo é obrigatório"),
  type: FormFieldTypeEnum,
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.any().optional(),
  order: z.number().default(0),
  
  // Metadados para IA (invisível para usuário)
  aiMetadata: AIMetadataSchema,
});

const TextFieldSchema = BaseFieldSchema.extend({
  type: z.literal('text'),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
});

const NumberFieldSchema = BaseFieldSchema.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
});

const SelectFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['select', 'multiselect', 'radio']),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string().optional(),
  })),
});

const FileFieldSchema = BaseFieldSchema.extend({
  type: z.literal('file'),
  acceptedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(), // in bytes
  maxFiles: z.number().optional(),
});

const CurrencyFieldSchema = BaseFieldSchema.extend({
  type: z.literal('currency'),
  currency: z.string().default('BRL'),
  min: z.number().optional(),
  max: z.number().optional(),
});

const RatingFieldSchema = BaseFieldSchema.extend({
  type: z.literal('rating'),
  maxRating: z.number().default(5),
  allowHalf: z.boolean().default(false),
});

const DateTimeFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['date', 'datetime', 'time']),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

export const FormFieldSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  NumberFieldSchema,
  SelectFieldSchema,
  FileFieldSchema,
  CurrencyFieldSchema,
  RatingFieldSchema,
  DateTimeFieldSchema,
  BaseFieldSchema.extend({ type: z.enum(['textarea', 'email', 'phone', 'url', 'checkbox', 'color', 'signature', 'user_select', 'group_select']) }),
]);

export type FormField = z.infer<typeof FormFieldSchema>;

// ========================================
// CONDITIONAL LOGIC SCHEMA
// ========================================

export const ConditionalLogicSchema = z.object({
  rules: z.array(z.object({
    id: z.string(),
    fieldId: z.string(),
    condition: z.object({
      sourceFieldId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
      value: z.any(),
    }),
    action: z.enum(['show', 'hide', 'enable', 'disable']),
  })),
});

export type ConditionalLogic = z.infer<typeof ConditionalLogicSchema>;

// ========================================
// DATABASE TABLES
// ========================================

export const internalForms = pgTable('internal_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull().default('Geral'),
  icon: varchar('icon', { length: 50 }).default('FileText'),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  fields: jsonb('fields').notNull().default('[]'),
  conditionalLogic: jsonb('conditional_logic').default('{}'),
  
  // Recursos Avançados
  validationRules: jsonb('validation_rules').default('{}'), // Regras de validação (CPF, CNPJ, cross-field, etc)
  calculationFormulas: jsonb('calculation_formulas').default('{}'), // Fórmulas matemáticas para campos calculados
  
  isActive: boolean('is_active').notNull().default(true),
  isTemplate: boolean('is_template').default(false),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by'),
}, (table) => [
  check('tenant_id_uuid_format', 
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  )
]);

export const internalFormSubmissions = pgTable('internal_form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  ticketId: uuid('ticket_id'),
  actionId: uuid('action_id'),
  submittedBy: varchar('submitted_by', { length: 255 }).notNull(),
  submittedAt: timestamp('submitted_at').defaultNow(),
  data: jsonb('data').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('submitted'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
}, (table) => [
  check('tenant_id_uuid_format', 
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  )
]);

export const internalFormCategories = pgTable('internal_form_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').default(0),
}, (table) => [
  check('tenant_id_uuid_format', 
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  )
]);

export const customFormEntityLinks = pgTable('custom_form_entity_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  submissionId: uuid('submission_id').notNull(),
  fieldId: varchar('field_id', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by').notNull(),
}, (table) => [
  check('tenant_id_uuid_format', 
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  )
]);

// ========================================
// ZOD SCHEMAS FOR VALIDATION
// ========================================

export const insertInternalFormSchema = createInsertSchema(internalForms, {
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  fields: z.array(FormFieldSchema).min(1, "Adicione pelo menos um campo"),
  conditionalLogic: ConditionalLogicSchema.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateInternalFormSchema = insertInternalFormSchema.partial().extend({
  id: z.string().uuid(),
});

export const insertInternalFormSubmissionSchema = createInsertSchema(internalFormSubmissions, {
  data: z.record(z.any()),
  status: FormSubmissionStatusEnum.default('submitted'),
}).omit({
  id: true,
  submittedAt: true,
});

export const insertInternalFormCategorySchema = createInsertSchema(internalFormCategories, {
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal").optional(),
}).omit({
  id: true,
});

// ========================================
// TYPE EXPORTS
// ========================================

export type InternalForm = typeof internalForms.$inferSelect;
export type InsertInternalForm = z.infer<typeof insertInternalFormSchema>;
export type UpdateInternalForm = z.infer<typeof updateInternalFormSchema>;

export type InternalFormSubmission = typeof internalFormSubmissions.$inferSelect;
export type InsertInternalFormSubmission = z.infer<typeof insertInternalFormSubmissionSchema>;

export type InternalFormCategory = typeof internalFormCategories.$inferSelect;
export type InsertInternalFormCategory = z.infer<typeof insertInternalFormCategorySchema>;
