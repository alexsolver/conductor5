// NOTIFICATIONS & ALERTS SCHEMA
// Complete notification system for multi-tenant SaaS platform

import {
  pgTable,
  varchar,
  uuid,
  timestamp,
  text,
  jsonb,
  boolean,
  integer,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions for notification types
export const notificationTypeEnum = z.enum([
  // Sistema
  'system_db_connection_failure',
  'system_db_pool_exhausted', 
  'system_query_timeout',
  'system_auth_error',
  'system_schema_validation_failure',
  'system_tenant_isolation_violation',
  
  // Tickets
  'ticket_created',
  'ticket_assigned',
  'ticket_status_changed',
  'ticket_sla_escalation',
  'ticket_comment_added',
  'ticket_approval_request',
  
  // Operacional de Campo
  'field_technician_arrived',
  'field_technician_departed',
  'field_schedule_delayed',
  'field_service_timeout',
  'field_urgent_support_request',
  'field_equipment_failure',
  
  // Timecard/Ponto
  'timecard_entry_exit',
  'timecard_overtime_detected',
  'timecard_absence_unjustified',
  'timecard_inconsistency',
  'timecard_adjustment_approval',
  
  // Segurança
  'security_suspicious_login',
  'security_permission_changed',
  'security_after_hours_access',
  'security_access_denied_multiple',
  
  // Genérico
  'custom',
  'automation_notification'
]);

export const notificationSeverityEnum = z.enum([
  'low',
  'medium', 
  'high',
  'critical'
]);

export const notificationStatusEnum = z.enum([
  'pending',
  'scheduled',
  'sent',
  'delivered',
  'failed',
  'expired',
  'cancelled'
]);

export const notificationChannelEnum = z.enum([
  'in_app',
  'email',
  'sms',
  'push',
  'webhook',
  'dashboard_alert'
]);

// Main notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Classification
  type: varchar("type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default('medium'),
  category: varchar("category", { length: 100 }), // Sistema, Tickets, Campo, Timecard, Segurança
  
  // Content
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").default({}),
  
  // Recipients
  userId: uuid("user_id"), // Null for broadcast notifications
  userIds: text("user_ids").array(), // Multiple recipients
  roleFilter: varchar("role_filter", { length: 100 }), // Filter by role
  departmentFilter: varchar("department_filter", { length: 100 }), // Filter by department
  
  // Delivery
  channels: text("channels").array().notNull(), // Array of delivery channels
  preferredChannel: varchar("preferred_channel", { length: 50 }),
  
  // Scheduling & Status
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  failedAt: timestamp("failed_at"),
  expiresAt: timestamp("expires_at"), // Null for permanent notifications
  
  // Retry Logic
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  retryInterval: integer("retry_interval").default(300), // 5 minutes in seconds
  
  // Business Context
  relatedEntityType: varchar("related_entity_type", { length: 100 }), // ticket, user, system, etc.
  relatedEntityId: uuid("related_entity_id"),
  relatedEntityData: jsonb("related_entity_data").default({}),
  
  // Escalation Rules
  escalationRules: jsonb("escalation_rules").default({}),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: uuid("escalated_to"),
  
  // Templates
  templateId: uuid("template_id"), // Reference to notification template
  templateVariables: jsonb("template_variables").default({}),
  
  // Tracking
  deliveryStats: jsonb("delivery_stats").default({}), // Channel-specific delivery stats
  engagementStats: jsonb("engagement_stats").default({}), // Open rates, click rates, etc.
  
  // System fields
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // TENANT-FIRST OPTIMIZED INDEXES for multi-tenant performance
  index("notifications_tenant_status_idx").on(table.tenantId, table.status),
  index("notifications_tenant_type_idx").on(table.tenantId, table.type),
  index("notifications_tenant_severity_idx").on(table.tenantId, table.severity),
  index("notifications_tenant_scheduled_idx").on(table.tenantId, table.scheduledAt),
  index("notifications_tenant_user_idx").on(table.tenantId, table.userId),
  index("notifications_tenant_entity_idx").on(table.tenantId, table.relatedEntityType, table.relatedEntityId),
  index("notifications_tenant_created_idx").on(table.tenantId, table.createdAt),
  index("notifications_status_scheduled_idx").on(table.status, table.scheduledAt), // For processing engine
]);

// Notification templates for reusability
export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  
  // Template content
  titleTemplate: varchar("title_template", { length: 500 }).notNull(),
  messageTemplate: text("message_template").notNull(),
  
  // Channel-specific templates
  emailTemplate: text("email_template"),
  smsTemplate: text("sms_template"),
  pushTemplate: text("push_template"),
  
  // Default settings
  defaultChannels: text("default_channels").array(),
  defaultSeverity: varchar("default_severity", { length: 20 }).default('medium'),
  defaultExpiryHours: integer("default_expiry_hours"), // Null for no expiry
  
  // Business rules
  triggerConditions: jsonb("trigger_conditions").default({}),
  escalationRules: jsonb("escalation_rules").default({}),
  frequencyRules: jsonb("frequency_rules").default({}), // Rate limiting rules
  
  // Template variables schema
  variablesSchema: jsonb("variables_schema").default({}),
  
  // System fields
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("notification_templates_tenant_name").on(table.tenantId, table.name),
  index("notification_templates_tenant_type_idx").on(table.tenantId, table.type),
  index("notification_templates_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// User notification preferences - Simple schema compatible with existing Clean Architecture
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  
  // Simplified preferences structure following 1qa.md patterns
  preferences: jsonb("preferences").notNull(),
  
  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("user_notification_preferences_tenant_user").on(table.tenantId, table.userId),
  index("user_notification_preferences_tenant_idx").on(table.tenantId),
]);

