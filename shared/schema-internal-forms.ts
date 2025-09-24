
/**
 * Internal Forms Schema - Phase 10 Implementation
 * 
 * Schema Drizzle para tabelas de Internal Forms
 * Segue padrões estabelecidos no 1qa.md para multitenant
 * 
 * @module SchemaInternalForms
 * @version 1.0.0
 * @created 2025-09-24 - Phase 10 Clean Architecture Implementation
 */

import { pgTable, uuid, varchar, text, jsonb, boolean, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ✅ 1QA.MD MULTITENANT COMPLIANCE: All tables include tenant_id with UUID v4 validation
export const internalForms = pgTable('internal_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // ✅ OBRIGATÓRIO para multitenant
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  fields: jsonb('fields').notNull().default('[]'),
  actions: jsonb('actions').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by')
}, (table) => [
  // ✅ CONSTRAINT obrigatório para tenant_id UUID v4
  check('tenant_id_uuid_format', 
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  )
]);

export const internalFormSubmissions = pgTable('internal_form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull(),
  tenantId: uuid('tenant_id').notNull(), // ✅ OBRIGATÓRIO para multitenant
  submittedBy: uuid('submitted_by').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow(),
  data: jsonb('data').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('submitted'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason')
}, (table) => [
  // ✅ CONSTRAINT obrigatório para tenant_id UUID v4
  check('tenant_id_uuid_format', 
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  )
]);

export const internalFormCategories = pgTable('internal_form_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // ✅ OBRIGATÓRIO para multitenant
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  isActive: boolean('is_active').notNull().default(true)
}, (table) => [
  // ✅ CONSTRAINT obrigatório para tenant_id UUID v4
  check('tenant_id_uuid_format', 
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  )
]);

// Types
export type InternalForm = typeof internalForms.$inferSelect;
export type InsertInternalForm = typeof internalForms.$inferInsert;
export type UpdateInternalForm = Partial<InsertInternalForm>;

export type InternalFormSubmission = typeof internalFormSubmissions.$inferSelect;
export type InsertInternalFormSubmission = typeof internalFormSubmissions.$inferInsert;

export type InternalFormCategory = typeof internalFormCategories.$inferSelect;
export type InsertInternalFormCategory = typeof internalFormCategories.$inferInsert;
