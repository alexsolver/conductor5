// ===========================================================================================
// SAAS ADMIN MODULE SCHEMA - Clean Architecture Compliance
// ===========================================================================================
// Seguindo rigorosamente o padrão 1qa.md para schema definitions

import { 
  pgTable, 
  varchar, 
  text, 
  json, 
  timestamp, 
  pgEnum,
  serial,
  boolean,
  uuid 
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===========================================================================================
// ENUMS - Domain Value Objects
// ===========================================================================================

export const integrationStatusEnum = pgEnum('integration_status', [
  'connected', 
  'error', 
  'disconnected'
]);

export const integrationProviderEnum = pgEnum('integration_provider', [
  'openweather',
  'google_maps',
  'slack',
  'microsoft_teams',
  'zoom',
  'aws',
  'azure',
  'sendgrid',
  'twilio',
  'stripe'
]);

// ===========================================================================================
// SAAS INTEGRATIONS TABLE - Global Level (Non-Tenant Specific)
// ===========================================================================================

export const saasIntegrations = pgTable('saas_integrations', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  provider: integrationProviderEnum('provider').notNull(),
  description: text('description'),
  config: json('config').notNull().default({}),
  status: integrationStatusEnum('status').notNull().default('disconnected'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// ===========================================================================================
// SAAS ADMIN SETTINGS TABLE - Global Configuration
// ===========================================================================================

export const saasAdminSettings = pgTable('saas_admin_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: json('value'),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull().default('general'),
  isPublic: varchar('is_public', { length: 10 }).notNull().default('false'), // 'true' or 'false'
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// ===========================================================================================
// SAAS ADMIN AUDIT LOG - Action Tracking
// ===========================================================================================

export const saasAdminAuditLog = pgTable('saas_admin_audit_log', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar('admin_user_id').notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  targetType: varchar('target_type', { length: 100 }).notNull(), // 'tenant', 'user', 'integration', etc.
  targetId: varchar('target_id'),
  details: json('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// ===========================================================================================
// SAAS GROUPS TABLE - Global Groups Managed by SaaS Admin
// ===========================================================================================

export const saasGroups = pgTable('saas_groups', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  createdById: uuid('created_by_id') // References users table but no FK constraint for flexibility
});

// ===========================================================================================
// SAAS GROUP MEMBERSHIPS TABLE - Global Group Memberships
// ===========================================================================================

export const saasGroupMemberships = pgTable('saas_group_memberships', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: uuid('group_id').notNull().references(() => saasGroups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(), // References users table but no FK constraint for flexibility
  role: varchar('role', { length: 100 }).notNull().default('member'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  assignedById: uuid('assigned_by_id') // References users table but no FK constraint for flexibility
});

// ===========================================================================================
// ZOD VALIDATION SCHEMAS
// ===========================================================================================

export const insertSaasIntegrationSchema = createInsertSchema(saasIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSaasAdminSettingsSchema = createInsertSchema(saasAdminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSaasAdminAuditLogSchema = createInsertSchema(saasAdminAuditLog).omit({
  id: true,
  timestamp: true
});

export const insertSaasGroupSchema = createInsertSchema(saasGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSaasGroupMembershipSchema = createInsertSchema(saasGroupMemberships).omit({
  id: true,
  createdAt: true
});

// ===========================================================================================
// TYPESCRIPT TYPES
// ===========================================================================================

export type SaasIntegration = typeof saasIntegrations.$inferSelect;
export type InsertSaasIntegration = z.infer<typeof insertSaasIntegrationSchema>;

export type SaasAdminSettings = typeof saasAdminSettings.$inferSelect;
export type InsertSaasAdminSettings = z.infer<typeof insertSaasAdminSettingsSchema>;

export type SaasAdminAuditLog = typeof saasAdminAuditLog.$inferSelect;
export type InsertSaasAdminAuditLog = z.infer<typeof insertSaasAdminAuditLogSchema>;

export type SaasGroup = typeof saasGroups.$inferSelect;
export type InsertSaasGroup = z.infer<typeof insertSaasGroupSchema>;

export type SaasGroupMembership = typeof saasGroupMemberships.$inferSelect;
export type InsertSaasGroupMembership = z.infer<typeof insertSaasGroupMembershipSchema>;

// ===========================================================================================
// INTEGRATION CONFIG VALIDATION SCHEMAS
// ===========================================================================================

export const openWeatherConfigSchema = z.object({
  apiKey: z.string().min(32, 'OpenWeather API key must be at least 32 characters'),
  baseUrl: z.string().url().optional().default('https://api.openweathermap.org/data/2.5'),
  enabled: z.boolean().default(true),
  maxRequests: z.number().min(1).max(10000).optional().default(1000),
  rateLimit: z.number().min(1).max(1000).optional().default(60),
  timeout: z.number().min(1000).max(30000).optional().default(5000),
  retryAttempts: z.number().min(0).max(10).optional().default(3)
});

export const integrationConfigSchemas = {
  openweather: openWeatherConfigSchema,
  google_maps: z.object({
    apiKey: z.string().min(1),
    enabled: z.boolean().default(true)
  }),
  slack: z.object({
    botToken: z.string().min(1),
    webhookUrl: z.string().url().optional(),
    enabled: z.boolean().default(true)
  }),
  // Add more provider schemas as needed
} as const;

export type IntegrationProvider = keyof typeof integrationConfigSchemas;