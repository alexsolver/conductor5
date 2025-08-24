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
  serial, // Import serial for nsr
  pgEnum, // Import pgEnum for approval enums
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Import public schema for references (commented out to avoid circular deps)
// import { tenants, users } from "./schema-public";

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
  customerType: varchar("customer_type", { length: 10 }).default("PF").notNull(),
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  companyName: varchar("company_name", { length: 255 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  state: varchar("state", { length: 2 }),
  address: text("address"),
  addressNumber: varchar("address_number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  zipCode: varchar("zip_code", { length: 10 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTenantEmail: unique("customers_tenant_email_unique").on(table.tenantId, table.email),
  tenantEmailIdx: index("customers_tenant_email_idx").on(table.tenantId, table.email),
  tenantActiveIdx: index("customers_tenant_active_idx").on(table.tenantId, table.isActive),
  tenantTypeIdx: index("customers_tenant_type_idx").on(table.tenantId, table.customerType),
}));

// Companies table
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  description: text("description"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  taxId: varchar("tax_id", { length: 50 }),
  registrationNumber: varchar("registration_number", { length: 50 }),
  size: varchar("size", { length: 50 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }),
  status: varchar("status", { length: 50 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("companies_tenant_name_idx").on(table.tenantId, table.name),
  index("companies_tenant_status_idx").on(table.tenantId, table.status),
  index("companies_tenant_tier_idx").on(table.tenantId, table.subscriptionTier),
  index("companies_tenant_size_idx").on(table.tenantId, table.size),
]);

// Beneficiaries table
export const beneficiaries = pgTable("beneficiaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  cellPhone: varchar("cell_phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  rg: varchar("rg", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  integrationCode: varchar("integration_code", { length: 100 }),
  customerId: uuid("customer_id"),
  customerCode: varchar("customer_code", { length: 100 }),
  birthDate: date("birth_date"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTenantEmail: unique("beneficiaries_tenant_email_unique").on(table.tenantId, table.email),
  uniqueTenantCpf: unique("beneficiaries_tenant_cpf_unique").on(table.tenantId, table.cpf),
  uniqueTenantCnpj: unique("beneficiaries_tenant_cnpj_unique").on(table.tenantId, table.cnpj),
  uniqueTenantRg: unique("beneficiaries_tenant_rg_unique").on(table.tenantId, table.rg),
  tenantCpfIdx: index("beneficiaries_tenant_cpf_idx").on(table.tenantId, table.cpf),
  tenantActiveIdx: index("beneficiaries_tenant_active_idx").on(table.tenantId, table.isActive),
  tenantCustomerIdx: index("beneficiaries_tenant_customer_idx").on(table.tenantId, table.customerId),
}));

// Tickets table - Complete with all fields
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  number: varchar("number", { length: 50 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 50 }).default("open"),
  impact: varchar("impact", { length: 20 }).default("medium"),
  urgency: varchar("urgency", { length: 20 }).default("medium"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  symptoms: text("symptoms"),
  workaround: text("workaround"),
  businessImpact: text("business_impact"),
  callerId: uuid("caller_id"),
  callerType: varchar("caller_type", { length: 50 }).default("customer"),
  companyId: uuid("company_id"),
  beneficiaryId: uuid("beneficiary_id"),
  beneficiaryType: varchar("beneficiary_type", { length: 50 }).default("customer"),
  responsibleId: uuid("assigned_to_id"),
  assignmentGroupId: uuid("assignment_group_id"),
  locationId: uuid("location_id"),
  followerId: uuid("follower_id"),
  followers: text("followers").array(),
  tags: text("tags").array(),
  contactType: varchar("contact_type", { length: 50 }),
  environment: varchar("environment", { length: 100 }),
  templateName: varchar("template_name", { length: 255 }),
  templateAlternative: varchar("template_alternative", { length: 255 }),
  callerNameResponsible: varchar("caller_name_responsible", { length: 255 }),
  callType: varchar("call_type", { length: 50 }),
  callUrl: varchar("call_url", { length: 500 }),
  environmentError: text("environment_error"),
  callNumber: varchar("call_number", { length: 50 }),
  groupField: varchar("group_field", { length: 100 }),
  serviceVersion: varchar("service_version", { length: 100 }),
  summary: text("summary"),
  responsibleTeam: varchar("responsible_team", { length: 100 }),
  resolutionCode: varchar("resolution_code", { length: 100 }),
  resolutionNotes: text("resolution_notes"),
  linkTicketNumber: varchar("link_ticket_number", { length: 255 }),
  linkType: varchar("link_type", { length: 50 }),
  linkComment: text("link_comment"),
  slaExpirationDate: timestamp("sla_expiration_date"),
  slaStartDate: timestamp("sla_start_date"),
  slaElapsedPercent: decimal("sla_elapsed_percent", { precision: 5, scale: 2 }).default("0"),
  slaStatus: varchar("sla_status", { length: 20 }).default("none"),
  appliedSlaId: uuid("applied_sla_id"),
  createdBy: uuid("opened_by_id"),
  updatedBy: uuid("updated_by"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tickets_tenant_status_priority_idx").on(table.tenantId, table.status, table.priority),
  index("tickets_tenant_assigned_idx").on(table.tenantId, table.responsibleId),
  index("tickets_tenant_customer_idx").on(table.tenantId, table.callerId),
  index("tickets_tenant_company_idx").on(table.tenantId, table.companyId),
  index("tickets_tenant_environment_idx").on(table.tenantId, table.environment),
  index("tickets_tenant_template_idx").on(table.tenantId, table.templateName),
]);

// Performance Evaluations table
export const performanceEvaluations = pgTable("performance_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  goals: jsonb("goals").default([]),
  completedGoals: integer("completed_goals").default(0),
  feedback: text("feedback"),
  evaluatorId: uuid("evaluator_id"),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("performance_evaluations_tenant_user_idx").on(table.tenantId, table.userId),
  index("performance_evaluations_period_idx").on(table.periodStart, table.periodEnd),
  unique("performance_evaluations_unique_period").on(table.tenantId, table.userId, table.periodStart, table.periodEnd),
]);

