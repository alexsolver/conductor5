import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  unique,
  time,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./schema-master";

// ========================================
// REPORTS MODULE SCHEMA - TENANT ISOLATED
// ========================================

// Enums for Reports Module
export const reportTypeEnum = pgEnum("report_type", [
  "standard", 
  "custom", 
  "dashboard", 
  "scheduled", 
  "real_time"
]);

export const reportStatusEnum = pgEnum("report_status", [
  "draft", 
  "active", 
  "archived", 
  "error", 
  "processing", 
  "completed"
]);

export const scheduleTypeEnum = pgEnum("schedule_type", [
  "cron", 
  "event_driven", 
  "threshold", 
  "manual", 
  "real_time"
]);

export const shareAccessLevelEnum = pgEnum("share_access_level", [
  "view_only", 
  "edit", 
  "admin", 
  "public", 
  "restricted"
]);

export const triggerActionEnum = pgEnum("trigger_action", [
  "email", 
  "notification", 
  "webhook", 
  "escalation", 
  "auto_action"
]);

export const dashboardLayoutTypeEnum = pgEnum("dashboard_layout_type", [
  "grid", 
  "flex", 
  "custom", 
  "responsive", 
  "mobile_first"
]);

export const widgetTypeEnum = pgEnum("widget_type", [
  "chart", 
  "table", 
  "metric", 
  "gauge", 
  "text", 
  "image", 
  "map", 
  "custom"
]);

// ========================================
// MAIN REPORTS TABLE
// ========================================
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Basic Report Information
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: reportTypeEnum("type").default("standard").notNull(),
  status: reportStatusEnum("status").default("draft").notNull(),
  category: varchar("category", { length: 100 }), // 'financial', 'operational', 'hr', etc.
  
  // Report Configuration
  dataSource: varchar("data_source", { length: 100 }).notNull(), // module name or custom
  query: text("query"), // SQL query or query builder config
  queryConfig: jsonb("query_config").default({}), // Visual query builder configuration
  filters: jsonb("filters").default({}), // Default filters
  parameters: jsonb("parameters").default({}), // Report parameters
  
  // Visualization & Layout
  layoutConfig: jsonb("layout_config").default({}), // Layout configuration
  chartConfig: jsonb("chart_config").default({}), // Chart/visualization settings
  formatConfig: jsonb("format_config").default({}), // Formatting rules
  
  // Access & Security
  ownerId: uuid("owner_id").notNull(), // references users.id
  isPublic: boolean("is_public").default(false),
  accessLevel: shareAccessLevelEnum("access_level").default("view_only"),
  allowedRoles: text("allowed_roles").array().default([]), // Array of role names
  allowedUsers: text("allowed_users").array().default([]), // Array of user IDs
  
  // Execution & Performance
  lastExecutedAt: timestamp("last_executed_at"),
  executionCount: integer("execution_count").default(0),
  averageExecutionTime: integer("average_execution_time").default(0), // milliseconds
  cacheConfig: jsonb("cache_config").default({}),
  cacheExpiry: integer("cache_expiry").default(300), // seconds
  
  // Export & Delivery
  exportFormats: text("export_formats").array().default(["pdf", "excel", "csv"]),
  emailConfig: jsonb("email_config").default({}),
  deliveryConfig: jsonb("delivery_config").default({}),
  
  // Audit & Metadata
  tags: text("tags").array().default([]),
  metadata: jsonb("metadata").default({}),
  version: integer("version").default(1),
  isTemplate: boolean("is_template").default(false),
  templateId: uuid("template_id"), // Reference to template if created from one
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // references users.id
  updatedBy: uuid("updated_by"), // references users.id
}, (table) => [
  // TENANT-FIRST INDEXES for optimal performance
  index("reports_tenant_idx").on(table.tenantId),
  index("reports_tenant_owner_idx").on(table.tenantId, table.ownerId),
  index("reports_tenant_status_idx").on(table.tenantId, table.status),
  index("reports_tenant_type_idx").on(table.tenantId, table.type),
  index("reports_tenant_category_idx").on(table.tenantId, table.category),
  index("reports_tenant_public_idx").on(table.tenantId, table.isPublic),
  index("reports_tenant_template_idx").on(table.tenantId, table.isTemplate),
  unique("reports_tenant_name_unique").on(table.tenantId, table.name),
]);