// Notification delivery log for tracking and analytics
export const notificationDeliveryLog = pgTable("notification_delivery_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  notificationId: uuid("notification_id").notNull(),
  
  // Delivery details
  channel: varchar("channel", { length: 50 }).notNull(),
  recipientId: uuid("recipient_id"), // User who received it
  recipientAddress: varchar("recipient_address", { length: 500 }), // Email, phone, etc.
  
  // Delivery status
  status: varchar("status", { length: 20 }).notNull(), // sent, delivered, failed, bounced
  attemptNumber: integer("attempt_number").default(1),
  
  // Timing
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  failedAt: timestamp("failed_at"),
  
  // Error tracking
  errorCode: varchar("error_code", { length: 100 }),
  errorMessage: text("error_message"),
  
  // Provider tracking (for email, SMS services)
  providerId: varchar("provider_id", { length: 100 }),
  externalId: varchar("external_id", { length: 255 }), // Provider's tracking ID
  
  // Engagement tracking
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  engagementData: jsonb("engagement_data").default({}),
  
  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("notification_delivery_log_tenant_notification_idx").on(table.tenantId, table.notificationId),
  index("notification_delivery_log_tenant_status_idx").on(table.tenantId, table.status),
  index("notification_delivery_log_tenant_channel_idx").on(table.tenantId, table.channel),
  index("notification_delivery_log_tenant_sent_idx").on(table.tenantId, table.sentAt),
  index("notification_delivery_log_external_id_idx").on(table.externalId), // For webhook callbacks
]);

// Alert rules for automated notification generation
export const alertRules = pgTable("alert_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Rule identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  
  // Rule conditions
  triggerConditions: jsonb("trigger_conditions").notNull(), // What triggers this rule
  dataQuery: jsonb("data_query").default({}), // Database query conditions
  
  // Action configuration
  notificationTemplateId: uuid("notification_template_id"),
  overrideChannels: text("override_channels").array(), // Override template channels
  overrideSeverity: varchar("override_severity", { length: 20 }),
  
  // Frequency control
  frequencyLimit: jsonb("frequency_limit").default({}), // Rate limiting
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  
  // Scheduling
  activeHours: jsonb("active_hours").default({}), // When rule is active
  timezone: varchar("timezone", { length: 50 }).default('America/Sao_Paulo'),
  
  // Business rules
  escalationRules: jsonb("escalation_rules").default({}),
  suppressionRules: jsonb("suppression_rules").default({}), // When to suppress notifications
  
  // System fields
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Rule execution priority
  version: integer("version").default(1),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("alert_rules_tenant_name").on(table.tenantId, table.name),
  index("alert_rules_tenant_category_idx").on(table.tenantId, table.category),
  index("alert_rules_tenant_active_idx").on(table.tenantId, table.isActive),
  index("alert_rules_tenant_priority_idx").on(table.tenantId, table.priority),
]);

// Notification channels configuration
export const notificationChannels = pgTable("notification_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Channel identification
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // email, sms, webhook, etc.
  description: text("description"),
  
  // Configuration
  config: jsonb("config").default({}), // Channel-specific configuration
  credentials: jsonb("credentials").default({}), // API keys, tokens, etc. (encrypted)
  
  // Health monitoring
  isHealthy: boolean("is_healthy").default(true),
  lastHealthCheck: timestamp("last_health_check"),
  healthCheckInterval: integer("health_check_interval").default(300), // 5 minutes
  
  // Usage statistics
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalFailed: integer("total_failed").default(0),
  lastUsed: timestamp("last_used"),
  
  // Rate limiting
  rateLimits: jsonb("rate_limits").default({}),
  
  // System fields
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Channel priority for failover
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("notification_channels_tenant_name").on(table.tenantId, table.name),
  index("notification_channels_tenant_type_idx").on(table.tenantId, table.type),
  index("notification_channels_tenant_active_idx").on(table.tenantId, table.isActive),
  index("notification_channels_tenant_healthy_idx").on(table.tenantId, table.isHealthy),
]);

// Zod schemas for validation
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

export const insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  triggerCount: true,
  lastTriggered: true,
});

export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSent: true,
  totalDelivered: true,
  totalFailed: true,
  lastUsed: true,
  lastHealthCheck: true,
});

// TypeScript types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;

export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = z.infer<typeof insertUserNotificationPreferencesSchema>;

export type NotificationDeliveryLog = typeof notificationDeliveryLog.$inferSelect;

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;

export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;

// Export type enums
export type NotificationType = z.infer<typeof notificationTypeEnum>;
export type NotificationSeverity = z.infer<typeof notificationSeverityEnum>;
export type NotificationStatus = z.infer<typeof notificationStatusEnum>;
export type NotificationChannelType = z.infer<typeof notificationChannelEnum>;