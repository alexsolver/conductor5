// ✅ 1QA.MD COMPLIANCE: ACTIVITY PLANNER MODULE SCHEMA
// Complete activity planner system schema following Clean Architecture patterns

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
  date,
  time,
  interval,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions for Activity Planner
export const activityTypeEnum = pgEnum('activity_type', [
  'maintenance_preventive',
  'maintenance_corrective', 
  'inspection',
  'calibration',
  'cleaning',
  'audit',
  'training',
  'other'
]);

export const activityStatusEnum = pgEnum('activity_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
  'overdue'
]);

export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'critical',
  'emergency'
]);

export const frequencyEnum = pgEnum('frequency', [
  'once',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'biennial',
  'custom'
]);

export const workflowStatusEnum = pgEnum('workflow_status', [
  'pending',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'escalated'
]);

// Activity Categories
export const activityCategories = pgTable("activity_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("is_active").default(true),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by")
}, (table) => ({
  tenantIdx: index("activity_categories_tenant_idx").on(table.tenantId),
  parentIdx: index("activity_categories_parent_idx").on(table.parentId),
  nameIdx: index("activity_categories_name_idx").on(table.name),
  uniqueTenantName: unique("activity_categories_tenant_name_unique").on(table.tenantId, table.name)
}));

// Activity Templates
export const activityTemplates = pgTable("activity_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => activityCategories.id),
  activityType: activityTypeEnum("activity_type").notNull(),
  estimatedDuration: interval("estimated_duration"), // Duration in minutes
  requiredSkills: jsonb("required_skills").$type<string[]>().default([]),
  requiredTools: jsonb("required_tools").$type<string[]>().default([]),
  requiredMaterials: jsonb("required_materials").$type<any[]>().default([]),
  safetyRequirements: jsonb("safety_requirements").$type<string[]>().default([]),
  instructions: text("instructions"),
  checklistItems: jsonb("checklist_items").$type<any[]>().default([]),
  defaultPriority: priorityEnum("default_priority").default('medium'),
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by")
}, (table) => ({
  tenantIdx: index("activity_templates_tenant_idx").on(table.tenantId),
  categoryIdx: index("activity_templates_category_idx").on(table.categoryId),
  typeIdx: index("activity_templates_type_idx").on(table.activityType),
  activeIdx: index("activity_templates_active_idx").on(table.isActive)
}));

// Activity Schedules
export const activitySchedules = pgTable("activity_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  templateId: uuid("template_id").references(() => activityTemplates.id),
  assetId: uuid("asset_id"), // Reference to assets/equipment
  locationId: uuid("location_id"), // Reference to locations
  frequency: frequencyEnum("frequency").notNull(),
  customInterval: interval("custom_interval"), // For custom frequency
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  preferredTime: time("preferred_time"),
  timezone: varchar("timezone", { length: 50 }).default('UTC'),
  assignedTeamId: uuid("assigned_team_id"),
  assignedUserId: uuid("assigned_user_id"),
  estimatedDuration: interval("estimated_duration"),
  priority: priorityEnum("priority").default('medium'),
  isActive: boolean("is_active").default(true),
  nextDueDate: timestamp("next_due_date"),
  lastExecutedDate: timestamp("last_executed_date"),
  executionCount: integer("execution_count").default(0),
  alertBeforeDays: integer("alert_before_days").default(1),
  escalationAfterDays: integer("escalation_after_days").default(0),
  autoAssign: boolean("auto_assign").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by")
}, (table) => ({
  tenantIdx: index("activity_schedules_tenant_idx").on(table.tenantId),
  templateIdx: index("activity_schedules_template_idx").on(table.templateId),
  assetIdx: index("activity_schedules_asset_idx").on(table.assetId),
  locationIdx: index("activity_schedules_location_idx").on(table.locationId),
  nextDueDateIdx: index("activity_schedules_next_due_date_idx").on(table.nextDueDate),
  assignedUserIdx: index("activity_schedules_assigned_user_idx").on(table.assignedUserId),
  assignedTeamIdx: index("activity_schedules_assigned_team_idx").on(table.assignedTeamId),
  activeIdx: index("activity_schedules_active_idx").on(table.isActive),
  frequencyIdx: index("activity_schedules_frequency_idx").on(table.frequency)
}));