// ========================================
// DASHBOARDS TABLE
// ========================================
export const dashboards = pgTable("dashboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Basic Dashboard Information
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  layoutType: dashboardLayoutTypeEnum("layout_type").default("grid"),
  status: reportStatusEnum("status").default("draft").notNull(),
  
  // Layout & Design Configuration
  layoutConfig: jsonb("layout_config").default({}), // Grid layout, responsive breakpoints
  themeConfig: jsonb("theme_config").default({}), // Colors, fonts, styling
  styleConfig: jsonb("style_config").default({}), // Custom CSS/styling
  
  // Access & Sharing
  ownerId: uuid("owner_id").notNull(), // references users.id
  isPublic: boolean("is_public").default(false),
  shareToken: varchar("share_token", { length: 255 }).unique(), // For public sharing
  shareExpiresAt: timestamp("share_expires_at"),
  accessLevel: shareAccessLevelEnum("access_level").default("view_only"),
  allowedRoles: text("allowed_roles").array().default([]),
  allowedUsers: text("allowed_users").array().default([]),
  
  // Real-time & Refresh Settings
  isRealTime: boolean("is_real_time").default(false),
  refreshInterval: integer("refresh_interval").default(300), // seconds
  autoRefresh: boolean("auto_refresh").default(true),
  
  // Mobile & Responsive
  mobileConfig: jsonb("mobile_config").default({}),
  tabletConfig: jsonb("tablet_config").default({}),
  desktopConfig: jsonb("desktop_config").default({}),
  
  // Favorites & Usage
  isFavorite: boolean("is_favorite").default(false),
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  
  // Audit & Metadata
  tags: text("tags").array().default([]),
  metadata: jsonb("metadata").default({}),
  version: integer("version").default(1),
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // references users.id
  updatedBy: uuid("updated_by"), // references users.id
}, (table) => [
  // TENANT-FIRST INDEXES
  index("dashboards_tenant_idx").on(table.tenantId),
  index("dashboards_tenant_owner_idx").on(table.tenantId, table.ownerId),
  index("dashboards_tenant_status_idx").on(table.tenantId, table.status),
  index("dashboards_tenant_public_idx").on(table.tenantId, table.isPublic),
  index("dashboards_share_token_idx").on(table.shareToken),
  unique("dashboards_tenant_name_unique").on(table.tenantId, table.name),
]);

// ========================================
// DASHBOARD WIDGETS TABLE
// ========================================
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  dashboardId: uuid("dashboard_id").notNull().references(() => dashboards.id, { onDelete: "cascade" }),
  
  // Widget Information
  name: varchar("name", { length: 255 }).notNull(),
  type: widgetTypeEnum("type").notNull(),
  reportId: uuid("report_id").references(() => reports.id), // Optional: link to report
  
  // Position & Layout
  position: jsonb("position").notNull(), // { x, y, width, height }
  gridPosition: jsonb("grid_position").default({}), // Grid-specific positioning
  zIndex: integer("z_index").default(1),
  
  // Widget Configuration
  config: jsonb("config").default({}), // Widget-specific configuration
  dataConfig: jsonb("data_config").default({}), // Data source and query configuration
  styleConfig: jsonb("style_config").default({}), // Styling and appearance
  interactionConfig: jsonb("interaction_config").default({}), // User interaction settings
  
  // Data & Performance
  query: text("query"), // Custom query for widget
  cacheConfig: jsonb("cache_config").default({}),
  refreshInterval: integer("refresh_interval").default(300),
  isRealTime: boolean("is_real_time").default(false),
  
  // Responsive Settings
  mobileConfig: jsonb("mobile_config").default({}),
  tabletConfig: jsonb("tablet_config").default({}),
  
  // State & Visibility
  isVisible: boolean("is_visible").default(true),
  isInteractive: boolean("is_interactive").default(true),
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // TENANT-FIRST INDEXES
  index("dashboard_widgets_tenant_idx").on(table.tenantId),
  index("dashboard_widgets_tenant_dashboard_idx").on(table.tenantId, table.dashboardId),
  index("dashboard_widgets_tenant_type_idx").on(table.tenantId, table.type),
  index("dashboard_widgets_tenant_report_idx").on(table.tenantId, table.reportId),
]);

