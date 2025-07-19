
import { pgTable, text, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const internalForms = pgTable('internal_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  fields: jsonb('fields').notNull(),
  actions: jsonb('actions').notNull(),
  approvalFlow: jsonb('approval_flow'),
  isActive: boolean('is_active').default(true),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => internalForms.id),
  tenantId: text('tenant_id').notNull(),
  data: jsonb('data').notNull(),
  submittedBy: text('submitted_by').notNull(),
  status: text('status').notNull().default('submitted'),
  approvals: jsonb('approvals'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

export const formCategories = pgTable('form_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('FileText'),
  createdAt: timestamp('created_at').defaultNow()
});
