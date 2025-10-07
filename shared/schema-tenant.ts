// ✅ 1QA.MD COMPLIANCE: TENANT SCHEMA - BUSINESS DATA WITH TENANT ISOLATION
// All business tables that require tenant-specific schemas

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
  bigint,
  serial,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// ========================================
// ENUMS DEFINITION
// ========================================

export const ticketStatusEnum = pgEnum("ticket_status_enum", ["open", "in_progress", "resolved", "closed", "cancelled"]);
export const ticketPriorityEnum = pgEnum("ticket_priority_enum", ["low", "medium", "high", "urgent"]);
export const itemTypeEnum = pgEnum("item_type_enum", ["material", "service", "tool", "equipment"]);
export const measurementUnitEnum = pgEnum("measurement_unit_enum", ["unit", "meter", "kilogram", "liter", "hour", "day", "piece"]);
export const locationTypeEnum = pgEnum("location_type_enum", ["warehouse", "office", "field", "customer_site", "other"]);
export const approvalEntityTypeEnum = pgEnum("approval_entity_type_enum", ["ticket", "purchase", "expense", "contract", "custom"]);
export const approverTypeEnum = pgEnum("approver_type_enum", ["user", "role", "group", "custom"]);
export const queryOperatorEnum = pgEnum("query_operator_enum", ["equals", "not_equals", "greater_than", "less_than", "contains", "starts_with", "ends_with", "in", "not_in"]);
export const knowledgeBaseCategoryEnum = pgEnum("knowledge_base_category_enum", ["general", "technical", "troubleshooting", "procedures", "policies", "faq"]);
export const knowledgeBaseStatusEnum = pgEnum("knowledge_base_status_enum", ["draft", "review", "published", "archived"]);
export const knowledgeBaseVisibilityEnum = pgEnum("knowledge_base_visibility_enum", ["public", "internal", "restricted"]);
export const knowledgeBaseApprovalStatusEnum = pgEnum("knowledge_base_approval_status_enum", ["pending", "approved", "rejected", "needs_review"]);
export const notificationTypeEnum = pgEnum("notification_type_enum", ["info", "warning", "error", "success", "reminder"]);
export const notificationPriorityEnum = pgEnum("notification_priority_enum", ["low", "normal", "high", "urgent"]);
export const notificationChannelEnum = pgEnum("notification_channel_enum", ["email", "sms", "push", "in_app"]);
export const notificationStatusEnum = pgEnum("notification_status_enum", ["pending", "sent", "delivered", "failed", "cancelled"]);
export const movementTypeEnum = pgEnum("movement_type_enum", ["in", "out", "transfer", "adjustment", "return"]);
export const gdprRequestTypeEnum = pgEnum("gdpr_request_type_enum", ["access", "rectification", "erasure", "portability", "restriction"]);
export const gdprStatusEnum = pgEnum("gdpr_status_enum", ["pending", "processing", "completed", "rejected"]);

// ========================================
// TENANT BUSINESS TABLES (Static definitions)
// All business tables that require tenant-specific schemas
// ========================================

// Customers table (Solicitantes - internal system requesters)
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  mobilePhone: varchar("mobile_phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  addressStreet: varchar("address_street", { length: 255 }),
  addressNumber: varchar("address_number", { length: 20 }),
  addressComplement: varchar("address_complement", { length: 100 }),
  addressNeighborhood: varchar("address_neighborhood", { length: 100 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 2 }),
  addressZipCode: varchar("address_zip_code", { length: 10 }),
  addressCountry: varchar("address_country", { length: 100 }).default("Brasil"),
  isActive: boolean("is_active").default(true).notNull(),
  verified: boolean("verified").default(false),
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
}, (table) => ({
  uniqueTenantEmail: unique("customers_tenant_email_unique").on(table.tenantId, table.email),
  tenantEmailIdx: index("customers_tenant_email_idx").on(table.tenantId, table.email),
  tenantActiveIdx: index("customers_tenant_active_idx").on(table.tenantId, table.isActive),
}));