// Approval Requests table  
export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  requesterId: uuid("requester_id").notNull(),
  approverId: uuid("approver_id"),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  data: jsonb("data").default({}),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }),
  requestedDate: date("requested_date"),
  approvedDate: date("approved_date"),
  comments: text("comments"),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("approval_requests_tenant_requester_idx").on(table.tenantId, table.requesterId),
  index("approval_requests_tenant_approver_idx").on(table.tenantId, table.approverId),
  index("approval_requests_status_idx").on(table.status),
  index("approval_requests_type_idx").on(table.type),
]);

// User Activity Logs table
export const userActivityLogs = pgTable("user_activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: uuid("resource_id"),
  description: text("description"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  location: jsonb("location"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_activity_logs_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_activity_logs_tenant_action_idx").on(table.tenantId, table.action),
  index("user_activity_logs_tenant_resource_idx").on(table.tenantId, table.resourceType),
  index("user_activity_logs_tenant_created_idx").on(table.tenantId, table.createdAt),
]);

// Locations table
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("locations_tenant_name_idx").on(table.tenantId, table.name),
  index("locations_tenant_active_idx").on(table.tenantId, table.isActive),
  index("locations_tenant_geo_idx").on(table.tenantId, table.latitude, table.longitude),
]);

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  userId: uuid("user_id"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("activity_logs_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
  index("activity_logs_tenant_time_idx").on(table.tenantId, table.createdAt),
]);

// Items table (Material/Services inventory)
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("material"),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 20 }).default("active"),
  measurementUnit: varchar("measurement_unit", { length: 10 }).default("UN"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("items_tenant_name_idx").on(table.tenantId, table.name),
  index("items_tenant_type_idx").on(table.tenantId, table.type),
  index("items_tenant_category_idx").on(table.tenantId, table.category),
  index("items_tenant_status_idx").on(table.tenantId, table.status),
]);

// Skills table
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("skills_tenant_name_idx").on(table.tenantId, table.name),
  index("skills_tenant_category_idx").on(table.tenantId, table.category),
  index("skills_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// User Skills table
export const userSkills = pgTable("user_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  skillId: uuid("skill_id").notNull(),
  level: integer("level").notNull(),
  assessedAt: timestamp("assessed_at").defaultNow(),
  assessedBy: varchar("assessed_by", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_skills_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_skills_tenant_skill_idx").on(table.tenantId, table.skillId),
  index("user_skills_skill_level_idx").on(table.tenantId, table.skillId, table.level),
]);

// User Groups table
export const userGroups = pgTable("user_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("user_groups_tenant_name_unique").on(table.tenantId, table.name),
  index("user_groups_tenant_active_idx").on(table.tenantId, table.isActive),
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
}, (table) => [
  unique("user_group_memberships_unique").on(table.tenantId, table.userId, table.groupId),
  index("user_group_memberships_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_group_memberships_tenant_group_idx").on(table.tenantId, table.groupId),
]);