// ========================================
// REPORT SCHEDULES TABLE
// ========================================
export const reportSchedules = pgTable("report_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  
  // Schedule Configuration
  name: varchar("name", { length: 255 }).notNull(),
  type: scheduleTypeEnum("type").default("cron").notNull(),
  cronExpression: varchar("cron_expression", { length: 100 }), // For cron schedules
  scheduleConfig: jsonb("schedule_config").default({}), // Advanced scheduling options
  
  // Execution Settings
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  isActive: boolean("is_active").default(true),
  offPeakOnly: boolean("off_peak_only").default(false),
  resourcePriority: integer("resource_priority").default(5), // 1-10 scale
  maxExecutionTime: integer("max_execution_time").default(3600), // seconds
  retryAttempts: integer("retry_attempts").default(3),
  retryDelay: integer("retry_delay").default(300), // seconds
  
  // Trigger Conditions (for event-driven schedules)
  triggerConditions: jsonb("trigger_conditions").default({}),
  thresholdConfig: jsonb("threshold_config").default({}),
  
  // Delivery & Output
  outputFormats: text("output_formats").array().default(["pdf"]),
  deliveryMethods: text("delivery_methods").array().default(["email"]),
  recipients: jsonb("recipients").default({}), // Email addresses, webhook URLs, etc.
  
  // Execution History
  lastExecutedAt: timestamp("last_executed_at"),
  nextExecutionAt: timestamp("next_execution_at"),
  executionCount: integer("execution_count").default(0),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  lastError: text("last_error"),
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // references users.id
}, (table) => [
  // TENANT-FIRST INDEXES
  index("report_schedules_tenant_idx").on(table.tenantId),
  index("report_schedules_tenant_report_idx").on(table.tenantId, table.reportId),
  index("report_schedules_tenant_active_idx").on(table.tenantId, table.isActive),
  index("report_schedules_next_execution_idx").on(table.nextExecutionAt),
  index("report_schedules_tenant_type_idx").on(table.tenantId, table.type),
]);

// ========================================
// REPORT EXECUTIONS TABLE
// ========================================
export const reportExecutions = pgTable("report_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  reportId: uuid("report_id").notNull().references(() => reports.id),
  scheduleId: uuid("schedule_id").references(() => reportSchedules.id),
  
  // Execution Information
  status: varchar("status", { length: 20 }).default("pending"), // pending, running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  executionTime: integer("execution_time"), // milliseconds
  
  // Execution Context
  executedBy: uuid("executed_by"), // references users.id (null for scheduled executions)
  executionType: varchar("execution_type", { length: 20 }).default("manual"), // manual, scheduled, triggered
  parameters: jsonb("parameters").default({}), // Runtime parameters
  filters: jsonb("filters").default({}), // Applied filters
  
  // Results & Output
  resultCount: integer("result_count").default(0),
  resultSize: bigint("result_size", { mode: "number" }).default(0), // bytes
  outputFiles: jsonb("output_files").default([]), // Generated file information
  
  // Performance & Error Handling
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details").default({}),
  warningCount: integer("warning_count").default(0),
  warnings: jsonb("warnings").default([]),
  
  // Resource Usage
  memoryUsed: integer("memory_used"), // MB
  cpuTime: integer("cpu_time"), // milliseconds
  dbQueries: integer("db_queries").default(0),
  cacheHits: integer("cache_hits").default(0),
  cacheMisses: integer("cache_misses").default(0),
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // TENANT-FIRST INDEXES
  index("report_executions_tenant_idx").on(table.tenantId),
  index("report_executions_tenant_report_idx").on(table.tenantId, table.reportId),
  index("report_executions_tenant_status_idx").on(table.tenantId, table.status),
  index("report_executions_tenant_date_idx").on(table.tenantId, table.startedAt),
  index("report_executions_schedule_idx").on(table.scheduleId),
]);