// Companies table
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  addressStreet: varchar("address_street", { length: 255 }),
  addressNumber: varchar("address_number", { length: 20 }),
  addressComplement: varchar("address_complement", { length: 100 }),
  addressNeighborhood: varchar("address_neighborhood", { length: 100 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 2 }),
  addressZipCode: varchar("address_zip_code", { length: 10 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
}, (table) => [
  index("companies_tenant_name_idx").on(table.tenantId, table.name),
  index("companies_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Items table
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  tenantId: uuid("tenant_id").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: itemTypeEnum("type").default("material"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  unitOfMeasurement: measurementUnitEnum("unit_of_measurement").default("unit"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  stockQuantity: decimal("stock_quantity", { precision: 10, scale: 2 }),
  minimumStock: decimal("minimum_stock", { precision: 10, scale: 2 }),
  maximumStock: decimal("maximum_stock", { precision: 10, scale: 2 }),
  supplierId: uuid("supplier_id"),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  specifications: jsonb("specifications").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
}, (table) => [
  index("items_tenant_id_idx").on(table.tenantId),
  index("items_tenant_code_idx").on(table.tenantId, table.code),
  index("items_tenant_active_idx").on(table.tenantId, table.isActive),
  unique("items_tenant_code_unique").on(table.tenantId, table.code),
]);

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: ticketStatusEnum("status").default("open"),
  priority: ticketPriorityEnum("priority").default("medium"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  customerId: uuid("customer_id"),
  assignedTo: uuid("assigned_to"),
  companyId: uuid("company_id"),
  locationId: uuid("location_id"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  dueDate: timestamp("due_date"),
  resolutionDate: timestamp("resolution_date"),
  satisfactionRating: integer("satisfaction_rating"),
  satisfactionComment: text("satisfaction_comment"),
  tags: jsonb("tags").default([]),
  customFields: jsonb("custom_fields").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
  templateName: varchar("template_name", { length: 255 }),
  templateAlternative: varchar("template_alternative", { length: 255 }),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("tickets_tenant_id_idx").on(table.tenantId),
  index("tickets_tenant_status_idx").on(table.tenantId, table.status),
  index("tickets_tenant_priority_idx").on(table.tenantId, table.priority),
  index("tickets_tenant_customer_idx").on(table.tenantId, table.customerId),
  index("tickets_tenant_assigned_idx").on(table.tenantId, table.assignedTo),
  index("tickets_tenant_active_idx").on(table.tenantId, table.isActive),
  unique("tickets_tenant_number_unique").on(table.tenantId, table.ticketNumber),
]);

// Locations table
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: locationTypeEnum("type").default("office"),
  code: varchar("code", { length: 50 }),
  description: text("description"),
  addressStreet: varchar("address_street", { length: 255 }),
  addressNumber: varchar("address_number", { length: 20 }),
  addressComplement: varchar("address_complement", { length: 100 }),
  addressNeighborhood: varchar("address_neighborhood", { length: 100 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 2 }),
  addressZipCode: varchar("address_zip_code", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  parentLocationId: uuid("parent_location_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
}, (table) => [
  index("locations_tenant_id_idx").on(table.tenantId),
  index("locations_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// User Groups table
export const userGroups = pgTable("user_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by"),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
});

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
}, (table) => [
  index("activity_logs_tenant_id_idx").on(table.tenantId),
  index("activity_logs_tenant_user_idx").on(table.tenantId, table.userId),
  index("activity_logs_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
]);

// Knowledge Base Articles table
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  excerpt: text("excerpt"),
  authorId: uuid("author_id"),
  category: knowledgeBaseCategoryEnum("category").default("general"),
  status: knowledgeBaseStatusEnum("status").default("draft"),
  visibility: knowledgeBaseVisibilityEnum("visibility").default("internal"),
  approvalStatus: knowledgeBaseApprovalStatusEnum("approval_status").default("pending"),
  tags: jsonb("tags").default([]),
  viewCount: integer("view_count").default(0),
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),
  featured: boolean("featured").default(false),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: varchar("seo_description", { length: 500 }),
  slug: varchar("slug", { length: 500 }),
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("knowledge_base_articles_tenant_id_idx").on(table.tenantId),
  index("knowledge_base_articles_tenant_status_idx").on(table.tenantId, table.status),
  index("knowledge_base_articles_tenant_category_idx").on(table.tenantId, table.category),
  unique("knowledge_base_articles_tenant_slug_unique").on(table.tenantId, table.slug),
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: notificationTypeEnum("type").default("info"),
  severity: notificationPriorityEnum("severity").default("normal"),
  channels: jsonb("channels").default([]),
  status: notificationStatusEnum("status").default("pending"),
  scheduledAt: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("notifications_tenant_id_idx").on(table.tenantId),
  index("notifications_tenant_user_idx").on(table.tenantId, table.userId),
  index("notifications_tenant_status_idx").on(table.tenantId, table.status),
]);