// Activity Instances (Generated from schedules)
export const activityInstances = pgTable("activity_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  scheduleId: uuid("schedule_id").references(() => activitySchedules.id),
  templateId: uuid("template_id").references(() => activityTemplates.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  activityType: activityTypeEnum("activity_type").notNull(),
  status: activityStatusEnum("status").default('scheduled'),
  priority: priorityEnum("priority").default('medium'),
  scheduledDate: timestamp("scheduled_date").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  estimatedDuration: interval("estimated_duration"),
  actualDuration: interval("actual_duration"),
  assignedUserId: uuid("assigned_user_id"),
  assignedTeamId: uuid("assigned_team_id"),
  completedBy: uuid("completed_by"),
  assetId: uuid("asset_id"),
  locationId: uuid("location_id"),
  parentInstanceId: uuid("parent_instance_id"), // For dependent activities
  workOrderNumber: varchar("work_order_number", { length: 50 }),
  isOverdue: boolean("is_overdue").default(false),
  overdueBy: interval("overdue_by"),
  checklistData: jsonb("checklist_data"),
  attachments: jsonb("attachments").$type<any[]>().default([]),
  comments: text("comments"),
  completionNotes: text("completion_notes"),
  qualityScore: integer("quality_score"), // 1-5 rating
  customerFeedback: text("customer_feedback"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by")
}, (table) => ({
  tenantIdx: index("activity_instances_tenant_idx").on(table.tenantId),
  scheduleIdx: index("activity_instances_schedule_idx").on(table.scheduleId),
  templateIdx: index("activity_instances_template_idx").on(table.templateId),
  statusIdx: index("activity_instances_status_idx").on(table.status),
  scheduledDateIdx: index("activity_instances_scheduled_date_idx").on(table.scheduledDate),
  dueDateIdx: index("activity_instances_due_date_idx").on(table.dueDate),
  assignedUserIdx: index("activity_instances_assigned_user_idx").on(table.assignedUserId),
  assignedTeamIdx: index("activity_instances_assigned_team_idx").on(table.assignedTeamId),
  assetIdx: index("activity_instances_asset_idx").on(table.assetId),
  locationIdx: index("activity_instances_location_idx").on(table.locationId),
  workOrderIdx: index("activity_instances_work_order_idx").on(table.workOrderNumber),
  overdueIdx: index("activity_instances_overdue_idx").on(table.isOverdue),
  parentIdx: index("activity_instances_parent_idx").on(table.parentInstanceId),
  uniqueWorkOrder: unique("activity_instances_work_order_unique").on(table.tenantId, table.workOrderNumber)
}));

// Activity Workflows
export const activityWorkflows = pgTable("activity_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  instanceId: uuid("instance_id").references(() => activityInstances.id),
  workflowType: varchar("workflow_type", { length: 50 }).notNull(), // approval, escalation, notification
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").notNull(),
  status: workflowStatusEnum("status").default('pending'),
  workflowData: jsonb("workflow_data"),
  approvers: jsonb("approvers").$type<any[]>().default([]),
  currentApprover: uuid("current_approver"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  deadline: timestamp("deadline"),
  escalationLevel: integer("escalation_level").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull()
}, (table) => ({
  tenantIdx: index("activity_workflows_tenant_idx").on(table.tenantId),
  instanceIdx: index("activity_workflows_instance_idx").on(table.instanceId),
  statusIdx: index("activity_workflows_status_idx").on(table.status),
  approverIdx: index("activity_workflows_approver_idx").on(table.currentApprover),
  deadlineIdx: index("activity_workflows_deadline_idx").on(table.deadline),
  typeIdx: index("activity_workflows_type_idx").on(table.workflowType)
}));

// Activity Resources (Materials, Tools, Personnel)
export const activityResources = pgTable("activity_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  instanceId: uuid("instance_id").references(() => activityInstances.id),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // material, tool, personnel
  resourceId: uuid("resource_id").notNull(), // Reference to materials/tools/users
  resourceName: varchar("resource_name", { length: 200 }).notNull(),
  quantityRequired: real("quantity_required"),
  quantityUsed: real("quantity_used"),
  unit: varchar("unit", { length: 20 }),
  cost: real("cost"),
  isAvailable: boolean("is_available").default(true),
  reservedAt: timestamp("reserved_at"),
  reservedBy: uuid("reserved_by"),
  allocatedAt: timestamp("allocated_at"),
  releasedAt: timestamp("released_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  tenantIdx: index("activity_resources_tenant_idx").on(table.tenantId),
  instanceIdx: index("activity_resources_instance_idx").on(table.instanceId),
  typeIdx: index("activity_resources_type_idx").on(table.resourceType),
  resourceIdx: index("activity_resources_resource_idx").on(table.resourceId),
  availabilityIdx: index("activity_resources_availability_idx").on(table.isAvailable)
}));