// ========================================
// REPORT TEMPLATES TABLE
// ========================================
export const reportTemplates = pgTable("report_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Template Information
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // Module or functional category
  moduleType: varchar("module_type", { length: 50 }), // tickets, customers, materials, etc.
  
  // Template Configuration
  templateConfig: jsonb("template_config").notNull(), // Complete report configuration
  defaultParameters: jsonb("default_parameters").default({}),
  requiredFields: text("required_fields").array().default([]),
  optionalFields: text("optional_fields").array().default([]),
  
  // Customization & Branding
  brandingConfig: jsonb("branding_config").default({}), // Logo, colors, fonts
  layoutOptions: jsonb("layout_options").default({}), // Available layout variations
  styleOptions: jsonb("style_options").default({}), // Available styling options
  
  // Usage & Popularity
  usageCount: integer("usage_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  
  // Access & Sharing
  isPublic: boolean("is_public").default(false),
  isSystem: boolean("is_system").default(false), // System-provided templates
  allowedRoles: text("allowed_roles").array().default([]),
  
  // Versioning
  version: varchar("version", { length: 20 }).default("1.0.0"),
  parentTemplateId: uuid("parent_template_id"), // For template inheritance
  isLatestVersion: boolean("is_latest_version").default(true),
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // references users.id
}, (table) => [
  // TENANT-FIRST INDEXES
  index("report_templates_tenant_idx").on(table.tenantId),
  index("report_templates_tenant_category_idx").on(table.tenantId, table.category),
  index("report_templates_tenant_module_idx").on(table.tenantId, table.moduleType),
  index("report_templates_tenant_public_idx").on(table.tenantId, table.isPublic),
  index("report_templates_tenant_system_idx").on(table.tenantId, table.isSystem),
  unique("report_templates_tenant_name_unique").on(table.tenantId, table.name),
]);

// ========================================
// REPORT SHARES TABLE
// ========================================
export const reportShares = pgTable("report_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  reportId: uuid("report_id").references(() => reports.id),
  dashboardId: uuid("dashboard_id").references(() => dashboards.id),
  
  // Share Configuration
  shareToken: varchar("share_token", { length: 255 }).notNull().unique(),
  shareType: varchar("share_type", { length: 20 }).notNull(), // public, private, internal
  accessLevel: shareAccessLevelEnum("access_level").default("view_only"),
  
  // Access Control
  requiresLogin: boolean("requires_login").default(false),
  allowedUsers: text("allowed_users").array().default([]), // Specific user IDs
  allowedRoles: text("allowed_roles").array().default([]), // Specific roles
  allowedDomains: text("allowed_domains").array().default([]), // Email domains
  password: varchar("password", { length: 255 }), // Optional password protection
  
  // Expiration & Limits
  expiresAt: timestamp("expires_at"),
  maxViews: integer("max_views"),
  currentViews: integer("current_views").default(0),
  maxDownloads: integer("max_downloads"),
  currentDownloads: integer("current_downloads").default(0),
  
  // Permissions
  canDownload: boolean("can_download").default(true),
  canPrint: boolean("can_print").default(true),
  canShare: boolean("can_share").default(false),
  canComment: boolean("can_comment").default(false),
  
  // Analytics
  viewCount: integer("view_count").default(0),
  downloadCount: integer("download_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  accessLog: jsonb("access_log").default([]), // Track access attempts
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // references users.id
}, (table) => [
  // TENANT-FIRST INDEXES
  index("report_shares_tenant_idx").on(table.tenantId),
  index("report_shares_token_idx").on(table.shareToken),
  index("report_shares_tenant_report_idx").on(table.tenantId, table.reportId),
  index("report_shares_tenant_dashboard_idx").on(table.tenantId, table.dashboardId),
  index("report_shares_expires_idx").on(table.expiresAt),
]);