// Reports table
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  queryDefinition: jsonb("query_definition").default({}),
  visualizationConfig: jsonb("visualization_config").default({}),
  parameters: jsonb("parameters").default({}),
  schedule: jsonb("schedule"),
  isPublic: boolean("is_public").default(false),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("reports_tenant_id_idx").on(table.tenantId),
]);

// Dashboards table
export const dashboards = pgTable("dashboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  layoutConfig: jsonb("layout_config").default({}),
  widgets: jsonb("widgets").default([]),
  permissions: jsonb("permissions").default({}),
  isPublic: boolean("is_public").default(false),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("dashboards_tenant_id_idx").on(table.tenantId),
]);

// GDPR Data Requests table
export const gdprDataRequests = pgTable("gdpr_data_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  requestType: gdprRequestTypeEnum("request_type").notNull(),
  subjectEmail: varchar("subject_email", { length: 255 }).notNull(),
  subjectName: varchar("subject_name", { length: 255 }),
  description: text("description"),
  status: gdprStatusEnum("status").default("pending"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedById: uuid("processed_by_id"),
  responseData: jsonb("response_data"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("gdpr_data_requests_tenant_id_idx").on(table.tenantId),
]);

// Ticket Relationships table
export const ticketRelationships = pgTable("ticket_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  sourceTicketId: uuid("source_ticket_id").notNull(),
  targetTicketId: uuid("target_ticket_id").notNull(),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(),
  description: text("description"),
  createdBy: uuid("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("ticket_relationships_tenant_source_idx").on(table.tenantId, table.sourceTicketId),
  index("ticket_relationships_tenant_target_idx").on(table.tenantId, table.targetTicketId),
  unique("ticket_relationships_unique").on(table.tenantId, table.sourceTicketId, table.targetTicketId, table.relationshipType),
]);

// Performance Evaluations table
export const performanceEvaluations = pgTable("performance_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  employeeId: uuid("employee_id").notNull(),
  evaluatorId: uuid("evaluator_id").notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  score: decimal("score", { precision: 3, scale: 2 }),
  feedback: text("feedback"),
  goals: jsonb("goals").default([]),
  achievements: jsonb("achievements").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("performance_evaluations_tenant_employee_idx").on(table.tenantId, table.employeeId),
]);

// Approval Requests table
export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  requestType: varchar("request_type", { length: 50 }).notNull(),
  requesterId: uuid("requester_id").notNull(),
  approverId: uuid("approver_id"),
  status: varchar("status", { length: 20 }).default("pending"),
  requestData: jsonb("request_data").default({}),
  approvalNotes: text("approval_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("approval_requests_tenant_status_idx").on(table.tenantId, table.status),
]);

// User Activity Logs table
export const userActivityLogs = pgTable("user_activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: uuid("entity_id"),
  details: jsonb("details").default({}),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_activity_logs_tenant_user_idx").on(table.tenantId, table.userId),
]);

// Skills table
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("skills_tenant_category_idx").on(table.tenantId, table.category),
]);

// User Skills table
export const userSkills = pgTable("user_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  skillId: uuid("skill_id").notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 50 }),
  certifiedAt: timestamp("certified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_skills_tenant_user_idx").on(table.tenantId, table.userId),
  unique("user_skills_unique").on(table.tenantId, table.userId, table.skillId),
]);

// User Group Memberships table
export const userGroupMemberships = pgTable("user_group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  groupId: uuid("group_id").notNull(),
  role: varchar("role", { length: 50 }).default("member"),
  isActive: boolean("is_active").default(true),
  addedAt: timestamp("added_at").defaultNow(),
  addedById: uuid("added_by_id"),
});

