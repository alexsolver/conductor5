// ========================================
// MASTER SCHEMA - UNIFIED IMPORT ARCHITECTURE
// ========================================
// This file serves as the single entry point for all schema definitions
// All actual table definitions are now separated into specialized files

// Import Drizzle ORM essentials
import { pgTable, varchar, text, timestamp, uuid, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// ========================================
// SCHEMA IMPORTS - NEW ARCHITECTURE
// ========================================
// Import public and tenant schemas from dedicated files
export * from "./schema-public";
export * from "./schema-tenant";

// Import specialized schemas - using selective exports to avoid conflicts
export {
  userNotificationPreferences,
  insertUserNotificationPreferencesSchema
} from "./schema-notifications";
export type {
  UserNotificationPreferences,
  InsertUserNotificationPreferences
} from "./schema-notifications";
export * from "./schema-expense-approval";

// Import temporary missing tables - COMPLETED: All tables consolidated into schema-tenant.ts
// export * from "./schema-temp"; // Removed: All 29 tables successfully migrated to schema-tenant.ts

// ========================================
// RE-EXPORT VALIDATION SCHEMAS
// ========================================
// These are automatically exported from the individual schema files
// but listed here for documentation purposes:
//
// FROM SCHEMA-PUBLIC:
// - insertTenantSchema, insertUserSchema, insertUserSessionSchema
// - Tenant, User, UserSession types
//
// FROM SCHEMA-TENANT:
// - insertCustomerSchema, insertCompanySchema, insertBeneficiarySchema
// - insertTicketSchema, insertPerformanceEvaluationSchema, etc.
// - Customer, Company, Beneficiary, Ticket types, etc.
//
// FROM SCHEMA-NOTIFICATIONS:
// - All notification-related schemas and types
//
// FROM SCHEMA-EXPENSE-APPROVAL:
// - All expense approval schemas and types

// ========================================
// OMNIBRIDGE AUTOMATION RULES TABLE
// ========================================
// OmniBridge automation rules for message processing
export const omnibridgeAutomationRules = pgTable('omnibridge_automation_rules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default(''),
  trigger: jsonb('trigger').default({}),
  actions: jsonb('actions').default([]),
  enabled: boolean('enabled').default(true),
  priority: integer('priority').default(1),
  aiEnabled: boolean('ai_enabled').default(false),
  aiPromptId: varchar('ai_prompt_id', { length: 36 }),
  executionCount: integer('execution_count').default(0),
  successCount: integer('success_count').default(0),
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});


// ========================================
// LEGACY COMPATIBILITY NOTE
// ========================================
// All table definitions have been moved to dedicated schema files:
// - schema-public.ts: Cross-tenant essential tables (tenants, users, sessions, user_sessions)
// - schema-tenant.ts: Business data tables with tenant isolation
// - schema-notifications.ts: Notification system tables
// - schema-expense-approval.ts: Expense approval system tables
//
// This new architecture ensures:
// 1. Clear separation of concerns
// 2. Better maintainability
// 3. Proper tenant isolation
// 4. No circular dependencies
// 5. Easier testing and development

// ✅ 1QA.MD: Approval Entity Types - Module types that support approvals
export const approvalEntityTypeEnum = pgEnum("approval_entity_type", [
  "tickets", "expenses", "purchases", "contracts", "assets", "inventory",
  "materials", "services", "users", "customers", "reports", "workflows"
]);

const approverTypeEnum = pgEnum("approver_type", [
  "user", "user_group", "customer_contact", "supplier", "manager_chain", "auto"
]);

// Query builder operators
export const queryOperatorEnum = pgEnum("query_operator", [
  "EQ", "NEQ", "IN", "NOT_IN", "GT", "GTE", "LT", "LTE",
  "CONTAINS", "STARTS_WITH", "EXISTS", "BETWEEN"
]);

// Import customers table reference from schema-tenant
import { customers } from "./schema-tenant";

// ✅ 1QA.MD: Approval Rules - Universal rules for any module
export const approvalRules = pgTable("approval_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Module context
  moduleType: approvalEntityTypeEnum("module_type").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // Specific entity within module

  // Query builder conditions (JSON structure)
  queryConditions: jsonb("query_conditions").notNull(),

  // Approval pipeline configuration
  approvalSteps: jsonb("approval_steps").notNull(),

  // SLA settings - aligned with database reality
  slaHours: integer("sla_hours").default(24),
  businessHoursOnly: boolean("business_hours_only").default(true),
  autoApprovalConditions: jsonb("auto_approval_conditions").default({}),
  escalationSettings: jsonb("escalation_settings").default({}),

  // Hierarchical association
  companyId: uuid("company_id").references(() => customers.id), // Associate with customer/company

  // Configuration
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority rules evaluated first

  // Audit fields
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ✅ 1QA.MD: Approval Instances - Active approval processes
export const approvalInstances = pgTable("approval_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ruleId: uuid("rule_id").references(() => approvalRules.id).notNull(),
  entityId: uuid("entity_id").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  currentStepIndex: integer("current_step_index").default(0),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, expired
  requestedById: uuid("requested_by_id").notNull(),
  slaDeadline: timestamp("sla_deadline"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ✅ 1QA.MD: Approval Decisions - Individual approval decisions
export const approvalDecisions = pgTable("approval_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  instanceId: uuid("instance_id").references(() => approvalInstances.id).notNull(),
  stepIndex: integer("step_index").notNull(),
  approverId: uuid("approver_id").notNull(),
  decision: varchar("decision", { length: 20 }).notNull(), // approved, rejected, delegated
  comments: text("comments"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// ✅ 1QA.MD: Approval Steps - Step definitions
export const approvalSteps = pgTable("approval_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ruleId: uuid("rule_id").references(() => approvalRules.id).notNull(),
  stepIndex: integer("step_index").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  approverType: approverTypeEnum("approver_type").notNull(),
  approvers: jsonb("approvers").notNull(), // Array of approver IDs or rules
  requiredApprovals: integer("required_approvals").default(1),
  timeoutHours: integer("timeout_hours").default(24),
  escalationRules: jsonb("escalation_rules").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ✅ 1QA.MD: Approval Conditions - Complex approval conditions
export const approvalConditions = pgTable("approval_conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ruleId: uuid("rule_id").references(() => approvalRules.id).notNull(),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  operator: queryOperatorEnum("operator").notNull(),
  value: jsonb("value").notNull(),
  logicalOperator: varchar("logical_operator", { length: 10 }).default("AND"), // AND, OR
  groupIndex: integer("group_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// ✅ 1QA.MD: Approval Workflows - Workflow definitions
export const approvalWorkflows = pgTable("approval_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  moduleType: approvalEntityTypeEnum("module_type").notNull(),
  workflowSteps: jsonb("workflow_steps").notNull(),
  isActive: boolean("is_active").default(true),
  createdById: uuid("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});