// ========================================
// REPORT NOTIFICATIONS & TRIGGERS TABLE
// ========================================
export const reportNotifications = pgTable("report_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  
  // Notification Configuration
  name: varchar("name", { length: 255 }).notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // result_threshold, execution_status, schedule, data_change
  triggerConditions: jsonb("trigger_conditions").notNull(), // Specific trigger conditions
  
  // Notification Settings
  notificationChannels: text("notification_channels").array().notNull(), // email, sms, webhook, slack, teams
  recipients: jsonb("recipients").notNull(), // Channel-specific recipients
  messageTemplate: text("message_template"),
  subjectTemplate: varchar("subject_template", { length: 255 }),
  
  // Action Configuration
  actions: jsonb("actions").default([]), // Automated actions to take
  escalationRules: jsonb("escalation_rules").default({}), // Escalation configuration
  
  // Status & Control
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(5), // 1-10 scale
  cooldownPeriod: integer("cooldown_period").default(3600), // seconds between notifications
  
  // Execution History
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").default(0),
  lastNotificationSent: timestamp("last_notification_sent"),
  notificationCount: integer("notification_count").default(0),
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // references users.id
}, (table) => [
  // TENANT-FIRST INDEXES
  index("report_notifications_tenant_idx").on(table.tenantId),
  index("report_notifications_tenant_report_idx").on(table.tenantId, table.reportId),
  index("report_notifications_tenant_active_idx").on(table.tenantId, table.isActive),
  index("report_notifications_trigger_type_idx").on(table.triggerType),
]);

// ========================================
// DATA SOURCE CONFIGURATIONS TABLE
// ========================================
export const dataSourceConfigurations = pgTable("data_source_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Data Source Information
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // module, external_api, database, file
  moduleType: varchar("module_type", { length: 50 }), // For module-based sources
  
  // Connection Configuration
  connectionConfig: jsonb("connection_config").notNull(), // Connection parameters
  authConfig: jsonb("auth_config").default({}), // Authentication configuration
  refreshConfig: jsonb("refresh_config").default({}), // Data refresh settings
  
  // Schema & Mapping
  schemaConfig: jsonb("schema_config").default({}), // Data structure mapping
  fieldMappings: jsonb("field_mappings").default({}), // Field name mappings
  transformations: jsonb("transformations").default([]), // Data transformation rules
  
  // Performance & Caching
  cacheConfig: jsonb("cache_config").default({}),
  cacheTtl: integer("cache_ttl").default(3600), // Cache TTL in seconds
  maxRecords: integer("max_records").default(10000), // Max records per query
  timeoutSeconds: integer("timeout_seconds").default(30),
  
  // Access & Security
  isActive: boolean("is_active").default(true),
  allowedUsers: text("allowed_users").array().default([]),
  allowedRoles: text("allowed_roles").array().default([]),
  encryptionConfig: jsonb("encryption_config").default({}),
  
  // Health & Monitoring
  lastCheckedAt: timestamp("last_checked_at"),
  isHealthy: boolean("is_healthy").default(true),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  
  // System Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // references users.id
}, (table) => [
  // TENANT-FIRST INDEXES
  index("data_source_configurations_tenant_idx").on(table.tenantId),
  index("data_source_configurations_tenant_type_idx").on(table.tenantId, table.type),
  index("data_source_configurations_tenant_module_idx").on(table.tenantId, table.moduleType),
  index("data_source_configurations_tenant_active_idx").on(table.tenantId, table.isActive),
  unique("data_source_configurations_tenant_name_unique").on(table.tenantId, table.name),
]);

// ========================================
// ZSHEMA VALIDATION SCHEMAS
// ========================================

// Insert schemas for validation
export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardSchema = createInsertSchema(dashboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportScheduleSchema = createInsertSchema(reportSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportShareSchema = createInsertSchema(reportShares).omit({
  id: true,
  createdAt: true,
});

export const insertReportNotificationSchema = createInsertSchema(reportNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataSourceConfigurationSchema = createInsertSchema(dataSourceConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========================================
// TYPE EXPORTS
// ========================================

// Insert types
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type InsertReportSchedule = z.infer<typeof insertReportScheduleSchema>;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type InsertReportShare = z.infer<typeof insertReportShareSchema>;
export type InsertReportNotification = z.infer<typeof insertReportNotificationSchema>;
export type InsertDataSourceConfiguration = z.infer<typeof insertDataSourceConfigurationSchema>;

// Select types
export type Report = typeof reports.$inferSelect;
export type Dashboard = typeof dashboards.$inferSelect;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type ReportExecution = typeof reportExecutions.$inferSelect;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type ReportShare = typeof reportShares.$inferSelect;
export type ReportNotification = typeof reportNotifications.$inferSelect;
export type DataSourceConfiguration = typeof dataSourceConfigurations.$inferSelect;