// Validation schemas for user groups
export const insertUserGroupSchema = createInsertSchema(userGroups);

// Departments table
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: uuid("manager_id"),
  parentDepartmentId: uuid("parent_department_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("departments_tenant_manager_idx").on(table.tenantId, table.managerId),
]);

// Hour Bank Entries table
export const hourBankEntries = pgTable("hour_bank_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  entryType: varchar("entry_type", { length: 20 }).notNull(), // credit, debit
  hours: decimal("hours", { precision: 8, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  description: text("description"),
  referenceDate: date("reference_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: uuid("created_by_id"),
}, (table) => [
  index("hour_bank_entries_tenant_user_idx").on(table.tenantId, table.userId),
]);

// Timecards table
export const timecards = pgTable("timecards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  workDate: date("work_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  breakDuration: integer("break_duration").default(0), // minutes
  totalHours: decimal("total_hours", { precision: 8, scale: 2 }),
  status: varchar("status", { length: 20 }).default("pending"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecards_tenant_user_date_idx").on(table.tenantId, table.userId, table.workDate),
  unique("timecards_unique").on(table.tenantId, table.userId, table.workDate),
]);

// Timecard Entries table
export const timecardEntries = pgTable("timecard_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  timecardId: uuid("timecard_id").notNull(),
  entryTime: timestamp("entry_time").notNull(),
  entryType: varchar("entry_type", { length: 20 }).notNull(), // clock_in, clock_out, break_start, break_end
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("timecard_entries_tenant_timecard_idx").on(table.tenantId, table.timecardId),
]);

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  managerId: uuid("manager_id"),
  clientId: uuid("client_id"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("projects_tenant_manager_idx").on(table.tenantId, table.managerId),
]);

// Ticket Messages table
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  senderId: uuid("sender_id").notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("comment"), // comment, system, email
  isInternal: boolean("is_internal").default(false),
  attachments: jsonb("attachments").default([]),
  metadata: jsonb("metadata").default({}), // Armazena sentiment analysis, channel info, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_messages_tenant_ticket_idx").on(table.tenantId, table.ticketId),
]);

// Work Schedules table
export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  scheduleType: varchar("schedule_type", { length: 20 }).default("weekly"), // weekly, daily, flexible
  workDays: jsonb("work_days").default([]), // [1,2,3,4,5] for Mon-Fri
  startTime: time("start_time"),
  endTime: time("end_time"),
  breakDuration: integer("break_duration").default(60), // minutes
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("work_schedules_tenant_user_idx").on(table.tenantId, table.userId),
]);

