// ✅ 1QA.MD COMPLIANCE: SLA MODULE SCHEMA
// Complete SLA system schema following Clean Architecture patterns

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
  real,
  time
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions for SLA types
export const slaTypeEnum = z.enum([
  'SLA',      // Service Level Agreement (client-facing)
  'OLA',      // Operational Level Agreement (internal)
  'UC'        // Underpinning Contract (supplier)
]);

export const slaStatusEnum = z.enum([
  'active',
  'inactive',
  'expired',
  'draft'
]);

export const slaPriorityEnum = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

export const slaConditionTypeEnum = z.enum([
  'ticket_created',
  'ticket_assigned',
  'status_change',
  'priority_change',
  'category_change',
  'customer_response',
  'agent_response'
]);

export const slaActionTypeEnum = z.enum([
  'start',
  'pause',
  'resume',
  'stop',
  'escalate',
  'notify'
]);

// Query Builder Enums for SLA Rules
export const queryOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'is_empty',
  'is_not_empty',
  'in',
  'not_in'
]);

export const logicalOperatorEnum = z.enum([
  'AND',
  'OR'
]);

export const ticketFieldEnum = z.enum([
  'status',
  'priority',
  'impact',
  'urgency',
  'category',
  'subcategory',
  'companyId',
  'callerId',
  'responsibleId',
  'assignmentGroupId',
  'environment',
  'tags',
  'callerType',
  'contactType',
  'symptoms',
  'businessImpact',
  'templateName',
  'serviceVersion',
  'createdAt',
  'updatedAt'
]);

export const slaMetricTypeEnum = z.enum([
  'response_time',     // Time to first response
  'resolution_time',   // Time to resolution
  'update_time',       // Time between updates
  'idle_time'          // Time without interaction
]);

// Main SLA definitions table
export const slaDefinitions = pgTable("sla_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Basic SLA information
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(), // SLA, OLA, UC
  status: varchar("status", { length: 20 }).default('active'),
  priority: varchar("priority", { length: 20 }).default('medium'),

  // Validity period
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until"),

  // Application rules - Query Builder conditions
  applicationRules: jsonb("application_rules").notNull(), // Query builder rules for ticket field association

  // Target metrics
  responseTimeMinutes: integer("response_time_minutes"),
  resolutionTimeMinutes: integer("resolution_time_minutes"),
  updateTimeMinutes: integer("update_time_minutes"),
  idleTimeMinutes: integer("idle_time_minutes"),

  // Working calendar
  businessHoursOnly: boolean("business_hours_only").default(true),
  workingDays: jsonb("working_days").default([1,2,3,4,5]), // 0=Sunday, 1=Monday, etc.
  workingHours: jsonb("working_hours").default({start: "08:00", end: "18:00"}),
  timezone: varchar("timezone", { length: 100 }).default("America/Sao_Paulo"),

  // Escalation settings
  escalationEnabled: boolean("escalation_enabled").default(false),
  escalationThresholdPercent: integer("escalation_threshold_percent").default(80),
  escalationActions: jsonb("escalation_actions").default([]),

  // Pause/Resume conditions
  pauseConditions: jsonb("pause_conditions").default([]),
  resumeConditions: jsonb("resume_conditions").default([]),
  stopConditions: jsonb("stop_conditions").default([]),

  // Automation workflows
  workflowActions: jsonb("workflow_actions").default([]),

  // System fields
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sla_definitions_tenant_idx").on(table.tenantId),
  index("sla_definitions_tenant_status_idx").on(table.tenantId, table.status),
  index("sla_definitions_tenant_type_idx").on(table.tenantId, table.type),
  unique("sla_definitions_tenant_name").on(table.tenantId, table.name),
]);

// SLA workflows - automation and business logic
export const slaWorkflows = pgTable("sla_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Basic workflow information
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),

  // Workflow configuration
  triggers: jsonb("triggers").notNull(), // Array of trigger configurations
  actions: jsonb("actions").notNull(),   // Array of action configurations
  metadata: jsonb("metadata").default({}),

  // System fields
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sla_workflows_tenant_idx").on(table.tenantId),
  index("sla_workflows_tenant_active_idx").on(table.tenantId, table.isActive),
  unique("sla_workflows_tenant_name").on(table.tenantId, table.name),
]);

// SLA workflow executions - tracking workflow runs
export const slaWorkflowExecutions = pgTable("sla_workflow_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull(),
  tenantId: uuid("tenant_id").notNull(),

  // Execution details
  triggeredBy: varchar("triggered_by", { length: 255 }).notNull(),
  triggeredAt: timestamp("triggered_at").notNull(),
  status: varchar("status", { length: 20 }).default('pending'),
  context: jsonb("context").notNull(),
  executedActions: jsonb("executed_actions").default([]),

  // Result tracking
  error: text("error"),
  completedAt: timestamp("completed_at"),

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sla_workflow_executions_tenant_idx").on(table.tenantId),
  index("sla_workflow_executions_workflow_idx").on(table.workflowId),
  index("sla_workflow_executions_status_idx").on(table.tenantId, table.status),
  index("sla_workflow_executions_triggered_idx").on(table.triggeredAt),
]);

