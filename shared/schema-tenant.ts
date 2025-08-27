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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// ========================================
// ENUMS DEFINITION
// ========================================

export const customerTypeEnum = pgEnum("customer_type_enum", ["PF", "PJ"]);
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
  customerType: customerTypeEnum("customer_type").default("PF"),
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  companyName: varchar("company_name", { length: 255 }),
  contactPerson: varchar("contact_person", { length: 255 }),
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
  tenantTypeIdx: index("customers_tenant_type_idx").on(table.tenantId, table.customerType),
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
  id: uuid("id").primaryKey().defaultRandom(),
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
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  permissions: jsonb("permissions").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_groups_tenant_id_idx").on(table.tenantId),
  index("user_groups_tenant_active_idx").on(table.tenantId, table.isActive),
]);

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
  priority: notificationPriorityEnum("priority").default("normal"),
  channel: notificationChannelEnum("channel").default("in_app"),
  status: notificationStatusEnum("status").default("pending"),
  scheduledFor: timestamp("scheduled_for"),
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

// ========================================
// ZOD VALIDATION SCHEMAS
// ========================================

export const insertCustomerSchema = createInsertSchema(customers);
export const insertCompanySchema = createInsertSchema(companies);
export const insertBeneficiarySchema = createInsertSchema(beneficiaries);
export const insertTicketSchema = createInsertSchema(tickets);
export const insertItemSchema = createInsertSchema(items);
export const insertLocationSchema = createInsertSchema(locations);
export const insertUserGroupSchema = createInsertSchema(userGroups);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertKnowledgeBaseArticleSchema = createInsertSchema(knowledgeBaseArticles);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertReportSchema = createInsertSchema(reports);
export const insertDashboardSchema = createInsertSchema(dashboards);
export const insertGdprDataRequestSchema = createInsertSchema(gdprDataRequests);

// ========================================
// TYPES EXPORT
// ========================================

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type NewBeneficiary = typeof beneficiaries.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type UserGroup = typeof userGroups.$inferSelect;
export type NewUserGroup = typeof userGroups.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type KnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferSelect;
export type NewKnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Dashboard = typeof dashboards.$inferSelect;
export type NewDashboard = typeof dashboards.$inferInsert;
export type GdprDataRequest = typeof gdprDataRequests.$inferSelect;
export type NewGdprDataRequest = typeof gdprDataRequests.$inferInsert;

export type PerformanceEvaluation = typeof performanceEvaluations.$inferSelect;
export type InsertPerformanceEvaluation = z.infer<typeof insertPerformanceEvaluationSchema>;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
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

// Additional types from consolidated tables
export type ApprovalGroupMember = typeof approvalGroupMembers.$inferSelect;
export type InsertApprovalGroupMember = z.infer<typeof insertApprovalGroupMemberSchema>;
export type ApprovalGroup = typeof approvalGroups.$inferSelect;
export type InsertApprovalGroup = z.infer<typeof insertApprovalGroupSchema>;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type TimecardApprovalHistory = typeof timecardApprovalHistory.$inferSelect;
export type InsertTimecardApprovalHistory = z.infer<typeof insertTimecardApprovalHistorySchema>;
// export type Notification = typeof notifications.$inferSelect; // Moved to schema-notifications.ts
// export type InsertNotification = z.infer<typeof insertNotificationSchema>; // Moved to schema-notifications.ts
export type TemplateField = typeof templateFields.$inferSelect;
export type InsertTemplateField = z.infer<typeof insertTemplateFieldSchema>;
export type TimecardApprovalSetting = typeof timecardApprovalSettings.$inferSelect;
export type InsertTimecardApprovalSetting = z.infer<typeof insertTimecardApprovalSettingSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type ContractSla = typeof contractSlas.$inferSelect;
export type InsertContractSla = z.infer<typeof insertContractSlaSchema>;
export type ContractService = typeof contractServices.$inferSelect;
export type InsertContractService = z.infer<typeof insertContractServiceSchema>;
export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractDocument = z.infer<typeof insertContractDocumentSchema>;
export type ContractRenewal = typeof contractRenewals.$inferSelect;
export type InsertContractRenewal = z.infer<typeof insertContractRenewalSchema>;
export type ContractBilling = typeof contractBilling.$inferSelect;
export type InsertContractBilling = z.infer<typeof insertContractBillingSchema>;
export type ContractEquipment = typeof contractEquipment.$inferSelect;
export type InsertContractEquipment = z.infer<typeof insertContractEquipmentSchema>;
export type TicketFieldConfiguration = typeof ticketFieldConfigurations.$inferSelect;
export type InsertTicketFieldConfiguration = z.infer<typeof insertTicketFieldConfigurationSchema>;
export type TicketFieldOption = typeof ticketFieldOptions.$inferSelect;
export type InsertTicketFieldOption = z.infer<typeof insertTicketFieldOptionSchema>;
export type TicketStyleConfiguration = typeof ticketStyleConfigurations.$inferSelect;
export type InsertTicketStyleConfiguration = z.infer<typeof insertTicketStyleConfigurationSchema>;
export type TicketDefaultConfiguration = typeof ticketDefaultConfigurations.$inferSelect;
export type InsertTicketDefaultConfiguration = z.infer<typeof insertTicketDefaultConfigurationSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type TicketConsumedItem = typeof ticketConsumedItems.$inferSelect;
export type InsertTicketConsumedItem = z.infer<typeof insertTicketConsumedItemSchema>;
export type TicketPlannedItem = typeof ticketPlannedItems.$inferSelect;
export type InsertTicketPlannedItem = z.infer<typeof insertTicketPlannedItemSchema>;
export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type InsertItemAttachment = z.infer<typeof insertItemAttachmentSchema>;
export type ItemLink = typeof itemLinks.$inferSelect;
export type InsertItemLink = z.infer<typeof insertItemLinkSchema>;
export type ItemCustomerLink = typeof itemCustomerLinks.$inferSelect;
export type InsertItemCustomerLink = z.infer<typeof insertItemCustomerLinkSchema>;
export type ItemSupplierLink = typeof itemSupplierLinks.$inferSelect;
export type InsertItemSupplierLink = z.infer<typeof insertItemSupplierLinkSchema>;
export type CustomerItemMapping = typeof customerItemMappings.$inferSelect;
export type InsertCustomerItemMapping = z.infer<typeof insertCustomerItemMappingSchema>;
export type TicketTemplate = typeof ticketTemplates.$inferSelect;
export type InsertTicketTemplate = z.infer<typeof insertTicketTemplateSchema>;