// Departments table
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: uuid("manager_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("departments_tenant_name_idx").on(table.tenantId, table.name),
  index("departments_tenant_manager_idx").on(table.tenantId, table.managerId),
  index("departments_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Hour Bank Entries table (Timecard system)
export const hourBankEntries = pgTable("hour_bank_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  entryDate: date("entry_date").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }).notNull(),
  hoursExpected: decimal("hours_expected", { precision: 5, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 5, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("hour_bank_entries_tenant_user_idx").on(table.tenantId, table.userId),
  index("hour_bank_entries_tenant_date_idx").on(table.tenantId, table.entryDate),
  index("hour_bank_entries_user_date_idx").on(table.userId, table.entryDate),
]);

// Timecards table
export const timecards = pgTable("timecards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  breakDuration: integer("break_duration").default(0),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 20 }).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecards_tenant_user_idx").on(table.tenantId, table.userId),
  index("timecards_tenant_date_idx").on(table.tenantId, table.date),
  unique("timecards_user_date_unique").on(table.tenantId, table.userId, table.date),
]);

// Timecard Entries table
export const timecardEntries = pgTable("timecard_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  timecardId: uuid("timecard_id").notNull(),
  userId: uuid("user_id").notNull(),
  entryType: varchar("entry_type", { length: 20 }).notNull(), // 'clock_in', 'clock_out', 'break_start', 'break_end'
  timestamp: timestamp("timestamp").notNull(),
  location: jsonb("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecard_entries_tenant_timecard_idx").on(table.tenantId, table.timecardId),
  index("timecard_entries_tenant_user_idx").on(table.tenantId, table.userId),
  index("timecard_entries_timestamp_idx").on(table.timestamp),
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
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("projects_tenant_name_idx").on(table.tenantId, table.name),
  index("projects_tenant_status_idx").on(table.tenantId, table.status),
  index("projects_tenant_manager_idx").on(table.tenantId, table.managerId),
]);

// Ticket Messages table
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  ticketId: uuid("ticket_id").notNull(),
  content: text("content").notNull(),
  sender: varchar("sender", { length: 255 }).notNull(),
  senderType: varchar("sender_type", { length: 50 }).default("agent"),
  message: text("message"),
  messageType: varchar("message_type", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_messages_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_messages_tenant_sender_idx").on(table.tenantId, table.senderType),
  index("ticket_messages_tenant_time_idx").on(table.tenantId, table.createdAt),
]);

// Ticket Relationships table
export const ticketRelationships = pgTable("ticket_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  sourceTicketId: uuid("source_ticket_id").notNull(),
  targetTicketId: uuid("target_ticket_id").notNull(),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(),
  description: text("description"),
  createdById: uuid("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("ticket_relationships_source_idx").on(table.tenantId, table.sourceTicketId),
  index("ticket_relationships_target_idx").on(table.tenantId, table.targetTicketId),
  index("ticket_relationships_type_idx").on(table.relationshipType),
  index("ticket_relationships_active_idx").on(table.tenantId, table.isActive),
  unique("ticket_relationships_unique").on(table.tenantId, table.sourceTicketId, table.targetTicketId, table.relationshipType),
]);