// SLA instances - tracking actual SLA performance for tickets
export const slaInstances = pgTable("sla_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Reference to SLA definition and ticket
  slaDefinitionId: uuid("sla_definition_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),

  // SLA lifecycle
  startedAt: timestamp("started_at").notNull(),
  pausedAt: timestamp("paused_at"),
  resumedAt: timestamp("resumed_at"),
  completedAt: timestamp("completed_at"),
  violatedAt: timestamp("violated_at"),

  // Current status
  status: varchar("status", { length: 20 }).notNull(), // running, paused, completed, violated
  currentMetric: varchar("current_metric", { length: 20 }).notNull(), // response_time, resolution_time, etc.

  // Time tracking
  elapsedMinutes: integer("elapsed_minutes").default(0),
  pausedMinutes: integer("paused_minutes").default(0),
  targetMinutes: integer("target_minutes").notNull(),
  remainingMinutes: integer("remaining_minutes").notNull(),

  // Performance metrics
  responseTimeMinutes: integer("response_time_minutes"),
  resolutionTimeMinutes: integer("resolution_time_minutes"),
  idleTimeMinutes: integer("idle_time_minutes").default(0),

  // Breach tracking
  isBreached: boolean("is_breached").default(false),
  breachDurationMinutes: integer("breach_duration_minutes").default(0),
  breachPercentage: real("breach_percentage").default(0),

  // Last update tracking
  lastActivityAt: timestamp("last_activity_at"),
  lastAgentActivityAt: timestamp("last_agent_activity_at"),
  lastCustomerActivityAt: timestamp("last_customer_activity_at"),

  // Escalation tracking
  escalationLevel: integer("escalation_level").default(0),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: uuid("escalated_to"),

  // Automation tracking
  automationTriggered: boolean("automation_triggered").default(false),
  automationActions: jsonb("automation_actions").default([]),

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sla_instances_tenant_idx").on(table.tenantId),
  index("sla_instances_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("sla_instances_tenant_sla_idx").on(table.tenantId, table.slaDefinitionId),
  index("sla_instances_tenant_status_idx").on(table.tenantId, table.status),
  index("sla_instances_tenant_breached_idx").on(table.tenantId, table.isBreached),
  index("sla_instances_tenant_metric_idx").on(table.tenantId, table.currentMetric),
  unique("sla_instances_ticket_metric").on(table.ticketId, table.currentMetric),
]);

// SLA events log - audit trail of all SLA state changes
export const slaEvents = pgTable("sla_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Reference to SLA instance
  slaInstanceId: uuid("sla_instance_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),

  // Event details
  eventType: varchar("event_type", { length: 50 }).notNull(), // started, paused, resumed, completed, violated, escalated
  eventReason: varchar("event_reason", { length: 100 }), // why the event happened
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),

  // Time tracking at event
  elapsedMinutesAtEvent: integer("elapsed_minutes_at_event").default(0),
  remainingMinutesAtEvent: integer("remaining_minutes_at_event").default(0),

  // Trigger information
  triggeredBy: varchar("triggered_by", { length: 50 }), // system, user, automation
  triggeredByUserId: uuid("triggered_by_user_id"),
  triggerCondition: text("trigger_condition"),

  // Event data
  eventData: jsonb("event_data").default({}),

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sla_events_tenant_idx").on(table.tenantId),
  index("sla_events_tenant_instance_idx").on(table.tenantId, table.slaInstanceId),
  index("sla_events_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("sla_events_tenant_type_idx").on(table.tenantId, table.eventType),
  index("sla_events_created_idx").on(table.createdAt),
]);

// SLA violation tracking
export const slaViolations = pgTable("sla_violations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Reference to SLA instance
  slaInstanceId: uuid("sla_instance_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  slaDefinitionId: uuid("sla_definition_id").notNull(),

  // Violation details
  violationType: varchar("violation_type", { length: 50 }).notNull(), // response_time, resolution_time, update_time, idle_time
  targetMinutes: integer("target_minutes").notNull(),
  actualMinutes: integer("actual_minutes").notNull(),
  violationMinutes: integer("violation_minutes").notNull(),
  violationPercentage: real("violation_percentage").notNull(),

  // Impact assessment
  severityLevel: varchar("severity_level", { length: 20 }).default('medium'),
  businessImpact: text("business_impact"),

  // Resolution tracking
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: uuid("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),

  resolved: boolean("resolved").default(false),
  resolvedBy: uuid("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),

  // Root cause analysis
  rootCause: text("root_cause"),
  preventiveActions: text("preventive_actions"),

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sla_violations_tenant_idx").on(table.tenantId),
  index("sla_violations_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("sla_violations_tenant_sla_idx").on(table.tenantId, table.slaDefinitionId),
  index("sla_violations_tenant_type_idx").on(table.tenantId, table.violationType),
  index("sla_violations_tenant_severity_idx").on(table.tenantId, table.severityLevel),
  index("sla_violations_created_idx").on(table.createdAt),
]);

// SLA reports and analytics cache
export const slaReports = pgTable("sla_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Report identification
  reportType: varchar("report_type", { length: 50 }).notNull(), // daily, weekly, monthly, custom
  reportPeriod: varchar("report_period", { length: 50 }).notNull(), // 2025-01, 2025-W01, 2025-01-15, etc.
  generatedAt: timestamp("generated_at").notNull(),

  // SLA performance metrics
  totalTickets: integer("total_tickets").default(0),
  slaMetTickets: integer("sla_met_tickets").default(0),
  slaViolatedTickets: integer("sla_violated_tickets").default(0),
  slaCompliancePercentage: real("sla_compliance_percentage").default(0),

  // Time metrics
  avgResponseTimeMinutes: real("avg_response_time_minutes").default(0),
  avgResolutionTimeMinutes: real("avg_resolution_time_minutes").default(0),
  avgIdleTimeMinutes: real("avg_idle_time_minutes").default(0),

  // Escalation metrics
  totalEscalations: integer("total_escalations").default(0),
  escalationRate: real("escalation_rate").default(0),

  // Detailed metrics by SLA definition
  slaMetrics: jsonb("sla_metrics").default({}),

  // Trend analysis
  trendData: jsonb("trend_data").default({}),

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sla_reports_tenant_idx").on(table.tenantId),
  index("sla_reports_tenant_type_idx").on(table.tenantId, table.reportType),
  index("sla_reports_tenant_period_idx").on(table.tenantId, table.reportPeriod),
  unique("sla_reports_tenant_type_period").on(table.tenantId, table.reportType, table.reportPeriod),
]);

// Query Builder Schemas
export const queryRuleSchema = z.object({
  field: ticketFieldEnum,
  operator: queryOperatorEnum,
  value: z.union([z.string(), z.number(), z.array(z.string())]),
  logicalOperator: logicalOperatorEnum.optional()
});

export const queryBuilderSchema = z.object({
  rules: z.array(queryRuleSchema).min(1),
  logicalOperator: logicalOperatorEnum.default('AND')
});

// Zod schemas for validation
export const insertSlaDefinitionSchema = createInsertSchema(slaDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  applicationRules: queryBuilderSchema,
  // Aceitar strings de data ISO e convertê-las automaticamente para Date
  validFrom: z.string().transform((val) => new Date(val)),
  validUntil: z.string().optional().nullable().transform((val) => val ? new Date(val) : undefined),
});

export const insertSlaInstanceSchema = createInsertSchema(slaInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSlaEventSchema = createInsertSchema(slaEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSlaViolationSchema = createInsertSchema(slaViolations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSlaReportSchema = createInsertSchema(slaReports).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type SlaDefinition = typeof slaDefinitions.$inferSelect;
export type InsertSlaDefinition = z.infer<typeof insertSlaDefinitionSchema>;

export type SlaInstance = typeof slaInstances.$inferSelect;
export type InsertSlaInstance = z.infer<typeof insertSlaInstanceSchema>;

export type SlaEvent = typeof slaEvents.$inferSelect;
export type InsertSlaEvent = z.infer<typeof insertSlaEventSchema>;

export type SlaViolation = typeof slaViolations.$inferSelect;
export type InsertSlaViolation = z.infer<typeof insertSlaViolationSchema>;

export type SlaReport = typeof slaReports.$inferSelect;
export type InsertSlaReport = z.infer<typeof insertSlaReportSchema>;

// Workflow schemas
export const insertSlaWorkflowSchema = createInsertSchema(slaWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSlaWorkflowExecutionSchema = createInsertSchema(slaWorkflowExecutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Workflow types
export type SlaWorkflow = typeof slaWorkflows.$inferSelect;
export type InsertSlaWorkflow = z.infer<typeof insertSlaWorkflowSchema>;

export type SlaWorkflowExecution = typeof slaWorkflowExecutions.$inferSelect;
export type InsertSlaWorkflowExecution = z.infer<typeof insertSlaWorkflowExecutionSchema>;

// Query Builder types
export type QueryRule = z.infer<typeof queryRuleSchema>;
export type QueryBuilder = z.infer<typeof queryBuilderSchema>;
export type QueryOperator = z.infer<typeof queryOperatorEnum>;
export type LogicalOperator = z.infer<typeof logicalOperatorEnum>;
export type TicketField = z.infer<typeof ticketFieldEnum>;