// Contracts table
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractNumber: varchar("contract_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  clientId: uuid("client_id"),
  status: varchar("status", { length: 20 }).default("draft"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  value: decimal("value", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contracts_tenant_client_idx").on(table.tenantId, table.clientId),
]);

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("suppliers_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Inventory table
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  locationId: uuid("location_id"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0"),
  reservedQuantity: decimal("reserved_quantity", { precision: 10, scale: 2 }).default("0"),
  lastMovementAt: timestamp("last_movement_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("inventory_tenant_item_idx").on(table.tenantId, table.itemId),
]);

// Customer Company Memberships table
export const customerCompanyMemberships = pgTable("customer_company_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  companyId: uuid("company_id").notNull(),
  role: varchar("role", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("customer_company_memberships_unique").on(table.tenantId, table.customerId, table.companyId),
]);

// And many more tables that are referenced in the types...
// Adding minimal structure for remaining tables to resolve import errors

export const scheduleTemplates = pgTable("schedule_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  template: jsonb("template").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ticketCategories = pgTable("ticket_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ticketSubcategories = pgTable("ticket_subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  categoryId: uuid("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ticketActions = pgTable("ticket_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  performedBy: uuid("performed_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const holidays = pgTable("holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  date: date("date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Adding remaining tables with minimal structure to resolve all type references
export const complianceReports = pgTable("compliance_reports", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const timecardBackups = pgTable("timecard_backups", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const ticketListViews = pgTable("ticket_list_views", { 
  id: uuid("id").primaryKey().defaultRandom(), 
  tenantId: uuid("tenant_id").notNull(), 
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdById: uuid("created_by_id"),
  isPublic: boolean("is_public").default(false),
  isDefault: boolean("is_default").default(false),
  columns: jsonb("columns").default([]).notNull(),
  filters: jsonb("filters").default([]).notNull(),
  sorting: jsonb("sorting").default([]),
  pageSize: integer("page_size").default(25),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
export const digitalSignatureKeys = pgTable("digital_signature_keys", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const auditLogs = pgTable("audit_logs", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const roles = pgTable("roles", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const permissions = pgTable("permissions", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const nsrSequences = pgTable("nsr_sequences", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const userRoleAssignments = pgTable("user_role_assignments", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), userId: uuid("user_id").notNull(), roleId: uuid("role_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const assignmentGroups = pgTable("assignment_groups", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const customFields = pgTable("custom_fields", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const timecardAuditLog = pgTable("timecard_audit_log", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const approvalGroups = pgTable("approval_groups", { 
  id: uuid("id").primaryKey().defaultRandom(), 
  tenantId: uuid("tenant_id").notNull(), 
  name: varchar("name", { length: 255 }).notNull(), 
  description: text("description"),
  groupType: varchar("group_type", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const approvalGroupMembers = pgTable("approval_group_members", { 
  id: uuid("id").primaryKey().defaultRandom(), 
  tenantId: uuid("tenant_id").notNull(), 
  groupId: uuid("group_id").notNull(),
  memberType: varchar("member_type", { length: 50 }).notNull(),
  memberId: uuid("member_id").notNull(),
  role: varchar("role", { length: 50 }).default('member'),
  isActive: boolean("is_active").default(true),
  addedById: uuid("added_by_id"),
  addedAt: timestamp("added_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});
export const approvalWorkflows = pgTable("approval_workflows", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const timecardApprovalHistory = pgTable("timecard_approval_history", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const templateFields = pgTable("template_fields", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const timecardApprovalSettings = pgTable("timecard_approval_settings", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const activities = pgTable("activities", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const settings = pgTable("settings", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), key: varchar("key", { length: 255 }).notNull(), value: text("value"), createdAt: timestamp("created_at").defaultNow() });
export const files = pgTable("files", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), filename: varchar("filename", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const tags = pgTable("tags", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const contractSlas = pgTable("contract_slas", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), contractId: uuid("contract_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const contractServices = pgTable("contract_services", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), contractId: uuid("contract_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const contractDocuments = pgTable("contract_documents", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), contractId: uuid("contract_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const contractRenewals = pgTable("contract_renewals", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), contractId: uuid("contract_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const contractBilling = pgTable("contract_billing", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), contractId: uuid("contract_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const contractEquipment = pgTable("contract_equipment", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), contractId: uuid("contract_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const ticketFieldConfigurations = pgTable("ticket_field_configurations", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const ticketFieldOptions = pgTable("ticket_field_options", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const ticketStyleConfigurations = pgTable("ticket_style_configurations", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const ticketDefaultConfigurations = pgTable("ticket_default_configurations", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const assets = pgTable("assets", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), name: varchar("name", { length: 255 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const ticketConsumedItems = pgTable("ticket_consumed_items", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), ticketId: uuid("ticket_id").notNull(), itemId: uuid("item_id").notNull(), quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const ticketPlannedItems = pgTable("ticket_planned_items", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), ticketId: uuid("ticket_id").notNull(), itemId: uuid("item_id").notNull(), quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), createdAt: timestamp("created_at").defaultNow() });
export const itemAttachments = pgTable("item_attachments", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), itemId: uuid("item_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const itemLinks = pgTable("item_links", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), itemId: uuid("item_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const itemCustomerLinks = pgTable("item_customer_links", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), itemId: uuid("item_id").notNull(), customerId: uuid("customer_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const itemSupplierLinks = pgTable("item_supplier_links", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), itemId: uuid("item_id").notNull(), supplierId: uuid("supplier_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
export const customerItemMappings = pgTable("customer_item_mappings", { id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull(), customerId: uuid("customer_id").notNull(), itemId: uuid("item_id").notNull(), createdAt: timestamp("created_at").defaultNow() });
// ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATE ZOD SCHEMA - VALIDATION
export const ticketTemplates = pgTable("ticket_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // ✅ 1QA.MD: OBRIGATÓRIO

  // Campos básicos
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Hierarquia de empresa (null = global, uuid = específico da empresa)
  companyId: uuid("company_id"), // ✅ Hierárquico: null = global, uuid = empresa específica

  // Tipo do template: creation (criação) ou edit (edição)
  templateType: varchar("template_type", { length: 50 }).notNull(), // 'creation' | 'edit'

  // Campos obrigatórios para template de CRIAÇÃO
  // Empresa, Cliente, Beneficiário, Status e Resumo
  requiredFields: jsonb("required_fields").default('[]'), // Array de campos obrigatórios

  // Campos customizáveis opcionais
  customFields: jsonb("custom_fields").default('[]'), // Array de campos customizáveis

  // Configurações de template
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  priority: varchar("priority", { length: 20 }).notNull().default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
  status: varchar("status", { length: 20 }).notNull().default('draft'), // 'active' | 'inactive' | 'draft'

  // Configurações de automação
  automation: jsonb("automation").default('{"enabled": false}'),
  workflow: jsonb("workflow").default('{"enabled": false}'),

  // Metadados
  tags: text("tags").array(),
  permissions: jsonb("permissions").default('[]'),
  isDefault: boolean("is_default").default(false),
  isSystem: boolean("is_system").default(false),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),

  // Auditoria
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Soft delete
  isActive: boolean("is_active").default(true)
}, (table) => [
  // ✅ 1QA.MD: CONSTRAINT obrigatório para tenant_id
  check('tenant_id_uuid_format',
    sql`LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'`
  ),
  // ✅ UNIQUE constraints sempre com tenant_id para isolamento
  unique('unique_template_per_tenant_company', ['tenant_id', 'name', 'company_id']), // Nome único por tenant/company
  // ✅ Index para performance
  index('idx_ticket_templates_tenant_company').on(table.tenantId, table.companyId),
  index('idx_ticket_templates_type_status').on(table.templateType, table.status)
]);

// ========================================
// ZOD VALIDATION SCHEMAS FOR NEW TABLES
// ========================================

export const insertTicketRelationshipSchema = createInsertSchema(ticketRelationships);
export const insertPerformanceEvaluationSchema = createInsertSchema(performanceEvaluations);
export const insertApprovalRequestSchema = createInsertSchema(approvalRequests);
export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs);
export const insertSkillSchema = createInsertSchema(skills);
export const insertUserSkillSchema = createInsertSchema(userSkills);
export const insertUserGroupMembershipSchema = createInsertSchema(userGroupMemberships);
export const insertDepartmentSchema = createInsertSchema(departments);
export const insertHourBankEntrySchema = createInsertSchema(hourBankEntries);
export const insertTimecardSchema = createInsertSchema(timecards);
export const insertTimecardEntrySchema = createInsertSchema(timecardEntries);
export const insertProjectSchema = createInsertSchema(projects);
export const insertTicketMessageSchema = createInsertSchema(ticketMessages);
export const insertWorkScheduleSchema = createInsertSchema(workSchedules);
export const insertContractSchema = createInsertSchema(contracts);
export const insertSupplierSchema = createInsertSchema(suppliers);
export const insertInventorySchema = createInsertSchema(inventory);
export const insertCustomerCompanyMembershipSchema = createInsertSchema(customerCompanyMemberships);
export const insertScheduleTemplateSchema = createInsertSchema(scheduleTemplates);
export const insertTicketCategorySchema = createInsertSchema(ticketCategories);
export const insertTicketSubcategorySchema = createInsertSchema(ticketSubcategories);
export const insertTicketActionSchema = createInsertSchema(ticketActions);
export const insertHolidaySchema = createInsertSchema(holidays);
export const insertComplianceReportSchema = createInsertSchema(complianceReports);
export const insertTimecardBackupSchema = createInsertSchema(timecardBackups);
export const insertTicketListViewSchema = createInsertSchema(ticketListViews);
export const insertDigitalSignatureKeySchema = createInsertSchema(digitalSignatureKeys);
export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const insertRoleSchema = createInsertSchema(roles);
export const insertPermissionSchema = createInsertSchema(permissions);
export const insertNsrSequenceSchema = createInsertSchema(nsrSequences);
export const insertUserRoleAssignmentSchema = createInsertSchema(userRoleAssignments);
export const insertAssignmentGroupSchema = createInsertSchema(assignmentGroups);
export const insertCustomFieldSchema = createInsertSchema(customFields);
export const insertTimecardAuditLogSchema = createInsertSchema(timecardAuditLog);
export const insertApprovalGroupMemberSchema = createInsertSchema(approvalGroupMembers);
export const insertApprovalGroupSchema = createInsertSchema(approvalGroups);
export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows);
export const insertTimecardApprovalHistorySchema = createInsertSchema(timecardApprovalHistory);
export const insertTemplateFieldSchema = createInsertSchema(templateFields);
export const insertTimecardApprovalSettingSchema = createInsertSchema(timecardApprovalSettings);
export const insertActivitySchema = createInsertSchema(activities);
export const insertSettingSchema = createInsertSchema(settings);
export const insertFileSchema = createInsertSchema(files);
export const insertTagSchema = createInsertSchema(tags);
export const insertContractSlaSchema = createInsertSchema(contractSlas);
export const insertContractServiceSchema = createInsertSchema(contractServices);
export const insertContractDocumentSchema = createInsertSchema(contractDocuments);
export const insertContractRenewalSchema = createInsertSchema(contractRenewals);
export const insertContractBillingSchema = createInsertSchema(contractBilling);
export const insertContractEquipmentSchema = createInsertSchema(contractEquipment);
export const insertTicketFieldConfigurationSchema = createInsertSchema(ticketFieldConfigurations);
export const insertTicketFieldOptionSchema = createInsertSchema(ticketFieldOptions);
export const insertTicketStyleConfigurationSchema = createInsertSchema(ticketStyleConfigurations);
export const insertTicketDefaultConfigurationSchema = createInsertSchema(ticketDefaultConfigurations);
export const insertAssetSchema = createInsertSchema(assets);
export const insertTicketConsumedItemSchema = createInsertSchema(ticketConsumedItems);
export const insertTicketPlannedItemSchema = createInsertSchema(ticketPlannedItems);
export const insertItemAttachmentSchema = createInsertSchema(itemAttachments);
export const insertItemLinkSchema = createInsertSchema(itemLinks);
export const insertItemCustomerLinkSchema = createInsertSchema(itemCustomerLinks);
export const insertItemSupplierLinkSchema = createInsertSchema(itemSupplierLinks);
export const insertCustomerItemMappingSchema = createInsertSchema(customerItemMappings);
// ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATE ZOD SCHEMA - VALIDATION
export const insertTicketTemplateSchema = createInsertSchema(ticketTemplates).extend({
  // Validações específicas para os campos obrigatórios
  templateType: z.enum(['creation', 'edit'], {
    errorMap: () => ({ message: 'Tipo do template deve ser "creation" ou "edit"' })
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade deve ser low, medium, high ou urgent' })
  }),
  status: z.enum(['active', 'inactive', 'draft'], {
    errorMap: () => ({ message: 'Status deve ser active, inactive ou draft' })
  }),
  // Para templates de criação, validar campos obrigatórios
  requiredFields: z.array(z.object({
    fieldName: z.string(),
    fieldType: z.string(),
    label: z.string(),
    required: z.boolean().default(true)
  })).optional().refine((fields) => {
    // Para templates de criação, deve ter os campos obrigatórios
    if (!fields) return true;
    const requiredFieldNames = ['company', 'client', 'beneficiary', 'status', 'summary'];
    const providedFieldNames = fields.map(f => f.fieldName.toLowerCase());
    return requiredFieldNames.every(req => providedFieldNames.includes(req));
  }, {
    message: 'Templates de criação devem incluir os campos obrigatórios: Empresa, Cliente, Beneficiário, Status e Resumo'
  })
});

export type InsertTicketTemplate = z.infer<typeof insertTicketTemplateSchema>;
export type SelectTicketTemplate = typeof ticketTemplates.$inferSelect;