// Work Schedules table
export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("work_schedules_tenant_user_idx").on(table.tenantId, table.userId),
  index("work_schedules_tenant_day_idx").on(table.tenantId, table.dayOfWeek),
  index("work_schedules_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Contracts table
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  clientId: uuid("client_id"),
  status: varchar("status", { length: 20 }).default("active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  value: decimal("value", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("contracts_tenant_client_idx").on(table.tenantId, table.clientId),
  index("contracts_tenant_status_idx").on(table.tenantId, table.status),
  index("contracts_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Supplier table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  taxId: varchar("tax_id", { length: 50 }),
  status: varchar("status", { length: 20 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("suppliers_tenant_name_idx").on(table.tenantId, table.name),
  index("suppliers_tenant_status_idx").on(table.tenantId, table.status),
  index("suppliers_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Inventory table
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0"),
  minimumStock: decimal("minimum_stock", { precision: 10, scale: 2 }).default("0"),
  location: varchar("location", { length: 255 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("inventory_tenant_item_idx").on(table.tenantId, table.itemId),
  index("inventory_tenant_location_idx").on(table.tenantId, table.location),
  index("inventory_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Customer Company Memberships table
export const customerCompanyMemberships = pgTable("customer_company_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  companyId: uuid("company_id").notNull(),
  role: varchar("role", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("customer_company_memberships_tenant_customer_idx").on(table.tenantId, table.customerId),
  index("customer_company_memberships_tenant_company_idx").on(table.tenantId, table.companyId),
  unique("customer_company_memberships_unique").on(table.tenantId, table.customerId, table.companyId),
]);

// Schedule Templates table
export const scheduleTemplates = pgTable("schedule_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  template: jsonb("template").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("schedule_templates_tenant_name_idx").on(table.tenantId, table.name),
  index("schedule_templates_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Ticket Categories table
export const ticketCategories = pgTable("ticket_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: uuid("parent_id"), // Self-referencing for hierarchy
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_categories_tenant_name_idx").on(table.tenantId, table.name),
  index("ticket_categories_tenant_parent_idx").on(table.tenantId, table.parentId),
  index("ticket_categories_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Ticket Subcategories table
export const ticketSubcategories = pgTable("ticket_subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: uuid("category_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_subcategories_tenant_name_idx").on(table.tenantId, table.name),
  index("ticket_subcategories_tenant_category_idx").on(table.tenantId, table.categoryId),
  index("ticket_subcategories_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Ticket Actions table
export const ticketActions = pgTable("ticket_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  userId: uuid("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ticket_actions_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_actions_tenant_user_idx").on(table.tenantId, table.userId),
  index("ticket_actions_tenant_action_idx").on(table.tenantId, table.action),
  index("ticket_actions_tenant_created_idx").on(table.tenantId, table.createdAt),
]);

// Holidays table
export const holidays = pgTable("holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  date: date("date").notNull(),
  type: varchar("type", { length: 50 }).default("national"),
  countryCode: varchar("country_code", { length: 2 }).default("BR"),
  regionCode: varchar("region_code", { length: 10 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("holidays_tenant_date_idx").on(table.tenantId, table.date),
  index("holidays_tenant_type_idx").on(table.tenantId, table.type),
  index("holidays_tenant_country_idx").on(table.tenantId, table.countryCode),
  index("holidays_tenant_region_idx").on(table.tenantId, table.regionCode),
]);

// Compliance Reports table  
export const complianceReports = pgTable("compliance_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  totalRecords: integer("total_records").default(0),
  totalEmployees: integer("total_employees").default(0),
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }).default("0"),
  isSubmittedToAuthorities: boolean("is_submitted_to_authorities").default(false),
  submissionDate: timestamp("submission_date"),
  submissionProtocol: varchar("submission_protocol", { length: 255 }),
  data: jsonb("data").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("compliance_reports_tenant_type_idx").on(table.tenantId, table.reportType),
  index("compliance_reports_tenant_period_idx").on(table.tenantId, table.periodStart, table.periodEnd),
  index("compliance_reports_submitted_idx").on(table.isSubmittedToAuthorities),
]);

// Timecard Backups table
export const timecardBackups = pgTable("timecard_backups", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  backupDate: date("backup_date").notNull(),
  recordCount: integer("record_count").notNull(),
  backupSize: bigint("backup_size", { mode: "number" }),
  filePath: varchar("file_path", { length: 500 }),
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  compressionType: varchar("compression_type", { length: 20 }).default("gzip"),
  checksum: varchar("checksum", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecard_backups_tenant_date_idx").on(table.tenantId, table.backupDate),
  index("timecard_backups_tenant_verified_idx").on(table.tenantId, table.isVerified),
]);

// Ticket List Views table
export const ticketListViews = pgTable("ticket_list_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  filters: jsonb("filters").default({}),
  columns: jsonb("columns").default([]),
  sortBy: varchar("sort_by", { length: 100 }),
  sortOrder: varchar("sort_order", { length: 10 }).default("desc"),
  isDefault: boolean("is_default").default(false),
  isPublic: boolean("is_public").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_list_views_tenant_user_idx").on(table.tenantId, table.userId),
  index("ticket_list_views_tenant_public_idx").on(table.tenantId, table.isPublic),
  index("ticket_list_views_tenant_default_idx").on(table.tenantId, table.isDefault),
]);

// Digital Signature Keys table
export const digitalSignatureKeys = pgTable("digital_signature_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  keyType: varchar("key_type", { length: 50 }).notNull(), // 'RSA', 'ECDSA', etc.
  publicKey: text("public_key").notNull(),
  privateKeyHash: varchar("private_key_hash", { length: 255 }), // Hashed for verification only
  algorithm: varchar("algorithm", { length: 50 }).default("SHA256"),
  keySize: integer("key_size").default(2048),
  expiresAt: timestamp("expires_at"),
  status: varchar("status", { length: 20 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("digital_signature_keys_tenant_user_idx").on(table.tenantId, table.userId),
  index("digital_signature_keys_tenant_status_idx").on(table.tenantId, table.status),
  index("digital_signature_keys_tenant_expiry_idx").on(table.tenantId, table.expiresAt),
]);

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id"),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  action: varchar("action", { length: 100 }).notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("audit_logs_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
  index("audit_logs_tenant_user_idx").on(table.tenantId, table.userId),
  index("audit_logs_tenant_timestamp_idx").on(table.tenantId, table.timestamp),
  index("audit_logs_tenant_action_idx").on(table.tenantId, table.action),
]);

// Roles table
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  permissions: jsonb("permissions").default([]),
  isSystem: boolean("is_system").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("roles_tenant_name_idx").on(table.tenantId, table.name),
  index("roles_tenant_active_idx").on(table.tenantId, table.isActive),
  unique("roles_tenant_name_unique").on(table.tenantId, table.name),
]);

// Permissions table
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  resource: varchar("resource", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("permissions_tenant_resource_idx").on(table.tenantId, table.resource),
  index("permissions_tenant_action_idx").on(table.tenantId, table.action),
  unique("permissions_tenant_resource_action_unique").on(table.tenantId, table.resource, table.action),
]);

// NSR Sequences table - CLT compliance requirement for sequential numbering
export const nsrSequences = pgTable("nsr_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  sequenceType: varchar("sequence_type", { length: 100 }).notNull(), // 'timecard', 'report', etc.
  currentValue: bigint("current_value", { mode: "number" }).notNull().default(0),
  prefix: varchar("prefix", { length: 20 }), // 'TC', 'CR', etc.
  year: integer("year").notNull(),
  month: integer("month"), // Optional for monthly resets
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("nsr_sequences_tenant_type_idx").on(table.tenantId, table.sequenceType),
  index("nsr_sequences_tenant_year_idx").on(table.tenantId, table.year),
  unique("nsr_sequences_tenant_type_year_unique").on(table.tenantId, table.sequenceType, table.year, table.month),
]);

// User Role Assignments table
export const userRoleAssignments = pgTable("user_role_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  roleId: uuid("role_id").notNull(),
  assignedBy: uuid("assigned_by"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_role_assignments_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_role_assignments_tenant_role_idx").on(table.tenantId, table.roleId),
  unique("user_role_assignments_unique").on(table.tenantId, table.userId, table.roleId),
]);

// Assignment Groups table
export const assignmentGroups = pgTable("assignment_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: uuid("manager_id"),
  type: varchar("type", { length: 50 }).default("support"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("assignment_groups_tenant_name_idx").on(table.tenantId, table.name),
  index("assignment_groups_tenant_manager_idx").on(table.tenantId, table.managerId),
  index("assignment_groups_tenant_type_idx").on(table.tenantId, table.type),
]);

// Custom Fields table
export const customFields = pgTable("custom_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // 'ticket', 'customer', etc.
  fieldName: varchar("field_name", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(), // 'text', 'number', 'date', etc.
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  options: jsonb("options"), // For select/radio fields
  validation: jsonb("validation"), // Validation rules
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("custom_fields_tenant_entity_idx").on(table.tenantId, table.entityType),
  index("custom_fields_tenant_name_idx").on(table.tenantId, table.fieldName),
  unique("custom_fields_tenant_entity_name_unique").on(table.tenantId, table.entityType, table.fieldName),
]);

// Timecard Audit Log table - CLT compliance requirement
export const timecardAuditLog = pgTable("timecard_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  timecardEntryId: uuid("timecard_entry_id").notNull(),
  userId: uuid("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // 'created', 'modified', 'deleted'
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  hash: varchar("hash", { length: 255 }), // SHA-256 for integrity
  signature: text("signature"), // Digital signature
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("timecard_audit_log_tenant_entry_idx").on(table.tenantId, table.timecardEntryId),
  index("timecard_audit_log_tenant_user_idx").on(table.tenantId, table.userId),
  index("timecard_audit_log_tenant_created_idx").on(table.tenantId, table.createdAt),
  index("timecard_audit_log_tenant_action_idx").on(table.tenantId, table.action),
]);

// ========================================
// SCHEMA VALIDATION & TYPES  
// ========================================

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers);
export const insertCompanySchema = createInsertSchema(companies);
export const insertBeneficiarySchema = createInsertSchema(beneficiaries);
export const insertTicketSchema = createInsertSchema(tickets);
export const insertPerformanceEvaluationSchema = createInsertSchema(performanceEvaluations);
export const insertApprovalRequestSchema = createInsertSchema(approvalRequests);
export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs);
export const insertLocationSchema = createInsertSchema(locations);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertItemSchema = createInsertSchema(items);
export const insertSkillSchema = createInsertSchema(skills);
export const insertUserSkillSchema = createInsertSchema(userSkills);
export const insertUserGroupSchema = createInsertSchema(userGroups);
export const insertUserGroupMembershipSchema = createInsertSchema(userGroupMemberships);
export const insertDepartmentSchema = createInsertSchema(departments);
export const insertHourBankEntrySchema = createInsertSchema(hourBankEntries);
export const insertTimecardSchema = createInsertSchema(timecards);
export const insertTimecardEntrySchema = createInsertSchema(timecardEntries);
export const insertProjectSchema = createInsertSchema(projects);
export const insertTicketMessageSchema = createInsertSchema(ticketMessages);
export const insertTicketRelationshipSchema = createInsertSchema(ticketRelationships);
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

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type PerformanceEvaluation = typeof performanceEvaluations.$inferSelect;
export type InsertPerformanceEvaluation = z.infer<typeof insertPerformanceEvaluationSchema>;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type UserGroup = typeof userGroups.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroupMembership = typeof userGroupMemberships.$inferSelect;
export type InsertUserGroupMembership = z.infer<typeof insertUserGroupMembershipSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type HourBankEntry = typeof hourBankEntries.$inferSelect;
export type InsertHourBankEntry = z.infer<typeof insertHourBankEntrySchema>;
export type Timecard = typeof timecards.$inferSelect;
export type InsertTimecard = z.infer<typeof insertTimecardSchema>;
export type TimecardEntry = typeof timecardEntries.$inferSelect;
export type InsertTimecardEntry = z.infer<typeof insertTimecardEntrySchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketRelationship = typeof ticketRelationships.$inferSelect;
export type InsertTicketRelationship = z.infer<typeof insertTicketRelationshipSchema>;
export type WorkSchedule = typeof workSchedules.$inferSelect;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type CustomerCompanyMembership = typeof customerCompanyMemberships.$inferSelect;
export type InsertCustomerCompanyMembership = z.infer<typeof insertCustomerCompanyMembershipSchema>;
export type ScheduleTemplate = typeof scheduleTemplates.$inferSelect;
export type InsertScheduleTemplate = z.infer<typeof insertScheduleTemplateSchema>;
export type TicketCategory = typeof ticketCategories.$inferSelect;
export type InsertTicketCategory = z.infer<typeof insertTicketCategorySchema>;
export type TicketSubcategory = typeof ticketSubcategories.$inferSelect;
export type InsertTicketSubcategory = z.infer<typeof insertTicketSubcategorySchema>;
export type TicketAction = typeof ticketActions.$inferSelect;
export type InsertTicketAction = z.infer<typeof insertTicketActionSchema>;
export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;
export type TimecardBackup = typeof timecardBackups.$inferSelect;
export type InsertTimecardBackup = z.infer<typeof insertTimecardBackupSchema>;
export type TicketListView = typeof ticketListViews.$inferSelect;
export type InsertTicketListView = z.infer<typeof insertTicketListViewSchema>;
export type DigitalSignatureKey = typeof digitalSignatureKeys.$inferSelect;
export type InsertDigitalSignatureKey = z.infer<typeof insertDigitalSignatureKeySchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type NsrSequence = typeof nsrSequences.$inferSelect;
export type InsertNsrSequence = z.infer<typeof insertNsrSequenceSchema>;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type InsertUserRoleAssignment = z.infer<typeof insertUserRoleAssignmentSchema>;
export type AssignmentGroup = typeof assignmentGroups.$inferSelect;
export type InsertAssignmentGroup = z.infer<typeof insertAssignmentGroupSchema>;
export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type TimecardAuditLog = typeof timecardAuditLog.$inferSelect;
export type InsertTimecardAuditLog = z.infer<typeof insertTimecardAuditLogSchema>;