// Activity History & Audit
export const activityHistory = pgTable("activity_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  instanceId: uuid("instance_id").references(() => activityInstances.id),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  performedBy: uuid("performed_by").notNull(),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata")
}, (table) => ({
  tenantIdx: index("activity_history_tenant_idx").on(table.tenantId),
  instanceIdx: index("activity_history_instance_idx").on(table.instanceId),
  performedByIdx: index("activity_history_performed_by_idx").on(table.performedBy),
  performedAtIdx: index("activity_history_performed_at_idx").on(table.performedAt),
  actionIdx: index("activity_history_action_idx").on(table.action)
}));

// Zod Schemas
export const insertActivityCategorySchema = createInsertSchema(activityCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertActivityTemplateSchema = createInsertSchema(activityTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertActivityScheduleSchema = createInsertSchema(activitySchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertActivityInstanceSchema = createInsertSchema(activityInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertActivityWorkflowSchema = createInsertSchema(activityWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertActivityResourceSchema = createInsertSchema(activityResources).omit({
  id: true,
  createdAt: true
});

export const insertActivityHistorySchema = createInsertSchema(activityHistory).omit({
  id: true,
  performedAt: true
});

// TypeScript Types
export type ActivityCategory = typeof activityCategories.$inferSelect;
export type InsertActivityCategory = z.infer<typeof insertActivityCategorySchema>;

export type ActivityTemplate = typeof activityTemplates.$inferSelect;
export type InsertActivityTemplate = z.infer<typeof insertActivityTemplateSchema>;

export type ActivitySchedule = typeof activitySchedules.$inferSelect;
export type InsertActivitySchedule = z.infer<typeof insertActivityScheduleSchema>;

export type ActivityInstance = typeof activityInstances.$inferSelect;
export type InsertActivityInstance = z.infer<typeof insertActivityInstanceSchema>;

export type ActivityWorkflow = typeof activityWorkflows.$inferSelect;
export type InsertActivityWorkflow = z.infer<typeof insertActivityWorkflowSchema>;

export type ActivityResource = typeof activityResources.$inferSelect;
export type InsertActivityResource = z.infer<typeof insertActivityResourceSchema>;

export type ActivityHistory = typeof activityHistory.$inferSelect;
export type InsertActivityHistory = z.infer<typeof insertActivityHistorySchema>;

// Export Enums for use in other files - using z.enum for proper Zod types
export const ActivityTypeZod = z.enum(['maintenance_preventive', 'maintenance_corrective', 'inspection', 'calibration', 'cleaning', 'audit', 'training', 'other']);
export const ActivityStatusZod = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed', 'overdue']);
export const PriorityZod = z.enum(['low', 'medium', 'high', 'critical', 'emergency']);
export const FrequencyZod = z.enum(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'biennial', 'custom']);
export const WorkflowStatusZod = z.enum(['pending', 'approved', 'rejected', 'in_progress', 'completed', 'escalated']);

export type ActivityType = z.infer<typeof ActivityTypeZod>;
export type ActivityStatus = z.infer<typeof ActivityStatusZod>;
export type Priority = z.infer<typeof PriorityZod>;
export type Frequency = z.infer<typeof FrequencyZod>;
export type WorkflowStatus = z.infer<typeof WorkflowStatusZod>;