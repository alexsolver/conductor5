// ✅ 1QA.MD COMPLIANCE: REPORTS MODULE DATABASE SCHEMA
// PostgreSQL schema for Reports and Dashboards module with tenant isolation

import { pgTable, text, timestamp, boolean, jsonb, uuid, integer, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ========================================
// REPORTS TABLE
// ========================================
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  dataSource: varchar('data_source', { length: 100 }).notNull(), // tickets, customers, materials, etc.
  reportType: varchar('report_type', { length: 50 }).notNull().default('table'), // table, chart, dashboard
  category: varchar('category', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, published, archived
  ownerId: uuid('owner_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  isTemplate: boolean('is_template').notNull().default(false),
  allowedRoles: jsonb('allowed_roles').default('[]'), // JSON array of role names
  config: jsonb('config').notNull(), // Report configuration including fields, filters, etc.
  visualization: jsonb('visualization'), // Chart/visualization settings
  metadata: jsonb('metadata').default('{}'), // Additional metadata
  scheduleConfig: jsonb('schedule_config'), // Scheduled execution settings
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// ========================================
// REPORT EXECUTIONS TABLE
// ========================================
export const reportExecutions = pgTable('report_executions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  reportId: uuid('report_id').notNull(),
  executedBy: uuid('executed_by').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('running'), // running, completed, failed
  parameters: jsonb('parameters').default('{}'), // Execution parameters
  results: jsonb('results'), // Execution results/data
  executionTime: integer('execution_time'), // Time in milliseconds
  errorMessage: text('error_message'),
  recordCount: integer('record_count'),
  startedAt: timestamp('started_at').notNull().default(sql`now()`),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// ========================================
// REPORT TEMPLATES TABLE
// ========================================
export const reportTemplates = pgTable('report_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  moduleId: varchar('module_id', { length: 100 }).notNull(), // tickets, customers, materials, etc.
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  templateConfig: jsonb('template_config').notNull(), // Pre-configured template settings
  accessLevel: varchar('access_level', { length: 50 }).notNull().default('public'), // public, private, department, executive
  isActive: boolean('is_active').notNull().default(true),
  ownerId: uuid('owner_id'),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// ========================================
// DASHBOARDS TABLE
// ========================================
export const dashboards = pgTable('dashboards', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  layout: jsonb('layout').notNull(), // Dashboard layout configuration
  ownerId: uuid('owner_id').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  allowedRoles: jsonb('allowed_roles').default('[]'),
  refreshInterval: integer('refresh_interval').default(300), // Auto-refresh in seconds
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// ========================================
// DASHBOARD WIDGETS TABLE
// ========================================
export const dashboardWidgets = pgTable('dashboard_widgets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  dashboardId: uuid('dashboard_id').notNull(),
  reportId: uuid('report_id'), // Optional - widget can be independent
  widgetType: varchar('widget_type', { length: 50 }).notNull(), // report, metric, chart, kpi
  name: varchar('name', { length: 255 }).notNull(),
  position: jsonb('position').notNull(), // Grid position and size
  config: jsonb('config').notNull(), // Widget-specific configuration
  dataSource: varchar('data_source', { length: 100 }),
  refreshInterval: integer('refresh_interval').default(300),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// ========================================
// REPORT NOTIFICATIONS TABLE
// ========================================
export const reportNotifications = pgTable('report_notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  reportId: uuid('report_id').notNull(),
  userId: uuid('user_id').notNull(),
  notificationType: varchar('notification_type', { length: 50 }).notNull(), // email, in_app, sms, slack
  triggerCondition: jsonb('trigger_condition').notNull(), // Condition that triggers notification
  recipients: jsonb('recipients').notNull(), // List of recipients
  isActive: boolean('is_active').notNull().default(true),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// ========================================
// REPORT SHARING TABLE
// ========================================
export const reportSharing = pgTable('report_sharing', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  reportId: uuid('report_id').notNull(),
  sharedBy: uuid('shared_by').notNull(),
  sharedWith: uuid('shared_with'), // User ID if shared with specific user
  shareLevel: varchar('share_level', { length: 50 }).notNull(), // view, edit, execute
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// Export all tables
export const reportsSchema = {
  reports,
  reportExecutions,
  reportTemplates,
  dashboards,
  dashboardWidgets,
  reportNotifications,
  reportSharing
};