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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// PUBLIC SCHEMA TABLES (Cross-tenant)
// ========================================

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tenants table for multi-tenancy
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table - JWT Authentication (public schema) - Extended with complete HR fields
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { length: 50 }).default("agent").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  profileImageUrl: varchar("profile_image_url"),

  // Dados Básicos - Basic Information
  integrationCode: varchar("integration_code", { length: 100 }),
  alternativeEmail: varchar("alternative_email"),
  cellPhone: varchar("cell_phone", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  ramal: varchar("ramal", { length: 20 }),
  timeZone: varchar("time_zone", { length: 50 }).default("America/Sao_Paulo"),
  vehicleType: varchar("vehicle_type", { length: 50 }), // Nenhum, Particular, Empresarial
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }),
  supervisorIds: text("supervisor_ids").array(),

  // Endereço - Address Information
  cep: varchar("cep", { length: 10 }),
  country: varchar("country", { length: 100 }).default("Brasil"),
  state: varchar("state", { length: 100 }),
  city: varchar("city", { length: 100 }),
  streetAddress: varchar("street_address"),
  houseType: varchar("house_type", { length: 50 }),
  houseNumber: varchar("house_number", { length: 20 }),
  complement: varchar("complement"),
  neighborhood: varchar("neighborhood", { length: 100 }),

  // Dados RH - HR Information
  employeeCode: varchar("employee_code", { length: 50 }),
  pis: varchar("pis", { length: 20 }),
  cargo: varchar("cargo", { length: 100 }),
  ctps: varchar("ctps", { length: 50 }),
  serieNumber: varchar("serie_number", { length: 20 }),
  admissionDate: date("admission_date"),
  costCenter: varchar("cost_center", { length: 100 }),

  // HR Extension Fields for TeamManagement (existing)
  position: varchar("position", { length: 100 }),
  departmentId: uuid("department_id"),
  performance: integer("performance").default(75), // Performance percentage
  lastActiveAt: timestamp("last_active_at"),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, pending
  goals: integer("goals").default(0),
  completedGoals: integer("completed_goals").default(0),

  // Employment Type for CLT vs Autonomous classification
  employmentType: varchar("employment_type", { length: 20 }).default("clt"), // 'clt' or 'autonomo'

  // System fields
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NOTE: userGroups, userGroupMemberships and departments tables are defined later in the file

// Performance Evaluations table (public schema)
export const performanceEvaluations = pgTable("performance_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  goals: jsonb("goals").default([]),
  completedGoals: integer("completed_goals").default(0),
  feedback: text("feedback"),
  evaluatorId: uuid("evaluator_id").references(() => users.id),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("performance_evaluations_tenant_user_idx").on(table.tenantId, table.userId),
  index("performance_evaluations_period_idx").on(table.periodStart, table.periodEnd),
  unique("performance_evaluations_unique_period").on(table.tenantId, table.userId, table.periodStart, table.periodEnd),
]);

// Approval Requests table (public schema)
export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  approverId: uuid("approver_id").references(() => users.id),
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

// User Sessions table (public schema)
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
  deviceType: varchar("device_type", { length: 50 }),
  browser: varchar("browser", { length: 100 }),
  operatingSystem: varchar("operating_system", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: jsonb("location"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_sessions_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_sessions_active_idx").on(table.isActive, table.lastActivity),
  index("user_sessions_token_idx").on(table.sessionToken),
]);

// User Activity Logs table (public schema)
export const userActivityLogs = pgTable("user_activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
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
  index("user_activity_logs_action_idx").on(table.action),
  index("user_activity_logs_resource_idx").on(table.resourceType, table.resourceId),
  index("user_activity_logs_created_idx").on(table.createdAt),
]);

// ========================================
// TENANT-SPECIFIC SCHEMA TABLES
// ========================================

// Customers table (Solicitantes - internal system requesters) - Data types optimized
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),                   // Standardized: 50 → 20 chars
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTenantEmail: unique("customers_tenant_email_unique").on(table.tenantId, table.email),
  // Critical indexes for performance
  tenantEmailIdx: index("customers_tenant_email_idx").on(table.tenantId, table.email),
  tenantActiveIdx: index("customers_tenant_active_idx").on(table.tenantId, table.isActive),
}));

// Tickets table - Complete with all frontend fields and proper relationships
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
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
  callerId: uuid("caller_id").references(() => customers.id),
  callerType: varchar("caller_type", { length: 50 }).default("customer"),
  customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id), // CRITICAL: Company the ticket belongs to
  beneficiaryId: uuid("beneficiary_id").references(() => favorecidos.id),
  beneficiaryType: varchar("beneficiary_type", { length: 50 }).default("customer"),
  responsibleId: uuid("responsible_id").references(() => users.id),
  assignmentGroupId: uuid("assignment_group_id").references(() => userGroups.id),
  locationId: uuid("location_id").references(() => locations.id),
  followerId: uuid("follower_id").references(() => users.id),
  followers: text("followers").array(),
  tags: text("tags").array(),
  contactType: varchar("contact_type", { length: 50 }),

  // Template/Environment fields - Added to match frontend
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

  

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tickets_tenant_status_priority_idx").on(table.tenantId, table.status, table.priority),
  index("tickets_tenant_assigned_idx").on(table.tenantId, table.responsibleId),
  index("tickets_tenant_customer_idx").on(table.tenantId, table.callerId),
  index("tickets_tenant_company_idx").on(table.tenantId, table.customerCompanyId), // CRITICAL: Index for company filtering
  index("tickets_tenant_environment_idx").on(table.tenantId, table.environment),
  index("tickets_tenant_template_idx").on(table.tenantId, table.templateName),
]);

// Ticket Messages table - Critical indexes added for performance
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id),
  content: text("content").notNull(),
  sender: varchar("sender", { length: 255 }).notNull(),
  senderType: varchar("sender_type", { length: 50 }).default("agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),  // Fixed: audit field added
}, (table) => [
  index("ticket_messages_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_messages_tenant_sender_idx").on(table.tenantId, table.senderType),
  index("ticket_messages_tenant_time_idx").on(table.tenantId, table.createdAt),
  index("ticket_messages_ticket_time_idx").on(table.tenantId, table.ticketId, table.createdAt),
]);

// Ticket Relationships table - Para relacionamentos entre tickets
export const ticketRelationships = pgTable("ticket_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  sourceTicketId: uuid("source_ticket_id").references(() => tickets.id).notNull(),
  targetTicketId: uuid("target_ticket_id").references(() => tickets.id).notNull(),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(), // 'parent', 'child', 'related', 'blocks', 'blocked_by'
  description: text("description"),
  createdById: uuid("created_by_id").references(() => users.id),
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

// Activity Logs table - Critical indexes added, audit fields completed
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),  // Fixed: audit field added
}, (table) => [
  index("activity_logs_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
  index("activity_logs_tenant_time_idx").on(table.tenantId, table.createdAt),
]);

// Locations table - Geolocation and search indexes added
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
  index("locations_geo_proximity_idx").on(table.tenantId, table.latitude, table.longitude),
]);

// Customer Companies table - Enterprise search and filtering indexes
export const customerCompanies = pgTable("customer_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  description: text("description"),
  size: varchar("size", { length: 50 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }),
  status: varchar("status", { length: 50 }).default("active"),    // CONTEXTUAL: Companies start operational "active"
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("customer_companies_tenant_name_idx").on(table.tenantId, table.name),
  index("customer_companies_tenant_status_idx").on(table.tenantId, table.status),
  index("customer_companies_tenant_tier_idx").on(table.tenantId, table.subscriptionTier),
  index("customer_companies_tenant_size_idx").on(table.tenantId, table.size),
]);

// Skills table - Apenas campos básicos que funcionam
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
  index("skills_category_active_idx").on(table.tenantId, table.category, table.isActive),
]);

// Certifications table - FIXED: tenant_id corrigido para UUID
export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }),
  description: text("description"),
  validityMonths: integer("validity_months"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("certifications_tenant_name_idx").on(table.tenantId, table.name),
  index("certifications_tenant_issuer_idx").on(table.tenantId, table.issuer),
  index("certifications_tenant_active_idx").on(table.tenantId, table.isActive),
  index("certifications_validity_idx").on(table.tenantId, table.validityMonths),
]);

// User Skills table - FIXED: alinhado com estrutura real do banco
export const userSkills = pgTable("user_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(), // FIXED: VARCHAR → UUID
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  level: integer("level").notNull(), // FIXED: VARCHAR → INTEGER alinhado com banco
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
  index("user_skills_user_skill_unique").on(table.tenantId, table.userId, table.skillId),
  index("user_skills_assessed_idx").on(table.tenantId, table.assessedAt),
]);

// Quality Certifications table - FIXED: relacionamento definido
export const qualityCertifications = pgTable("quality_certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(), // user, equipment, etc
  itemId: uuid("item_id").notNull(),
  certificationName: varchar("certification_name", { length: 255 }).notNull(),
  certificationNumber: varchar("certification_number", { length: 100 }),
  issuer: varchar("issuer", { length: 255 }),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  documentUrl: text("document_url"),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("quality_certifications_tenant_item_idx").on(table.tenantId, table.itemType, table.itemId),
  index("quality_certifications_tenant_status_idx").on(table.tenantId, table.status),
  index("quality_certifications_expiry_idx").on(table.tenantId, table.expiryDate),
]);

// User Groups table - Group management for team organization
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

// User Group Memberships table - Many-to-many relationship between users and groups
export const userGroupMemberships = pgTable("user_group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  groupId: uuid("group_id").references(() => userGroups.id, { onDelete: 'cascade' }).notNull(),
  role: varchar("role", { length: 50 }).default("member"), // member, admin, moderator
  isActive: boolean("is_active").default(true),
  addedAt: timestamp("added_at").defaultNow(),
  addedById: uuid("added_by_id").references(() => users.id),
}, (table) => [
  unique("user_group_memberships_unique").on(table.tenantId, table.userId, table.groupId),
  index("user_group_memberships_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_group_memberships_tenant_group_idx").on(table.tenantId, table.groupId),
]);

// Favorecidos table (Brazilian beneficiaries) - Nomenclature standardized and constraints added
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Basic Information
  firstName: varchar("first_name", { length: 255 }),       // Standardized for consistency
  lastName: varchar("last_name", { length: 255 }),         // Standardized for consistency
  name: varchar("name", { length: 255 }).notNull(),        // Full name or display name
  email: varchar("email", { length: 255 }),                // Already English ✓
  phone: varchar("phone", { length: 20 }),                 // Standardized: telefone → phone
  cellPhone: varchar("cell_phone", { length: 20 }),        // Standardized: celular → cell_phone
  
  // Brazilian Legal Documents
  cpf: varchar("cpf", { length: 14 }),                     // Keep Brazilian legal term ✓
  cnpj: varchar("cnpj", { length: 18 }),                   // Keep Brazilian legal term ✓
  rg: varchar("rg", { length: 20 }),                       // Keep Brazilian legal term ✓
  
  // Address Information
  address: text("address"),                                 // Standardized: endereco → address
  city: varchar("city", { length: 100 }),                  // Standardized: cidade → city
  state: varchar("state", { length: 2 }),                  // Standardized: estado → state
  zipCode: varchar("zip_code", { length: 10 }),            // Standardized: cep → zip_code
  
  // Contact Information
  contactPerson: varchar("contact_person", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  
  // Integration and Customer Relationship
  integrationCode: varchar("integration_code", { length: 100 }), // Standardized: codigo_integracao → integration_code
  customerId: uuid("customer_id").references(() => customers.id), // Relationship with customer
  customerCode: varchar("customer_code", { length: 100 }),
  
  // Birth Date for benefits
  birthDate: date("birth_date"),
  
  // Additional Information
  notes: text("notes"),                                     // Standardized: observacoes → notes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTenantEmail: unique("favorecidos_tenant_email_unique").on(table.tenantId, table.email),
  uniqueTenantCpf: unique("favorecidos_tenant_cpf_unique").on(table.tenantId, table.cpf),
  uniqueTenantCnpj: unique("favorecidos_tenant_cnpj_unique").on(table.tenantId, table.cnpj),
  uniqueTenantRg: unique("favorecidos_tenant_rg_unique").on(table.tenantId, table.rg),
  // Critical indexes for Brazilian compliance
  tenantCpfIdx: index("favorecidos_tenant_cpf_idx").on(table.tenantId, table.cpf),
  tenantActiveIdx: index("favorecidos_tenant_active_idx").on(table.tenantId, table.isActive),
}));

// Projects table - Foreign keys and arrays optimized with critical indexes
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planning"), // CONTEXTUAL: Project workflow starts "planning"
  priority: varchar("priority", { length: 20 }).default("medium"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  managerId: uuid("manager_id").references(() => users.id),    // Fixed: added FK reference
  clientId: uuid("client_id").references(() => customers.id),  // Fixed: added FK reference
  teamMemberIds: uuid("team_member_ids").array().default([]),  // Fixed: JSONB → native array
  tags: text("tags").array(),
  customFields: jsonb("custom_fields"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("projects_tenant_status_idx").on(table.tenantId, table.status),
  index("projects_tenant_manager_idx").on(table.tenantId, table.managerId),
  index("projects_tenant_deadline_idx").on(table.tenantId, table.endDate),
]);

// Project Actions table - Arrays and foreign keys optimized
export const projectActions = pgTable("project_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),  // CONTEXTUAL: Actions start "pending" execution
  priority: varchar("priority", { length: 20 }).default("medium"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  scheduledDate: date("scheduled_date"),
  responsibleId: uuid("responsible_id").references(() => users.id),      // Fixed: added FK reference
  responsibleIds: uuid("responsible_ids").array().default([]),          // Fixed: JSONB → native array
  dependsOnActionIds: uuid("depends_on_action_ids").array().default([]), // Fixed: JSONB → native array
  blockedByActionIds: uuid("blocked_by_action_ids").array().default([]), // Fixed: JSONB → native array
  relatedTicketId: uuid("related_ticket_id").references(() => tickets.id), // Fixed: added FK reference
  canConvertToTicket: boolean("can_convert_to_ticket").default(false),
  ticketConversionRules: jsonb("ticket_conversion_rules"),
  completedAt: timestamp("completed_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("project_actions_tenant_project_idx").on(table.tenantId, table.projectId),
  index("project_actions_tenant_status_idx").on(table.tenantId, table.status),
  index("project_actions_tenant_assigned_idx").on(table.tenantId, table.responsibleId),
  index("project_actions_project_status_idx").on(table.tenantId, table.projectId, table.status),
  index("project_actions_type_priority_idx").on(table.tenantId, table.type, table.priority),
  index("project_actions_scheduled_idx").on(table.tenantId, table.scheduledDate),
]);

// ========================================
// ZOD SCHEMAS FOR VALIDATION
// ========================================

export const insertUserSchema = createInsertSchema(users);
export const insertTenantSchema = createInsertSchema(tenants);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertTicketSchema = createInsertSchema(tickets);
export const insertTicketMessageSchema = createInsertSchema(ticketMessages);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertLocationSchema = createInsertSchema(locations);
export const insertCustomerCompanySchema = createInsertSchema(customerCompanies);
// Schema manual para skills - evita referências a campos inexistentes
export const insertSkillSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  suggestedCertification: z.string().optional(),
  certificationValidityMonths: z.number().optional(),
  observations: z.string().optional(),
  scaleOptions: z.array(z.object({
    level: z.number(),
    label: z.string(),
    description: z.string()
  })).optional(),
  isActive: z.boolean().default(true),
  tenantId: z.string().optional(),
});
export const insertCertificationSchema = createInsertSchema(certifications);
export const insertUserSkillSchema = createInsertSchema(userSkills);
export const insertUserGroupSchema = createInsertSchema(userGroups);
export const insertUserGroupMembershipSchema = createInsertSchema(userGroupMemberships);
export const insertFavorecidoSchema = createInsertSchema(favorecidos);
export const insertProjectSchema = createInsertSchema(projects);
export const insertProjectActionSchema = createInsertSchema(projectActions);

// ========================================
// TICKET HIERARCHICAL CATEGORIES (CATEGORIA → SUBCATEGORIA → AÇÃO)
// ========================================

// Ticket Categories - Nível 1 da hierarquia
export const ticketCategories = pgTable("ticket_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id"), // Nullable para permitir configurações globais
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 50 }).notNull(), // Código único para integração
  color: varchar("color", { length: 7 }).default("#3b82f6"), // Cor hexadecimal
  icon: varchar("icon", { length: 50 }), // Nome do ícone Lucide
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false), // Indica se é categoria do sistema
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Constraint de unicidade hierárquica: tenant + customer + code
  unique("ticket_categories_tenant_customer_code_unique").on(table.tenantId, table.customerId, table.code),
  // Indexes para performance
  index("ticket_categories_tenant_idx").on(table.tenantId),
  index("ticket_categories_tenant_customer_idx").on(table.tenantId, table.customerId),
  index("ticket_categories_active_idx").on(table.tenantId, table.isActive),
]);

// Ticket Subcategories - Nível 2 da hierarquia
export const ticketSubcategories = pgTable("ticket_subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id"), // Nullable para permitir configurações globais
  categoryId: uuid("category_id").notNull().references(() => ticketCategories.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 50 }).notNull(), // Código único dentro da categoria
  color: varchar("color", { length: 7 }), // Se null, herda da categoria pai
  icon: varchar("icon", { length: 50 }), // Se null, herda da categoria pai
  sortOrder: integer("sort_order").default(0),
  slaHours: integer("sla_hours"), // SLA específico da subcategoria
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Constraint de unicidade: categoria + code
  unique("ticket_subcategories_category_code_unique").on(table.categoryId, table.code),
  // Indexes para performance
  index("ticket_subcategories_tenant_idx").on(table.tenantId),
  index("ticket_subcategories_category_idx").on(table.categoryId),
  index("ticket_subcategories_tenant_customer_idx").on(table.tenantId, table.customerId),
  index("ticket_subcategories_active_idx").on(table.tenantId, table.isActive),
]);

// Ticket Actions - Nível 3 da hierarquia (ações específicas)
export const ticketActions = pgTable("ticket_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id"), // Nullable para permitir configurações globais
  subcategoryId: uuid("subcategory_id").notNull().references(() => ticketSubcategories.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 50 }).notNull(), // Código único dentro da subcategoria
  actionType: varchar("action_type", { length: 50 }).default("standard"), // standard, escalation, resolution, investigation
  estimatedHours: integer("estimated_hours"), // Tempo estimado para a ação
  requiredSkills: text("required_skills").array(), // Habilidades necessárias
  templates: jsonb("templates"), // Templates de resposta ou documentação
  automationRules: jsonb("automation_rules"), // Regras de automação específicas
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Constraint de unicidade: subcategoria + code
  unique("ticket_actions_subcategory_code_unique").on(table.subcategoryId, table.code),
  // Indexes para performance
  index("ticket_actions_tenant_idx").on(table.tenantId),
  index("ticket_actions_subcategory_idx").on(table.subcategoryId),
  index("ticket_actions_tenant_customer_idx").on(table.tenantId, table.customerId),
  index("ticket_actions_type_idx").on(table.actionType),
  index("ticket_actions_active_idx").on(table.tenantId, table.isActive),
]);

// Hierarchical Categories Schemas (after table definitions)
export const insertTicketCategorySchema = createInsertSchema(ticketCategories);
export const insertTicketSubcategorySchema = createInsertSchema(ticketSubcategories);
export const insertTicketActionSchema = createInsertSchema(ticketActions);

export type TicketCategory = typeof ticketCategories.$inferSelect;
export type TicketSubcategory = typeof ticketSubcategories.$inferSelect;
export type TicketAction = typeof ticketActions.$inferSelect;
export type InsertTicketCategory = typeof ticketCategories.$inferInsert;
export type InsertTicketSubcategory = typeof ticketSubcategories.$inferInsert;
export type InsertTicketAction = typeof ticketActions.$inferInsert;

// ========================================
// MULTILOCATION TABLES (ENTERPRISE INTERNATIONAL SUPPORT)
// ========================================

// Market Localization Configuration - Estratégia híbrida para suporte internacional
export const marketLocalization = pgTable("market_localization", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Market Configuration
  marketCode: varchar("market_code", { length: 10 }).notNull(), // BR, US, EU, etc.
  countryCode: varchar("country_code", { length: 2 }).notNull(), // ISO 3166-1
  languageCode: varchar("language_code", { length: 10 }).notNull(), // pt-BR, en-US, etc.
  currencyCode: varchar("currency_code", { length: 3 }).notNull(), // BRL, USD, EUR

  // Legal/Cultural Field Mapping (mantém CPF, CNPJ, RG + aliases internacionais)
  legalFieldMappings: jsonb("legal_field_mappings").default({}).notNull(),
  validationRules: jsonb("validation_rules").default({}).notNull(),
  displayConfig: jsonb("display_config").default({}).notNull(),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTenantMarket: unique("market_localization_tenant_market_unique").on(table.tenantId, table.marketCode),
  tenantActiveIdx: index("market_localization_tenant_active_idx").on(table.tenantId, table.isActive),
}));

// Field Alias Mapping - Aliases internacionais para campos brasileiros (cpf → tax_id)
export const fieldAliasMapping = pgTable("field_alias_mapping", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),  sourceTable: varchar("source_table", { length: 100 }).notNull(), // favorecidos
  sourceField: varchar("source_field", { length: 100 }).notNull(), // cpf, cnpj, rg
  aliasField: varchar("alias_field", { length: 100 }).notNull(), // tax_id, business_tax_id
  aliasDisplayName: varchar("alias_display_name", { length: 200 }).notNull(),
  marketCode: varchar("market_code", { length: 10 }).notNull(),
  validationRules: jsonb("validation_rules").default({}).notNull(),
  transformationRules: jsonb("transformation_rules").default({}).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("field_alias_tenant_table_idx").on(table.tenantId, table.sourceTable),
  index("field_alias_market_code_idx").on(table.marketCode),
]);

// Localization Context - Contexto de localização para forms e displays
export const localizationContext = pgTable("localization_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contextKey: varchar("context_key", { length: 100 }).notNull(), // "favorecidos_form"
  contextType: varchar("context_type", { length: 50 }).notNull(), // "form", "display"
  marketCode: varchar("market_code", { length: 10 }).notNull(),
  labels: jsonb("labels").default({}).notNull(), // Labels por idioma
  placeholders: jsonb("placeholders").default({}).notNull(),
  helpTexts: jsonb("help_texts").default({}).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("localization_context_tenant_key_idx").on(table.tenantId, table.contextKey),
  index("localization_context_market_idx").on(table.marketCode),
]);

// ========================================
// HOLIDAYS SYSTEM (CONTROLE DE JORNADAS) 
// ========================================

// Holidays table for multilocation journey control system
export const holidays = pgTable("holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  date: date("date").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'national', 'regional', 'corporate', 'optional'
  countryCode: varchar("country_code", { length: 3 }).notNull(), // ISO country codes (BRA, USA, etc.)
  regionCode: varchar("region_code", { length: 10 }), // State/Province codes (SP, CA, etc.)
  isRecurring: boolean("is_recurring").default(false),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("holidays_tenant_date_idx").on(table.tenantId, table.date),
  index("holidays_tenant_country_idx").on(table.tenantId, table.countryCode),
  index("holidays_tenant_type_idx").on(table.tenantId, table.type),
  index("holidays_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Timecard/Jornada tables - ENHANCED FOR CLT COMPLIANCE
export const timecardEntries = pgTable("timecard_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // 🔴 CLT COMPLIANCE: NSR (Número Sequencial de Registro) - OBRIGATÓRIO
  nsr: bigint("nsr", { mode: "number" }).notNull(), // Sequencial único por tenant
  
  // Timestamps básicos
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  breakStart: timestamp("break_start"),
  breakEnd: timestamp("break_end"),
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }),
  notes: text("notes"),
  location: text("location"),
  
  // 🔴 CLT COMPLIANCE: Controle de integridade e auditoria
  isManualEntry: boolean("is_manual_entry").default(false),
  approvedBy: uuid("approved_by").references(() => users.id),
  status: varchar("status", { length: 20 }).default("pending"),
  
  // 🔴 CLT COMPLIANCE: Hash de integridade - OBRIGATÓRIO
  recordHash: varchar("record_hash", { length: 64 }).notNull(), // SHA-256 hash do registro
  previousRecordHash: varchar("previous_record_hash", { length: 64 }), // Hash do registro anterior (blockchain-like)
  
  // 🔴 CLT COMPLIANCE: Assinatura digital - OBRIGATÓRIO
  digitalSignature: text("digital_signature"), // Assinatura digital do registro
  signatureTimestamp: timestamp("signature_timestamp"),
  signedBy: uuid("signed_by").references(() => users.id),
  
  // 🔴 CLT COMPLIANCE: Metadados para auditoria - OBRIGATÓRIO
  deviceInfo: jsonb("device_info"), // Informações do dispositivo usado
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6
  geoLocation: jsonb("geo_location"), // Coordenadas GPS do registro
  modificationHistory: jsonb("modification_history").default([]), // Histórico de alterações
  
  // 🔴 CLT COMPLIANCE: Controle de alterações - OBRIGATÓRIO
  originalRecordHash: varchar("original_record_hash", { length: 64 }), // Hash original (antes de alterações)
  modifiedBy: uuid("modified_by").references(() => users.id),
  modificationReason: text("modification_reason"),
  
  // Timestamps de auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // 🔴 CLT COMPLIANCE: Soft delete para preservar histórico - OBRIGATÓRIO
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  deletedBy: uuid("deleted_by").references(() => users.id),
  deletionReason: text("deletion_reason"),
}, (table) => [
  // Índices para performance e compliance
  index("timecard_entries_tenant_nsr_idx").on(table.tenantId, table.nsr),
  index("timecard_entries_tenant_user_date_idx").on(table.tenantId, table.userId, table.createdAt),
  index("timecard_entries_hash_idx").on(table.recordHash),
  index("timecard_entries_signature_idx").on(table.digitalSignature),
  index("timecard_entries_device_idx").on(table.tenantId, table.deviceInfo),
  index("timecard_entries_audit_idx").on(table.tenantId, table.modifiedBy, table.updatedAt),
  unique("timecard_entries_tenant_nsr_unique").on(table.tenantId, table.nsr),
]);

// Work Schedules - Escalas de Trabalho
export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  scheduleName: varchar("schedule_name", { length: 100 }).notNull(), // Campo real do banco
  workDays: jsonb("work_days").notNull(), // JSONB conforme migration
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakStart: time("break_start"),
  breakEnd: time("break_end"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Absence Requests - Solicitações de Ausência  
export const absenceRequests = pgTable("absence_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  absenceType: varchar("absence_type", { length: 30 }).notNull(), // 'vacation', 'sick_leave', 'maternity', etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected', 'cancelled'
  medicalCertificate: text("medical_certificate"), // URL or file path
  coverUserId: uuid("cover_user_id").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Templates - Templates de Escala
export const scheduleTemplates = pgTable("schedule_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  scheduleType: varchar("schedule_type", { length: 20 }).notNull(),
  workDays: jsonb("work_days").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakStart: time("break_start"),
  breakEnd: time("break_end"),
  flexibilityWindow: integer("flexibility_window").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hour Bank - Banco de Horas
export const hourBankEntries = pgTable("hour_bank_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  regularHours: decimal("regular_hours", { precision: 4, scale: 2 }).default("0"),
  overtimeHours: decimal("overtime_hours", { precision: 4, scale: 2 }).default("0"),
  compensatedHours: decimal("compensated_hours", { precision: 4, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 5, scale: 2 }).default("0"),
  type: varchar("type", { length: 20 }).notNull(), // 'credit', 'debit', 'compensation'
  description: text("description"),
  timecardEntryId: uuid("timecard_entry_id").references(() => timecardEntries.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Approval Groups - Grupos de Aprovação
export const approvalGroups = pgTable("approval_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("approval_groups_tenant_idx").on(table.tenantId),
  index("approval_groups_active_idx").on(table.tenantId, table.isActive),
]);

// Approval Group Members - Membros dos Grupos de Aprovação
export const approvalGroupMembers = pgTable("approval_group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  groupId: uuid("group_id").notNull().references(() => approvalGroups.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).default("member"), // 'member', 'approver'
  isActive: boolean("is_active").default(true),
  addedBy: uuid("added_by_id").references(() => users.id),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("approval_group_members_group_idx").on(table.groupId),
  index("approval_group_members_user_idx").on(table.userId),
  index("approval_group_members_tenant_idx").on(table.tenantId),
  unique("approval_group_members_unique").on(table.groupId, table.userId),
]);

// Timecard Approval Settings - Configurações de Aprovação de Jornada
export const timecardApprovalSettings = pgTable("timecard_approval_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Tipo de aprovação
  approvalType: varchar("approval_type", { length: 20 }).notNull(), // 'automatic', 'manual'
  
  // Configurações de aprovação automática
  autoApproveComplete: boolean("auto_approve_complete").default(false), // Auto aprovar registros completos
  autoApproveAfterHours: integer("auto_approve_after_hours").default(24), // Horas para auto aprovar
  
  // Configurações de aprovação manual
  requireApprovalFor: jsonb("require_approval_for").default([]), // ['inconsistencies', 'overtime', 'absences', 'manual_entries', 'all']
  
  // Aprovadores
  defaultApprovers: text("default_approvers").array(), // Lista de user IDs
  approvalGroupId: uuid("approval_group_id").references(() => approvalGroups.id),
  
  // Configurações de ticket automático
  createAutoTickets: boolean("create_auto_tickets").default(false),
  ticketRecurrence: varchar("ticket_recurrence", { length: 20 }).default("weekly"), // 'daily', 'weekly', 'monthly'
  ticketDay: integer("ticket_day").default(1), // Dia da semana/mês
  ticketTime: time("ticket_time").default("09:00"), // Hora para criar o ticket
  
  // Configurações avançadas
  escalationRules: jsonb("escalation_rules").default({}),
  notificationSettings: jsonb("notification_settings").default({}),
  
  // Auditoria
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecard_approval_settings_tenant_idx").on(table.tenantId),
  index("timecard_approval_settings_active_idx").on(table.tenantId, table.isActive),
  unique("timecard_approval_settings_tenant_unique").on(table.tenantId),
]);

// Timecard Approval History - Histórico de Aprovações
export const timecardApprovalHistory = pgTable("timecard_approval_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  timecardEntryId: uuid("timecard_entry_id").notNull().references(() => timecardEntries.id),
  
  // Dados da aprovação
  approvalStatus: varchar("approval_status", { length: 20 }).notNull(), // 'pending', 'approved', 'rejected'
  approvedBy: uuid("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  rejectionReason: text("rejection_reason"),
  comments: text("comments"),
  
  // Tipo de aprovação
  approvalMethod: varchar("approval_method", { length: 20 }).notNull(), // 'automatic', 'manual', 'ticket'
  ticketId: uuid("ticket_id"), // Referência ao ticket se aprovado via ticket
  
  // Dados do registro na aprovação
  snapshotData: jsonb("snapshot_data"), // Snapshot dos dados no momento da aprovação
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timecard_approval_history_entry_idx").on(table.timecardEntryId),
  index("timecard_approval_history_approver_idx").on(table.approvedBy),
  index("timecard_approval_history_tenant_date_idx").on(table.tenantId, table.approvalDate),
  index("timecard_approval_history_status_idx").on(table.tenantId, table.approvalStatus),
]);

// Flexible Work Arrangements
export const flexibleWorkArrangements = pgTable("flexible_work_arrangements", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  arrangementType: varchar("arrangement_type", { length: 30 }).notNull(), // 'remote_work', 'flexible_hours', 'compressed_week'
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  workingHours: text("working_hours"), // JSON with flexible schedule
  workLocation: varchar("work_location", { length: 100 }),
  justification: text("justification").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift Swap Requests - Solicitações de Troca de Turno
export const shiftSwapRequests = pgTable("shift_swap_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  requesterId: uuid("requester_id").notNull().references(() => users.id),
  targetUserId: uuid("target_user_id").notNull().references(() => users.id),
  originalShiftDate: date("original_shift_date").notNull(),
  proposedShiftDate: date("proposed_shift_date").notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========================================
// CLT COMPLIANCE TABLES - OBRIGATÓRIAS
// ========================================

// 🔴 CLT COMPLIANCE: Sequência NSR por tenant - OBRIGATÓRIO
export const nsrSequences = pgTable("nsr_sequences", {
  tenantId: varchar("tenant_id", { length: 36 }).primaryKey(),
  currentNsr: bigint("current_nsr", { mode: "number" }).default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Action Number Sequences - Auto-generated unique numbers for internal actions
export const actionNumberSequences = pgTable("action_number_sequences", {
  tenantId: varchar("tenant_id", { length: 36 }).primaryKey(),
  currentNumber: bigint("current_number", { mode: "number" }).default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// 🔴 CLT COMPLIANCE: Backup automático de registros - OBRIGATÓRIO
export const timecardBackups = pgTable("timecard_backups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  backupDate: date("backup_date").notNull(),
  recordCount: integer("record_count").notNull(),
  backupHash: varchar("backup_hash", { length: 64 }).notNull(), // Hash do backup completo
  backupSize: bigint("backup_size", { mode: "number" }).notNull(), // Tamanho em bytes
  backupLocation: text("backup_location").notNull(), // Caminho/URL do backup
  compressionType: varchar("compression_type", { length: 20 }).default("gzip"),
  encryptionType: varchar("encryption_type", { length: 20 }).default("AES-256"),
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("timecard_backups_tenant_date_idx").on(table.tenantId, table.backupDate),
  index("timecard_backups_verification_idx").on(table.tenantId, table.isVerified),
  unique("timecard_backups_tenant_date_unique").on(table.tenantId, table.backupDate),
]);

// 🔴 CLT COMPLIANCE: Trilha de auditoria completa - OBRIGATÓRIO
export const timecardAuditLog = pgTable("timecard_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  timecardEntryId: uuid("timecard_entry_id").notNull(),
  nsr: bigint("nsr", { mode: "number" }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
  performedBy: uuid("performed_by").notNull().references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  
  // Dados antes e depois da alteração
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  
  // Contexto da alteração
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  
  // Validação e integridade
  auditHash: varchar("audit_hash", { length: 64 }).notNull(),
  isSystemGenerated: boolean("is_system_generated").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("timecard_audit_tenant_entry_idx").on(table.tenantId, table.timecardEntryId),
  index("timecard_audit_tenant_user_idx").on(table.tenantId, table.performedBy),
  index("timecard_audit_tenant_date_idx").on(table.tenantId, table.performedAt),
  index("timecard_audit_nsr_idx").on(table.tenantId, table.nsr),
  index("timecard_audit_action_idx").on(table.tenantId, table.action),
]);

// 🔴 CLT COMPLIANCE: Relatórios de fiscalização - OBRIGATÓRIO
export const complianceReports = pgTable("compliance_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(), // 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'AUDIT'
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  
  // Estatísticas do relatório
  totalRecords: integer("total_records").notNull(),
  totalEmployees: integer("total_employees").notNull(),
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }).notNull(),
  overtimeHours: decimal("overtime_hours", { precision: 10, scale: 2 }).default("0"),
  
  // Hash e validação
  reportHash: varchar("report_hash", { length: 64 }).notNull(),
  reportContent: jsonb("report_content").notNull(), // Dados completos do relatório
  
  // Assinatura digital do relatório
  digitalSignature: text("digital_signature"),
  signedBy: uuid("signed_by").references(() => users.id),
  signedAt: timestamp("signed_at"),
  
  // Metadados
  generatedBy: uuid("generated_by").notNull().references(() => users.id),
  isSubmittedToAuthorities: boolean("is_submitted_to_authorities").default(false),
  submissionDate: timestamp("submission_date"),
  submissionProtocol: varchar("submission_protocol", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("compliance_reports_tenant_type_idx").on(table.tenantId, table.reportType),
  index("compliance_reports_tenant_period_idx").on(table.tenantId, table.periodStart, table.periodEnd),
  index("compliance_reports_submission_idx").on(table.tenantId, table.isSubmittedToAuthorities),
  unique("compliance_reports_tenant_period_type_unique").on(table.tenantId, table.reportType, table.periodStart, table.periodEnd),
]);

// 🔴 CLT COMPLIANCE: Chaves de assinatura digital - OBRIGATÓRIO
export const digitalSignatureKeys = pgTable("digital_signature_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  keyName: varchar("key_name", { length: 100 }).notNull(),
  publicKey: text("public_key").notNull(),
  privateKeyHash: varchar("private_key_hash", { length: 64 }).notNull(), // Hash da chave privada (não a chave em si)
  keyAlgorithm: varchar("key_algorithm", { length: 20 }).default("RSA-2048").notNull(),
  
  // Controle de validade
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  
  // Auditoria das chaves
  createdBy: uuid("created_by").notNull().references(() => users.id),
  revokedBy: uuid("revoked_by").references(() => users.id),
  revokedAt: timestamp("revoked_at"),
  revocationReason: text("revocation_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("digital_signature_keys_tenant_active_idx").on(table.tenantId, table.isActive),
  index("digital_signature_keys_expiry_idx").on(table.tenantId, table.expiresAt),
  unique("digital_signature_keys_tenant_name_unique").on(table.tenantId, table.keyName),
]);

// ========================================
// TICKET METADATA CONFIGURATION SYSTEM
// ========================================

// Main table for field configurations (priority, status, category, etc.)
// HIERARCHICAL SUPPORT: customerId = NULL for global tenant configs, specific UUID for client-specific configs
export const ticketFieldConfigurations = pgTable("ticket_field_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }), // NULL = global, UUID = client-specific
  fieldName: varchar("field_name", { length: 50 }).notNull(), // 'priority', 'status', 'category', 'location'
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  fieldType: varchar("field_type", { length: 30 }).notNull(), // 'select', 'multiselect', 'text'
  isRequired: boolean("is_required").default(false),
  isSystemField: boolean("is_system_field").default(false), // Essential system fields
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint updated for hierarchical support
  unique("ticket_field_configs_tenant_customer_field_unique").on(table.tenantId, table.customerId, table.fieldName),
  index("ticket_field_configs_tenant_active_idx").on(table.tenantId, table.isActive),
  index("ticket_field_configs_tenant_type_idx").on(table.tenantId, table.fieldType),
  // New hierarchical indexes for optimal resolution performance
  index("ticket_field_configs_hierarchical_idx").on(table.tenantId, table.customerId, table.fieldName),
  index("ticket_field_configs_customer_idx").on(table.tenantId, table.customerId),
]);

// Options for select fields (values for dropdowns)
// HIERARCHICAL SUPPORT: customerId = NULL for global options, specific UUID for client-specific options
export const ticketFieldOptions = pgTable("ticket_field_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }), // NULL = global, UUID = client-specific
  fieldConfigId: uuid("field_config_id").references(() => ticketFieldConfigurations.id, { onDelete: "cascade" }),
  optionValue: varchar("option_value", { length: 50 }).notNull(),
  displayLabel: varchar("display_label", { length: 100 }).notNull(),
  description: text("description"),
  colorHex: varchar("color_hex", { length: 7 }), // #FF5733 for colored badges
  iconName: varchar("icon_name", { length: 50 }), // lucide-react icon names
  cssClasses: text("css_classes"), // Custom CSS classes
  sortOrder: integer("sort_order").default(0),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  slaHours: integer("sla_hours"), // For priorities
  escalationRules: jsonb("escalation_rules"), // Escalation rules
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Updated unique constraint for hierarchical support
  unique("ticket_field_options_tenant_customer_config_value_unique").on(table.tenantId, table.customerId, table.fieldConfigId, table.optionValue),
  index("ticket_field_options_tenant_config_idx").on(table.tenantId, table.fieldConfigId),
  index("ticket_field_options_tenant_active_idx").on(table.tenantId, table.isActive),
  // New hierarchical indexes for optimal resolution performance
  index("ticket_field_options_hierarchical_idx").on(table.tenantId, table.customerId, table.fieldConfigId),
  index("ticket_field_options_customer_idx").on(table.tenantId, table.customerId),
]);

// Style configurations for colors and theming
// HIERARCHICAL SUPPORT: customerId = NULL for global styles, specific UUID for client-specific styles
export const ticketStyleConfigurations = pgTable("ticket_style_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }), // NULL = global, UUID = client-specific
  styleName: varchar("style_name", { length: 50 }).notNull(), // 'priority_colors', 'status_colors'
  fieldName: varchar("field_name", { length: 50 }).notNull(),
  styleMapping: jsonb("style_mapping").notNull(), // {"high": {"bg": "#FF5733", "text": "#FFFFFF"}}
  darkModeMapping: jsonb("dark_mode_mapping"), // Colors for dark mode
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Updated unique constraint for hierarchical support
  unique("ticket_style_configs_tenant_customer_style_field_unique").on(table.tenantId, table.customerId, table.styleName, table.fieldName),
  index("ticket_style_configs_tenant_field_idx").on(table.tenantId, table.fieldName),
  // New hierarchical indexes for optimal resolution performance
  index("ticket_style_configs_hierarchical_idx").on(table.tenantId, table.customerId, table.fieldName),
  index("ticket_style_configs_customer_idx").on(table.tenantId, table.customerId),
]);

// Default configurations per tenant
// HIERARCHICAL SUPPORT: customerId = NULL for global defaults, specific UUID for client-specific defaults
export const ticketDefaultConfigurations = pgTable("ticket_default_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }), // NULL = global, UUID = client-specific
  fieldName: varchar("field_name", { length: 50 }).notNull(),
  defaultValue: varchar("default_value", { length: 100 }).notNull(),
  applyToNewTickets: boolean("apply_to_new_tickets").default(true),
  applyToImportedTickets: boolean("apply_to_imported_tickets").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Updated unique constraint for hierarchical support
  unique("ticket_default_configs_tenant_customer_field_unique").on(table.tenantId, table.customerId, table.fieldName),
  index("ticket_default_configs_tenant_idx").on(table.tenantId),
  // New hierarchical indexes for optimal resolution performance
  index("ticket_default_configs_hierarchical_idx").on(table.tenantId, table.customerId, table.fieldName),
  index("ticket_default_configs_customer_idx").on(table.tenantId, table.customerId),
]);

// ===========================
// NOTIFICATIONS SYSTEM TABLES
// ===========================

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // ticket_assignment, sla_breach, etc.
  severity: varchar('severity', { length: 20 }).notNull().default('info'), // info, warning, error, critical
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata').default({}),
  channels: jsonb('channels').notNull().default(['in_app']), // ['in_app', 'email', 'sms', 'push']
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, sent, delivered, failed
  scheduledAt: timestamp('scheduled_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  readAt: timestamp('read_at'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: varchar('related_entity_id', { length: 36 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  channels: jsonb('channels').notNull().default(['in_app']),
  enabled: boolean('enabled').notNull().default(true),
  scheduleSettings: jsonb('schedule_settings').default({}),
  filters: jsonb('filters').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const notificationTemplates = pgTable('notification_templates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  bodyTemplate: text('body_template').notNull(),
  variables: jsonb('variables').default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const notificationLogs = pgTable('notification_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  notificationId: varchar('notification_id', { length: 36 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  response: jsonb('response'),
  error: text('error'),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Notification indexes for performance - Commented temporarily for stability
// export const notificationIndexes = [
//   index('idx_notifications_tenant_user').on(notifications.tenantId, notifications.userId),
//   index('idx_notifications_tenant_status').on(notifications.tenantId, notifications.status),
//   index('idx_notifications_tenant_type').on(notifications.tenantId, notifications.type),
//   index('idx_notifications_tenant_severity').on(notifications.tenantId, notifications.severity),
//   index('idx_notifications_scheduled').on(notifications.scheduledAt),
//   index('idx_notifications_related_entity').on(notifications.relatedEntityType, notifications.relatedEntityId),
//   index('idx_notification_preferences_tenant_user').on(notificationPreferences.tenantId, notificationPreferences.userId),
//   index('idx_notification_preferences_tenant_type').on(notificationPreferences.tenantId, notificationPreferences.notificationType),
//   index('idx_notification_templates_tenant_type').on(notificationTemplates.tenantId, notificationTemplates.type),
//   index('idx_notification_logs_tenant_notification').on(notificationLogs.tenantId, notificationLogs.notificationId)
// ];

export const insertMarketLocalizationSchema = createInsertSchema(marketLocalization);
export const insertFieldAliasMappingSchema = createInsertSchema(fieldAliasMapping);
export const insertLocalizationContextSchema = createInsertSchema(localizationContext);
export const insertHolidaySchema = createInsertSchema(holidays);

// Ticket metadata schemas
export const insertTicketFieldConfigurationSchema = createInsertSchema(ticketFieldConfigurations);
export const insertTicketFieldOptionSchema = createInsertSchema(ticketFieldOptions);
export const insertTicketStyleConfigurationSchema = createInsertSchema(ticketStyleConfigurations);
export const insertTicketDefaultConfigurationSchema = createInsertSchema(ticketDefaultConfigurations);

// ========================================
// TYPE EXPORTS
// ========================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

export type CustomerCompany = typeof customerCompanies.$inferSelect;
export type InsertCustomerCompany = typeof customerCompanies.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = typeof userSkills.$inferInsert;

export type Favorecido = typeof favorecidos.$inferSelect;
export type InsertFavorecido = typeof favorecidos.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type ProjectAction = typeof projectActions.$inferSelect;
export type InsertProjectAction = typeof projectActions.$inferInsert;

export type MarketLocalization = typeof marketLocalization.$inferSelect;
export type InsertMarketLocalization = typeof marketLocalization.$inferInsert;

export type FieldAliasMapping = typeof fieldAliasMapping.$inferSelect;
export type InsertFieldAliasMapping = typeof fieldAliasMapping.$inferInsert;

export type LocalizationContext = typeof localizationContext.$inferSelect;
export type InsertLocalizationContext = typeof localizationContext.$inferInsert;

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// Timecard and Approval Types
export type TimecardEntry = typeof timecardEntries.$inferSelect;
export type InsertTimecardEntry = typeof timecardEntries.$inferInsert;

export type WorkSchedule = typeof workSchedules.$inferSelect;
export type InsertWorkSchedule = typeof workSchedules.$inferInsert;

export type ApprovalGroup = typeof approvalGroups.$inferSelect;
export type InsertApprovalGroup = typeof approvalGroups.$inferInsert;

export type ApprovalGroupMember = typeof approvalGroupMembers.$inferSelect;
export type InsertApprovalGroupMember = typeof approvalGroupMembers.$inferInsert;

export type TimecardApprovalSettings = typeof timecardApprovalSettings.$inferSelect;
export type InsertTimecardApprovalSettings = typeof timecardApprovalSettings.$inferInsert;

export type TimecardApprovalHistory = typeof timecardApprovalHistory.$inferSelect;
export type InsertTimecardApprovalHistory = typeof timecardApprovalHistory.$inferInsert;



// ========================================
// AGENDA/SCHEDULE MANAGEMENT TABLES
// ========================================

// Activity Types for scheduling
export const activityTypes = pgTable("activity_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull(), // Hex color
  duration: integer("duration").notNull(), // Duration in minutes
  category: varchar("category", { length: 50 }).notNull(), // visita_tecnica, instalacao, manutencao, suporte
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Schedules/Agenda
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  agentId: uuid("agent_id").notNull(), // References users table
  customerId: uuid("customer_id"), // Optional - references customers
  activityTypeId: uuid("activity_type_id").references(() => activityTypes.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDateTime: timestamp("start_datetime").notNull(),
  endDateTime: timestamp("end_datetime").notNull(),
  duration: integer("duration").notNull(), // Duration in minutes
  status: varchar("status", { length: 20 }).default("scheduled").notNull(), // scheduled, in_progress, completed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium").notNull(), // low, medium, high, urgent
  locationAddress: text("location_address"),
  coordinates: jsonb("coordinates"), // {lat: number, lng: number}
  internalNotes: text("internal_notes"),
  clientNotes: text("client_notes"),
  estimatedTravelTime: integer("estimated_travel_time"), // Minutes
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: jsonb("recurring_pattern"), // {type: 'daily'|'weekly'|'monthly', interval: number}
  parentScheduleId: uuid("parent_schedule_id"), // For recurring schedules
  type: varchar("type", { length: 20 }).default("planned").notNull(), // planned, actual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Availability and Working Hours
export const agentAvailability = pgTable("agent_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  agentId: uuid("agent_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format
  breakStartTime: varchar("break_start_time", { length: 5 }),
  breakEndTime: varchar("break_end_time", { length: 5 }),
  isAvailable: boolean("is_available").default(true),
  maxAppointments: integer("max_appointments").default(8),
  preferredZones: jsonb("preferred_zones"), // Array of location zones
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Settings and Configuration
export const scheduleSettings = pgTable("schedule_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  agentId: uuid("agent_id"), // If null, applies to all agents
  settingType: varchar("setting_type", { length: 50 }).notNull(), // working_hours, travel_time, buffer_time
  settingKey: varchar("setting_key", { length: 100 }).notNull(),
  settingValue: jsonb("setting_value").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Conflicts and Validations
export const scheduleConflicts = pgTable("schedule_conflicts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  scheduleId: uuid("schedule_id").references(() => schedules.id).notNull(),
  conflictWithScheduleId: uuid("conflict_with_schedule_id").references(() => schedules.id),
  conflictType: varchar("conflict_type", { length: 50 }).notNull(), // time_overlap, agent_unavailable, location_conflict
  conflictDetails: jsonb("conflict_details"),
  severity: varchar("severity", { length: 20 }).default("medium").notNull(), // low, medium, high, critical
  isResolved: boolean("is_resolved").default(false),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// ========================================
// TICKET ENHANCEMENT TABLES
// ========================================

// Ticket Attachments - File uploads up to 200MB
export const ticketAttachments = pgTable("ticket_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  description: text("description"),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_attachments_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_attachments_tenant_created_idx").on(table.tenantId, table.createdAt),
]);

// Ticket Notes - Multiple text entries
export const ticketNotes = pgTable("ticket_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id).notNull(),
  content: text("content").notNull(),
  noteType: varchar("note_type", { length: 50 }).default("general"), // general, internal, resolution, escalation
  authorId: uuid("author_id").references(() => users.id).notNull(),
  isPrivate: boolean("is_private").default(false), // internal notes vs public
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_notes_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_notes_tenant_created_idx").on(table.tenantId, table.createdAt),
]);

// Ticket Communications - Messages from different channels
export const ticketCommunications = pgTable("ticket_communications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(), // email, whatsapp, telegram, sms, phone, chat
  direction: varchar("direction", { length: 10 }).notNull(), // inbound, outbound
  fromContact: varchar("from_contact", { length: 255 }).notNull(),
  toContact: varchar("to_contact", { length: 255 }),
  subject: varchar("subject", { length: 500 }),
  content: text("content").notNull(),
  messageId: varchar("message_id", { length: 255 }), // external system message ID
  threadId: varchar("thread_id", { length: 255 }), // for grouping related messages
  attachments: jsonb("attachments"), // array of attachment info
  metadata: jsonb("metadata"), // channel-specific data
  isRead: boolean("is_read").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_communications_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_communications_tenant_channel_idx").on(table.tenantId, table.channel),
  index("ticket_communications_tenant_created_idx").on(table.tenantId, table.createdAt),
  index("ticket_communications_thread_idx").on(table.tenantId, table.threadId),
]);

// Ticket History - Complete action timeline
export const ticketHistory = pgTable("ticket_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id).notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(), // created, updated, assigned, status_changed, note_added, etc.
  actorId: uuid("actor_id").references(() => users.id),
  actorType: varchar("actor_type", { length: 50 }).default("user"), // user, system, automation
  actorName: varchar("actor_name", { length: 255 }),
  description: text("description").notNull(),
  fieldChanges: jsonb("field_changes"), // before/after values
  systemLogs: jsonb("system_logs"), // technical logs for advanced view
  relatedEntityId: uuid("related_entity_id"), // ID of related object (note, attachment, etc.)
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // note, attachment, communication, etc.
  isVisible: boolean("is_visible").default(true), // hide system events in simplified view
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ticket_history_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_history_tenant_created_idx").on(table.tenantId, table.createdAt),
  index("ticket_history_tenant_action_idx").on(table.tenantId, table.actionType),
]);

// Ticket Internal Actions - Complex actions with relationships
export const ticketInternalActions = pgTable("ticket_internal_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id).notNull(),
  actionNumber: varchar("action_number", { length: 50 }).notNull().unique(), // Auto-generated unique identifier like AI-2025-000001
  actionType: varchar("action_type", { length: 100 }).notNull(), // analysis, investigation, escalation, resolution, follow_up
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Atribuição hierárquica: Grupo → Agente
  assignmentGroupId: uuid("assignment_group_id").references(() => userGroups.id), // Grupo de atribuição (prioridade sobre groupId)
  groupId: varchar("group_id", { length: 100 }), // working group (manter para compatibilidade)
  agentId: uuid("agent_id").references(() => users.id), // Agente responsável (opcional se apenas grupo atribuído)
  
  // Datas previstas (planejamento)
  plannedStartDate: timestamp("planned_start_date"), // Data prevista inicial
  plannedEndDate: timestamp("planned_end_date"), // Data prevista final
  
  // Datas realizadas (execução)
  actualStartDate: timestamp("actual_start_date"), // Data realizada inicial
  actualEndDate: timestamp("actual_end_date"), // Data realizada final
  
  // Campos de tempo legados (manter para compatibilidade)
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  
  // Campo de tempo realizado em minutos (calculado automaticamente)
  tempoRealizado: integer("tempo_realizado"), // tempo em minutos entre start_time e end_time
  
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"),
  linkedItemIds: jsonb("linked_item_ids").default([]), // array of UUIDs for related items
  linkedItemTypes: jsonb("linked_item_types").default([]), // corresponding types for linked items
  attachmentIds: jsonb("attachment_ids").default([]), // array of attachment UUIDs
  formData: jsonb("form_data").default({}), // custom form responses
  completionNotes: text("completion_notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_internal_actions_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_internal_actions_tenant_agent_idx").on(table.tenantId, table.agentId),
  index("ticket_internal_actions_tenant_group_idx").on(table.tenantId, table.assignmentGroupId),
  index("ticket_internal_actions_tenant_status_idx").on(table.tenantId, table.status),
  index("ticket_internal_actions_tenant_created_idx").on(table.tenantId, table.createdAt),
  index("ticket_internal_actions_planned_dates_idx").on(table.tenantId, table.plannedStartDate, table.plannedEndDate),
  index("ticket_internal_actions_actual_dates_idx").on(table.tenantId, table.actualStartDate, table.actualEndDate),
  index("ticket_internal_actions_group_agent_idx").on(table.tenantId, table.assignmentGroupId, table.agentId),
]);

// ========================================
// HR/TEAM MANAGEMENT TABLES
// ========================================

// Departments table for team organization
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(), // engineering, sales, support, hr
  description: text("description"),
  managerId: uuid("manager_id"), // References users table
  parentDepartmentId: uuid("parent_department_id"), // For hierarchy
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("departments_tenant_code_idx").on(table.tenantId, table.code),
  index("departments_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Performance metrics tracking
export const performanceMetrics = pgTable("performance_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(), // References users table
  metricType: varchar("metric_type", { length: 50 }).notNull(), // tickets_resolved, customer_satisfaction, response_time, etc.
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  target: decimal("target", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }), // percentage, count, hours, days
  period: varchar("period", { length: 20 }).notNull(), // daily, weekly, monthly, quarterly, yearly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  assessedBy: uuid("assessed_by"), // References users table
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("performance_metrics_tenant_user_idx").on(table.tenantId, table.userId),
  index("performance_metrics_tenant_period_idx").on(table.tenantId, table.periodStart, table.periodEnd),
  index("performance_metrics_tenant_type_idx").on(table.tenantId, table.metricType),
]);

// Schedule types
export type InsertActivityType = typeof activityTypes.$inferInsert;
export type ActivityType = typeof activityTypes.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type InsertAgentAvailability = typeof agentAvailability.$inferInsert;
export type AgentAvailability = typeof agentAvailability.$inferSelect;
export type InsertScheduleSettings = typeof scheduleSettings.$inferInsert;
export type ScheduleSettings = typeof scheduleSettings.$inferSelect;

// Ticket Enhancement types
export type InsertTicketAttachment = typeof ticketAttachments.$inferInsert;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketRelationship = typeof ticketRelationships.$inferInsert;
export type TicketRelationship = typeof ticketRelationships.$inferSelect;
export type InsertTicketNote = typeof ticketNotes.$inferInsert;
export type TicketNote = typeof ticketNotes.$inferSelect;
export type InsertTicketCommunication = typeof ticketCommunications.$inferInsert;
export type TicketCommunication = typeof ticketCommunications.$inferSelect;
export type InsertTicketHistory = typeof ticketHistory.$inferInsert;
export type TicketHistory = typeof ticketHistory.$inferSelect;
export type InsertTicketInternalAction = typeof ticketInternalActions.$inferInsert;
export type TicketInternalAction = typeof ticketInternalActions.$inferSelect;

// HR/Team Management types
export type InsertDepartment = typeof departments.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type InsertUserGroup = typeof userGroups.$inferInsert;
export type UserGroup = typeof userGroups.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

// User Group schemas for validation
export const updateUserGroupSchema = insertUserGroupSchema.partial();

// ========================================
// CONTRACT MANAGEMENT TABLES
// ========================================

// Contracts table - Main contract records
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractNumber: varchar("contract_number", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  customerId: uuid("customer_id").references(() => customers.id),
  customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id),
  contractType: varchar("contract_type", { length: 50 }).notNull(), // maintenance, support, development, consultoria, sla
  status: varchar("status", { length: 50 }).default("active"), // active, suspended, cancelled, in_renewal, expired
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical

  // Financial Information
  totalValue: decimal("total_value", { precision: 15, scale: 2 }),
  monthlyValue: decimal("monthly_value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),

  // Contract Dates
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  renewalDate: timestamp("renewal_date"),
  lastRenewalDate: timestamp("lastRenewalDate"),
  signatureDate: timestamp("signature_date"),

  // Contract Management
  managerId: uuid("manager_id").references(() => users.id), // Account manager
  technicalManagerId: uuid("technical_manager_id").references(() => users.id),
  locationId: uuid("location_id").references(() => locations.id),

  // Contract Hierarchy
  parentContractId: uuid("parent_contract_id"), // For addendums and annexes
  isMainContract: boolean("is_main_contract").default(true),

  // Renewal Settings
  autoRenewal: boolean("auto_renewal").default(false),
  renewalNoticeDays: integer("renewal_notice_days").default(30),
  renewalTermMonths: integer("renewal_term_months").default(12),

  // Compliance and Risk
  riskLevel: varchar("risk_level", { length: 20 }).default("low"), // low, medium, high, critical
  complianceStatus: varchar("compliance_status", { length: 50 }).default("compliant"),

  // Additional Information
  terms: text("terms"), // Special terms and conditions
  notes: text("notes"),
  tags: text("tags").array().default([]),
  customFields: jsonb("custom_fields").default({}),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  createdById: uuid("created_by_id").references(() => users.id),
}, (table) => [
  index("contracts_tenant_customer_idx").on(table.tenantId, table.customerId),
  index("contracts_tenant_status_idx").on(table.tenantId, table.status),
  index("contracts_tenant_type_idx").on(table.tenantId, table.contractType),
  index("contracts_tenant_dates_idx").on(table.tenantId, table.startDate, table.endDate),
  index("contracts_tenant_renewal_idx").on(table.tenantId, table.renewalDate),
  index("contracts_tenant_manager_idx").on(table.tenantId, table.managerId),
  unique("contracts_tenant_number_unique").on(table.tenantId, table.contractNumber),
]);

// Contract SLAs table - Service Level Agreements
export const contractSlas = pgTable("contract_slas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
  slaName: varchar("sla_name", { length: 255 }).notNull(),
  slaType: varchar("sla_type", { length: 50 }).notNull(), // response_time, resolution_time, availability, performance

  // SLA Metrics
  responseTime: integer("response_time"), // in minutes
  resolutionTime: integer("resolution_time"), // in hours
  availabilityPercent: decimal("availability_percent", { precision: 5, scale: 2 }), // 99.9%
  upTimeHours: decimal("uptime_hours", { precision: 8, scale: 2 }),

  // Business Hours
  businessHoursStart: time("business_hours_start").default("08:00"),
  businessHoursEnd: time("business_hours_end").default("18:00"),
  businessDays: text("business_days").array().default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  includeWeekends: boolean("include_weekends").default(false),
  includeHolidays: boolean("include_holidays").default(false),

  // Escalation Rules
  escalationLevel1: integer("escalation_level1"), // minutes to escalate
  escalationLevel2: integer("escalation_level2"),
  escalationLevel3: integer("escalation_level3"),
  escalationManagerId: uuid("escalation_manager_id").references(() => users.id),

  // Penalties and Bonuses
  penaltyPercent: decimal("penalty_percent", { precision: 5, scale: 2 }),
  bonusPercent: decimal("bonus_percent", { precision: 5, scale: 2 }),
  penaltyCapPercent: decimal("penalty_cap_percent", { precision: 5, scale: 2 }), // Maximum penalty

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => [
  index("contract_slas_tenant_contract_idx").on(table.tenantId, table.contractId),
  index("contract_slas_tenant_type_idx").on(table.tenantId, table.slaType),
  unique("contract_slas_contract_name_unique").on(table.contractId, table.slaName),
]);

// Contract Services table - Services included in contract
export const contractServices = pgTable("contract_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  serviceType: varchar("service_type", { length: 50 }).notNull(), // maintenance, support, installation, consultation
  serviceCategory: varchar("service_category", { length: 100 }),

  // Service Pricing
  includedQuantity: integer("included_quantity"), // How many included in contract
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // Price per additional unit
  billingType: varchar("billing_type", { length: 50 }).default("included"), // included, per_unit, hourly, fixed

  // Service Details
  description: text("description"),
  requirements: text("requirements"),
  deliverables: text("deliverables"),
  estimatedHours: decimal("estimated_hours", { precision: 8, scale: 2 }),
  skillsRequired: text("skills_required").array().default([]),

  // SLA Association
  slaId: uuid("sla_id").references(() => contractSlas.id),
  priority: varchar("priority", { length: 20 }).default("medium"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => [
  index("contract_services_tenant_contract_idx").on(table.tenantId, table.contractId),
  index("contract_services_tenant_type_idx").on(table.tenantId, table.serviceType),
  index("contract_services_tenant_category_idx").on(table.tenantId, table.serviceCategory),
]);

// Contract Documents table - Document management
export const contractDocuments = pgTable("contract_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
  documentName: varchar("document_name", { length: 255 }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(), // contract, addendum, amendment, signature, certificate
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }), // in bytes
  mimeType: varchar("mime_type", { length: 100 }),

  // Versioning
  version: varchar("version", { length: 20 }).default("1.0"),
  isCurrentVersion: boolean("is_current_version").default(true),
  previousVersionId: uuid("previous_version_id"),

  // Signature Information
  requiresSignature: boolean("requires_signature").default(false),
  signatureStatus: varchar("signature_status", { length: 50 }).default("pending"), // pending, signed, rejected, expired
  signedDate: timestamp("signed_date"),
  signedById: uuid("signed_by_id").references(() => users.id),
  digitalSignatureId: varchar("digital_signature_id", { length: 255 }), // External signature service ID

  // Access Control
  accessLevel: varchar("access_level", { length: 50 }).default("internal"), // public, internal, confidential, restricted
  allowedUserIds: uuid("allowed_user_ids").array().default([]),
  allowedRoles: text("allowed_roles").array().default([]),

  // Metadata
  description: text("description"),
  tags: text("tags").array().default([]),
  expirationDate: timestamp("expiration_date"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => [
  index("contract_documents_tenant_contract_idx").on(table.tenantId, table.contractId),
index("contract_documents_tenant_type_idx").on(table.tenantId, table.documentType),
  index("contract_documents_signature_status_idx").on(table.signatureStatus),
  index("contract_documents_current_version_idx").on(table.isCurrentVersion),
]);

// Contract Renewals table for enhanced data integrity and functionality in the parts and services module.
export const contractRenewals = pgTable("contract_renewals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
  renewalType: varchar("renewal_type", { length: 50 }).notNull(), // automatic, manual, renegotiated

  // Renewal Details
  previousEndDate: timestamp("previous_end_date").notNull(),
  newEndDate: timestamp("new_end_date").notNull(),renewalDate: timestamp("renewal_date").defaultNow(),
  termMonths: integer("term_months").notNull(),

  // Financial Changes
  previousValue: decimal("previous_value", { precision: 15, scale: 2 }),
  newValue: decimal("new_value", { precision: 15, scale: 2 }),
  adjustmentPercent: decimal("adjustment_percent", { precision: 5, scale: 2 }),
  adjustmentReason: varchar("adjustment_reason", { length: 255 }),

  // Approval Workflow
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected, executed
  requestedById: uuid("requested_by_id").references(() => users.id),
  approvedById: uuid("approved_by_id").references(() => users.id),
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),

  // Changes and Notes
  changesFromPrevious: text("changes_from_previous"),
  renewalNotes: text("renewal_notes"),
  approvalNotes: text("approval_notes"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => [
  index("contract_renewals_tenant_contract_idx").on(table.tenantId, table.contractId),
  index("contract_renewals_tenant_status_idx").on(table.tenantId, table.status),
  index("contract_renewals_tenant_date_idx").on(table.tenantId, table.renewalDate),
]);

// Contract Billing table - Financial transactions and billing history
export const contractBilling = pgTable("contract_billing", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),

  // Billing Information
  billingType: varchar("billing_type", { length: 50 }).notNull(), // monthly, quarterly, annual, one_time, usage_based
  baseAmount: decimal("base_amount", { precision: 15, scale: 2 }).notNull(),
  additionalCharges: decimal("additional_charges", { precision: 15, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default('0'),
  penaltyAmount: decimal("penalty_amount", { precision: 15, scale: 2 }).default('0'),
  bonusAmount: decimal("bonus_amount", { precision: 15, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),

  // Tax Information
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }),

  // Payment Information
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  dueDate: timestamp("due_date"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, overdue, cancelled
  paymentDate: timestamp("payment_date"),
  paymentMethod: varchar("payment_method", { length: 50 }),

  // Additional Services
  additionalServices: jsonb("additional_services").default([]), // Array of extra services billed
  usageMetrics: jsonb("usage_metrics").default({}), // Usage-based billing metrics

  // Billing Notes
  billingNotes: text("billing_notes"),
  paymentNotes: text("payment_notes"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => [
  index("contract_billing_tenant_contract_idx").on(table.tenantId, table.contractId),
  index("contract_billing_tenant_period_idx").on(table.tenantId, table.billingPeriodStart, table.billingPeriodEnd),
  index("contract_billing_tenant_status_idx").on(table.tenantId, table.paymentStatus),
  index("contract_billing_due_date_idx").on(table.dueDate),
]);

// Contract Equipment table - Equipment/assets covered by contract
export const contractEquipment = pgTable("contract_equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
  equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
  equipmentType: varchar("equipment_type", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  assetTag: varchar("asset_tag", { length: 100 }),

  // Location and Installation
  installationLocationId: uuid("installation_location_id").references(() => locations.id),
  installationDate: timestamp("installation_date"),
  installationNotes: text("installation_notes"),

  // Coverage Details
  coverageType: varchar("coverage_type", { length: 50 }).default("full"), // full, parts_only, labor_only, preventive
  warrantyEndDate: timestamp("warranty_end_date"),
  maintenanceSchedule: varchar("maintenance_schedule", { length: 50 }), // monthly, quarterly, semi_annual, annual

  // Equipment Status
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, replaced, removed
  replacementDate: timestamp("replacement_date"),
  replacementReason: text("replacement_reason"),

  // Technical Information
  specifications: jsonb("specifications").default({}),
  maintenanceHistory: jsonb("maintenance_history").default([]),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => [
  index("contract_equipment_tenant_contract_idx").on(table.tenantId, table.contractId),
  index("contract_equipment_tenant_type_idx").on(table.tenantId, table.equipmentType),
  index("contract_equipment_serial_idx").on(table.serialNumber),
  index("contract_equipment_location_idx").on(table.installationLocationId),
]);

// Contract type definitions and validation schemas
export type InsertContract = typeof contracts.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type InsertContractSla = typeof contractSlas.$inferInsert;
export type ContractSla = typeof contractSlas.$inferSelect;
export type InsertContractService = typeof contractServices.$inferInsert;
export type ContractService = typeof contractServices.$inferSelect;
export type InsertContractDocument = typeof contractDocuments.$inferInsert;
export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractRenewal = typeof contractRenewals.$inferInsert;
export type ContractRenewal = typeof contractRenewals.$inferSelect;
export type InsertContractBilling = typeof contractBilling.$inferInsert;
export type ContractBilling = typeof contractBilling.$inferSelect;
export type InsertContractEquipment = typeof contractEquipment.$inferInsert;
export type ContractEquipment = typeof contractEquipment.$inferSelect;

// Contract validation schemas
export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
});

export const insertContractSlaSchema = createInsertSchema(contractSlas).omit({
  id: true,
  createdAt: true,
});

export const insertContractServiceSchema = createInsertSchema(contractServices).omit({
  id: true,
  createdAt: true,
});

export const insertContractDocumentSchema = createInsertSchema(contractDocuments).omit({
  id: true,
  createdAt: true,
  uploadedById: true,
});

export const insertContractRenewalSchema = createInsertSchema(contractRenewals).omit({
  id: true,
  createdAt: true,
});

export const insertContractBillingSchema = createInsertSchema(contractBilling).omit({
  id: true,
  createdAt: true,
  generatedById: true,
});

export const insertContractEquipmentSchema = createInsertSchema(contractEquipment).omit({
  id: true,
  createdAt: true,
});

// ============================================
// PARTS & SERVICES MODULE
// ============================================

// Items table
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'part' | 'service' | 'kit'
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  internalCode: varchar("internal_code", { length: 100 }).notNull(),
  manufacturerCode: varchar("manufacturer_code", { length: 100 }),
  supplierCode: varchar("supplier_code", { length: 100 }),
  barcode: varchar("barcode", { length: 255 }),
  sku: varchar("sku", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  specifications: jsonb("specifications"),
  technicalDetails: text("technical_details"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  unit: varchar("unit", { length: 50 }).default("UN"),
  abcClassification: varchar("abc_classification", { length: 1 }),
  criticality: varchar("criticality", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  tags: text("tags").array(),
  customFields: jsonb("custom_fields"),
  notes: text("notes")
});

// Stock locations table
export const stockLocations = pgTable("stock_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  parentLocationId: uuid("parent_location_id"),
  locationPath: text("location_path"),
  level: integer("level").default(0),
  address: text("address"),
  coordinates: jsonb("coordinates"),
  capacity: jsonb("capacity"),
  isActive: boolean("is_active").notNull().default(true),
  allowNegativeStock: boolean("allow_negative_stock").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});

// Stock levels table
export const stockLevels = pgTable("stock_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  itemId: uuid("item_id").notNull().references(() => items.id),
  locationId: uuid("location_id").notNull().references(() => stockLocations.id),
  currentStock: decimal("current_stock", { precision: 15, scale: 4 }).notNull().default("0"),
  availableStock: decimal("available_stock", { precision: 15, scale: 4 }).notNull().default("0"),
  reservedStock: decimal("reserved_stock", { precision: 15, scale: 4 }).notNull().default("0"),
  minimumStock: decimal("minimum_stock", { precision: 15, scale: 4 }).default("0"),
  maximumStock: decimal("maximum_stock", { precision: 15, scale: 4 }),
  reorderPoint: decimal("reorder_point", { precision: 15, scale: 4 }),
  averageCost: decimal("average_cost", { precision: 15, scale: 4 }),
  lastCost: decimal("last_cost", { precision: 15, scale: 4 }),
  lastInventoryDate: timestamp("last_inventory_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("supplier"),
  documentNumber: varchar("document_number", { length: 50 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: text("website"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
  rating: varchar("rating", { length: 10 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by")
});

// ========================================
// TICKET MATERIALS AND SERVICES CONSUMPTION SYSTEM
// ========================================

// LPU Settings per ticket - Links tickets to specific price lists
export const ticketLpuSettings = pgTable("ticket_lpu_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  lpuId: uuid("lpu_id").notNull(), // References LPU table
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  appliedById: uuid("applied_by_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_lpu_settings_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_lpu_settings_tenant_lpu_idx").on(table.tenantId, table.lpuId),
  index("ticket_lpu_settings_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Planned items consumption (before service execution)
export const ticketPlannedItems = pgTable("ticket_planned_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid("item_id").references(() => items.id).notNull(),
  plannedQuantity: decimal("planned_quantity", { precision: 15, scale: 4 }).notNull(),
  lpuId: uuid("lpu_id").notNull(), // LPU used for pricing
  unitPriceAtPlanning: decimal("unit_price_at_planning", { precision: 15, scale: 4 }).notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("planned").notNull(), // planned, approved, cancelled
  plannedById: uuid("planned_by_id").references(() => users.id),
  approvedById: uuid("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_planned_items_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_planned_items_tenant_item_idx").on(table.tenantId, table.itemId),
  index("ticket_planned_items_tenant_status_idx").on(table.tenantId, table.status),
  index("ticket_planned_items_tenant_lpu_idx").on(table.tenantId, table.lpuId),
]);

// Actual items consumption (after service execution)
export const ticketConsumedItems = pgTable("ticket_consumed_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  plannedItemId: uuid("planned_item_id").references(() => ticketPlannedItems.id), // Optional - links to planned item
  itemId: uuid("item_id").references(() => items.id).notNull(),
  plannedQuantity: decimal("planned_quantity", { precision: 15, scale: 4 }).default("0"),
  actualQuantity: decimal("actual_quantity", { precision: 15, scale: 4 }).notNull(),
  lpuId: uuid("lpu_id").notNull(), // LPU used for final pricing
  unitPriceAtConsumption: decimal("unit_price_at_consumption", { precision: 15, scale: 4 }).notNull(),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }).notNull(),
  technicianId: uuid("technician_id").references(() => users.id).notNull(),
  stockLocationId: uuid("stock_location_id").references(() => stockLocations.id),
  consumedAt: timestamp("consumed_at").defaultNow().notNull(),
  consumptionType: varchar("consumption_type", { length: 50 }).default("used"), // used, wasted, returned
  notes: text("notes"),
  batchNumber: varchar("batch_number", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  warrantyPeriod: integer("warranty_period"), // Days
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_consumed_items_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_consumed_items_tenant_item_idx").on(table.tenantId, table.itemId),
  index("ticket_consumed_items_tenant_technician_idx").on(table.tenantId, table.technicianId),
  index("ticket_consumed_items_tenant_consumed_idx").on(table.tenantId, table.consumedAt),
  index("ticket_consumed_items_tenant_lpu_idx").on(table.tenantId, table.lpuId),
  index("ticket_consumed_items_tenant_location_idx").on(table.tenantId, table.stockLocationId),
]);

// Costs summary per ticket
export const ticketCostsSummary = pgTable("ticket_costs_summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  totalPlannedCost: decimal("total_planned_cost", { precision: 15, scale: 2 }).default("0"),
  totalActualCost: decimal("total_actual_cost", { precision: 15, scale: 2 }).default("0"),
  costVariance: decimal("cost_variance", { precision: 15, scale: 2 }).default("0"), // actual - planned
  costVariancePercentage: decimal("cost_variance_percentage", { precision: 5, scale: 2 }).default("0"),
  materialsCount: integer("materials_count").default(0),
  servicesCount: integer("services_count").default(0),
  totalItemsCount: integer("total_items_count").default(0),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  calculatedById: uuid("calculated_by_id").references(() => users.id),
  status: varchar("status", { length: 20 }).default("draft"), // draft, approved, closed
  approvedById: uuid("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_costs_summary_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_costs_summary_tenant_status_idx").on(table.tenantId, table.status),
  index("ticket_costs_summary_tenant_calculated_idx").on(table.tenantId, table.lastCalculatedAt),
  unique("ticket_costs_summary_unique_ticket").on(table.tenantId, table.ticketId),
]);

// Stock movements triggered by ticket consumption
export const ticketStockMovements = pgTable("ticket_stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  consumedItemId: uuid("consumed_item_id").references(() => ticketConsumedItems.id, { onDelete: 'cascade' }).notNull(),
  stockLocationId: uuid("stock_location_id").references(() => stockLocations.id).notNull(),
  itemId: uuid("item_id").references(() => items.id).notNull(),
  movementType: varchar("movement_type", { length: 20 }).notNull(), // out, return, adjustment
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  previousStock: decimal("previous_stock", { precision: 15, scale: 4 }).notNull(),
  newStock: decimal("new_stock", { precision: 15, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }),
  technicianId: uuid("technician_id").references(() => users.id).notNull(),
  movementDate: timestamp("movement_date").defaultNow().notNull(),
  reason: text("reason"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_stock_movements_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("ticket_stock_movements_tenant_location_idx").on(table.tenantId, table.stockLocationId),
  index("ticket_stock_movements_tenant_item_idx").on(table.tenantId, table.itemId),
  index("ticket_stock_movements_tenant_technician_idx").on(table.tenantId, table.technicianId),
  index("ticket_stock_movements_tenant_date_idx").on(table.tenantId, table.movementDate),
]);

// Types for ticket materials consumption
export type TicketLpuSetting = typeof ticketLpuSettings.$inferSelect;
export type InsertTicketLpuSetting = typeof ticketLpuSettings.$inferInsert;
export type TicketPlannedItem = typeof ticketPlannedItems.$inferSelect;
export type InsertTicketPlannedItem = typeof ticketPlannedItems.$inferInsert;
export type TicketConsumedItem = typeof ticketConsumedItems.$inferSelect;
export type InsertTicketConsumedItem = typeof ticketConsumedItems.$inferInsert;
export type TicketCostsSummary = typeof ticketCostsSummary.$inferSelect;
export type InsertTicketCostsSummary = typeof ticketCostsSummary.$inferInsert;
export type TicketStockMovement = typeof ticketStockMovements.$inferSelect;
export type InsertTicketStockMovement = typeof ticketStockMovements.$inferInsert;

// Zod schemas for validation
export const insertTicketLpuSettingSchema = createInsertSchema(ticketLpuSettings);
export const insertTicketPlannedItemSchema = createInsertSchema(ticketPlannedItems);
export const insertTicketConsumedItemSchema = createInsertSchema(ticketConsumedItems);
export const insertTicketCostsSummarySchema = createInsertSchema(ticketCostsSummary);
export const insertTicketStockMovementSchema = createInsertSchema(ticketStockMovements);

// Types for parts and services
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type StockLocation = typeof stockLocations.$inferSelect;
export type InsertStockLocation = typeof stockLocations.$inferInsert;
export type StockLevel = typeof stockLevels.$inferSelect;
export type InsertStockLevel = typeof stockLevels.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;



// Zod Schemas for notifications
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences);
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates);
export const insertNotificationLogSchema = createInsertSchema(notificationLogs);

// ========================================
// ENHANCED SLA SYSTEM INTEGRATED WITH TICKET METADATA
// ========================================

// Main SLA configurations table
export const ticketSlas = pgTable("ticket_slas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  slaLevel: varchar("sla_level", { length: 50 }).notNull(), // L1, L2, L3, L4, Premium, Standard, Basic
  isActive: boolean("is_active").default(true),
  
  // Integration with ticket metadata fields
  priorityField: varchar("priority_field", { length: 100 }).default("priority"), // which field to check
  statusField: varchar("status_field", { length: 100 }).default("status"),
  categoryField: varchar("category_field", { length: 100 }).default("category"),
  
  // Business Hours Configuration
  businessHoursStart: time("business_hours_start").default("08:00"),
  businessHoursEnd: time("business_hours_end").default("18:00"),
  businessDays: text("business_days").array().default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
  includeWeekends: boolean("include_weekends").default(false),
  includeHolidays: boolean("include_holidays").default(false),
  
  // Notification Settings
  notifyBeachMinutes: integer("notify_breach_minutes").default(15), // Notify X minutes before breach
  escalationEnabled: boolean("escalation_enabled").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id)
}, (table) => [
  index("ticket_slas_tenant_level_idx").on(table.tenantId, table.slaLevel),
  index("ticket_slas_tenant_active_idx").on(table.tenantId, table.isActive),
  unique("ticket_slas_tenant_name_unique").on(table.tenantId, table.name),
]);

// SLA rules based on ticket metadata field values
export const slaRules = pgTable("sla_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  slaId: uuid("sla_id").references(() => ticketSlas.id, { onDelete: 'cascade' }).notNull(),
  
  // Field-based conditions (integrated with ticket metadata)
  fieldName: varchar("field_name", { length: 100 }).notNull(), // priority, status, category, etc.
  fieldValue: varchar("field_value", { length: 100 }).notNull(), // urgent, high, critical, etc.
  
  // Time limits in minutes
  firstResponseTime: integer("first_response_time").notNull(), // Time to first response
  resolutionTime: integer("resolution_time").notNull(), // Time to resolution
  
  // Escalation levels
  escalationL1Time: integer("escalation_l1_time"), // Escalate to L1 after X minutes
  escalationL2Time: integer("escalation_l2_time"), // Escalate to L2 after X minutes
  escalationL3Time: integer("escalation_l3_time"), // Escalate to L3 after X minutes
  escalationL1GroupId: uuid("escalation_l1_group_id"),
  escalationL2GroupId: uuid("escalation_l2_group_id"),
  escalationL3GroupId: uuid("escalation_l3_group_id"),
  
  // Priority and order
  priority: integer("priority").default(100), // Lower number = higher priority
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("sla_rules_tenant_sla_idx").on(table.tenantId, table.slaId),
  index("sla_rules_field_value_idx").on(table.fieldName, table.fieldValue),
  index("sla_rules_priority_idx").on(table.priority),
  unique("sla_rules_unique_condition").on(table.slaId, table.fieldName, table.fieldValue),
]);

// SLA status timeouts - idle time limits per status
export const slaStatusTimeouts = pgTable("sla_status_timeouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  slaId: uuid("sla_id").references(() => ticketSlas.id, { onDelete: 'cascade' }).notNull(),
  
  // Status-based timeout configuration
  statusValue: varchar("status_value", { length: 100 }).notNull(), // open, in_progress, resolved, etc.
  maxIdleTime: integer("max_idle_time").notNull(), // Maximum idle time in minutes
  
  // Actions on timeout
  timeoutAction: varchar("timeout_action", { length: 50 }).default("escalate"), // escalate, notify, auto_close
  escalateToGroupId: uuid("escalate_to_group_id"),
  escalateToUserId: uuid("escalate_to_user_id"),
  notificationTemplate: text("notification_template"),
  
  // Business rules
  applyDuringBusinessHours: boolean("apply_during_business_hours").default(true),
  resetOnUpdate: boolean("reset_on_update").default(true), // Reset timer on ticket update
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("sla_status_timeouts_tenant_sla_idx").on(table.tenantId, table.slaId),
  index("sla_status_timeouts_status_idx").on(table.statusValue),
  unique("sla_status_timeouts_unique").on(table.slaId, table.statusValue),
]);

// SLA escalations tracking
export const slaEscalations = pgTable("sla_escalations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  slaRuleId: uuid("sla_rule_id").references(() => slaRules.id).notNull(),
  
  // Escalation details
  escalationLevel: varchar("escalation_level", { length: 10 }).notNull(), // L1, L2, L3
  escalatedAt: timestamp("escalated_at").defaultNow().notNull(),
  escalatedFromGroupId: uuid("escalated_from_group_id"),
  escalatedToGroupId: uuid("escalated_to_group_id"),
  escalatedFromUserId: uuid("escalated_from_user_id"),
  escalatedToUserId: uuid("escalated_to_user_id"),
  
  // Status and resolution
  escalationStatus: varchar("escalation_status", { length: 50 }).default("pending"), // pending, acknowledged, resolved
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: uuid("acknowledged_by"),
  resolvedAt: timestamp("resolved_at"),
  
  // Notes and reason
  escalationReason: text("escalation_reason"),
  escalationNotes: text("escalation_notes"),
  isAutomatic: boolean("is_automatic").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("sla_escalations_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("sla_escalations_rule_idx").on(table.slaRuleId),
  index("sla_escalations_level_idx").on(table.escalationLevel),
  index("sla_escalations_status_idx").on(table.escalationStatus),
]);

// SLA metrics and compliance tracking
export const slaMetrics = pgTable("sla_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  slaRuleId: uuid("sla_rule_id").references(() => slaRules.id).notNull(),
  
  // Time calculations (in minutes)
  firstResponseTime: integer("first_response_time"), // Actual time to first response
  firstResponseDue: timestamp("first_response_due"), // When first response was due
  firstResponseMet: boolean("first_response_met"),
  
  resolutionTime: integer("resolution_time"), // Actual time to resolution
  resolutionDue: timestamp("resolution_due"), // When resolution was due
  resolutionMet: boolean("resolution_met"),
  
  // Status idle tracking
  statusTimeouts: jsonb("status_timeouts").default({}), // { "status": { "timeSpent": 120, "maxAllowed": 240, "breached": false } }
  totalIdleTime: integer("total_idle_time").default(0), // Total idle time across all statuses
  
  // Overall compliance
  overallCompliance: boolean("overall_compliance"), // Met all SLA requirements
  breachReason: text("breach_reason"), // Reason for SLA breach
  
  // Business metrics
  businessHoursOnly: boolean("business_hours_only").default(true),
  pausedTime: integer("paused_time").default(0), // Time ticket was paused (not counted)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("sla_metrics_tenant_ticket_idx").on(table.tenantId, table.ticketId),
  index("sla_metrics_rule_idx").on(table.slaRuleId),
  index("sla_metrics_compliance_idx").on(table.overallCompliance),
  index("sla_metrics_response_met_idx").on(table.firstResponseMet),
  index("sla_metrics_resolution_met_idx").on(table.resolutionMet),
  unique("sla_metrics_ticket_rule_unique").on(table.ticketId, table.slaRuleId),
]);

// Enhanced SLA types
export type TicketSla = typeof ticketSlas.$inferSelect;
export type InsertTicketSla = typeof ticketSlas.$inferInsert;
export type SlaRule = typeof slaRules.$inferSelect;
export type InsertSlaRule = typeof slaRules.$inferInsert;
export type SlaStatusTimeout = typeof slaStatusTimeouts.$inferSelect;
export type InsertSlaStatusTimeout = typeof slaStatusTimeouts.$inferInsert;
export type SlaEscalation = typeof slaEscalations.$inferSelect;
export type InsertSlaEscalation = typeof slaEscalations.$inferInsert;
export type SlaMetric = typeof slaMetrics.$inferSelect;
export type InsertSlaMetric = typeof slaMetrics.$inferInsert;

// Enhanced SLA Zod schemas
export const insertTicketSlaSchema = createInsertSchema(ticketSlas);
export const insertSlaRuleSchema = createInsertSchema(slaRules);
export const insertSlaStatusTimeoutSchema = createInsertSchema(slaStatusTimeouts);
export const insertSlaEscalationSchema = createInsertSchema(slaEscalations);
export const insertSlaMetricSchema = createInsertSchema(slaMetrics);

// ========================================
// TICKET TEMPLATES SYSTEM
// ========================================

export const ticketTemplates = pgTable("ticket_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id, { onDelete: 'cascade' }),
  
  // Identificação
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  
  // Configurações padrão do ticket
  defaultTitle: varchar("default_title", { length: 500 }),
  defaultDescription: text("default_description"),
  defaultType: varchar("default_type", { length: 50 }).default("support").notNull(),
  defaultPriority: varchar("default_priority", { length: 50 }).default("medium").notNull(),
  defaultStatus: varchar("default_status", { length: 50 }).default("open").notNull(),
  defaultCategory: varchar("default_category", { length: 100 }).notNull(),
  defaultUrgency: varchar("default_urgency", { length: 50 }),
  defaultImpact: varchar("default_impact", { length: 50 }),
  
  // Atribuições automáticas
  defaultAssigneeId: uuid("default_assignee_id"),
  defaultAssignmentGroup: varchar("default_assignment_group", { length: 100 }),
  defaultDepartment: varchar("default_department", { length: 100 }),
  
  // Configurações de campos
  requiredFields: text("required_fields").array().default([]),
  optionalFields: text("optional_fields").array().default([]),
  hiddenFields: text("hidden_fields").array().default([]),
  customFields: jsonb("custom_fields").default({}),
  
  // Automações e SLA
  autoAssignmentRules: jsonb("auto_assignment_rules").default({}),
  slaOverride: jsonb("sla_override").default({}),
  
  // Metadados
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  sortOrder: integer("sort_order").default(0),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: uuid("created_by_id").notNull(),
}, (table) => [
  index("templates_company_active_idx").on(table.tenantId, table.customerCompanyId, table.isActive, table.category),
  index("templates_usage_idx").on(table.tenantId, table.customerCompanyId, table.usageCount.desc(), table.lastUsedAt.desc()),
  unique("templates_unique_name").on(table.tenantId, table.customerCompanyId, table.name),
]);

// ========================================
// TEMPLATE VERSIONING AND DYNAMIC FIELDS
// ========================================

// Template Versions - Controle de versões
export const templateVersions = pgTable("template_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  templateId: uuid("template_id").references(() => ticketTemplates.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: varchar("version_number", { length: 20 }).notNull(), // v1.0, v1.1, etc.
  changes: text("changes").notNull(), // Descrição das mudanças
  templateData: jsonb("template_data").notNull(), // Snapshot completo do template
  createdById: uuid("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("template_versions_template_idx").on(table.tenantId, table.templateId),
  index("template_versions_version_idx").on(table.tenantId, table.versionNumber),
  unique("template_versions_unique").on(table.templateId, table.versionNumber),
]);

// Dynamic Field Definitions - Definições de campos dinâmicos
export const dynamicFieldDefinitions = pgTable("dynamic_field_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  templateId: uuid("template_id").references(() => ticketTemplates.id, { onDelete: 'cascade' }).notNull(),
  fieldKey: varchar("field_key", { length: 100 }).notNull(), // campo único no template
  fieldType: varchar("field_type", { length: 50 }).notNull(), // text, select, checkbox, etc.
  fieldLabel: varchar("field_label", { length: 255 }).notNull(),
  fieldDescription: text("field_description"),
  
  // Configurações do campo
  isRequired: boolean("is_required").default(false),
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  
  // Validações
  validationRules: jsonb("validation_rules").default({}), // {minLength: 5, maxLength: 100, pattern: "regex"}
  
  // Opções para campos select/radio/checkbox
  fieldOptions: jsonb("field_options").default([]), // [{value: "opt1", label: "Opção 1"}]
  
  // Configurações condicionais
  conditionalLogic: jsonb("conditional_logic").default({}), // {showIf: {field: "priority", value: "high"}}
  
  // Estilo e posicionamento
  styling: jsonb("styling").default({}), // {width: "50%", cssClass: "custom-field"}
  gridPosition: jsonb("grid_position").default({}), // {row: 1, col: 1, span: 2}
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("dynamic_fields_template_idx").on(table.tenantId, table.templateId),
  index("dynamic_fields_order_idx").on(table.tenantId, table.templateId, table.sortOrder),
  unique("dynamic_fields_unique_key").on(table.templateId, table.fieldKey),
]);

// Field Validation Rules - Regras de validação
export const fieldValidationRules = pgTable("field_validation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // regex, length, numeric, custom
  ruleConfig: jsonb("rule_config").notNull(), // Configuração específica da regra
  errorMessage: text("error_message").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("validation_rules_tenant_type_idx").on(table.tenantId, table.ruleType),
  unique("validation_rules_tenant_name_unique").on(table.tenantId, table.ruleName),
]);

// Template Approval Workflow - Fluxo de aprovação
export const templateApprovals = pgTable("template_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  templateId: uuid("template_id").references(() => ticketTemplates.id, { onDelete: 'cascade' }).notNull(),
  versionId: uuid("version_id").references(() => templateVersions.id, { onDelete: 'cascade' }),
  
  // Workflow
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected, revision_needed
  requestedById: uuid("requested_by_id").notNull(),
  approverIds: uuid("approver_ids").array().default([]),
  
  // Comentários e feedback
  requestComments: text("request_comments"),
  approvalComments: text("approval_comments"),
  rejectionReason: text("rejection_reason"),
  
  // Timestamps
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("template_approvals_template_idx").on(table.tenantId, table.templateId),
  index("template_approvals_status_idx").on(table.tenantId, table.status),
]);

// Template types
export type TicketTemplate = typeof ticketTemplates.$inferSelect;
export type InsertTicketTemplate = typeof ticketTemplates.$inferInsert;
export type TemplateVersion = typeof templateVersions.$inferSelect;
export type InsertTemplateVersion = typeof templateVersions.$inferInsert;
export type DynamicFieldDefinition = typeof dynamicFieldDefinitions.$inferSelect;
export type InsertDynamicFieldDefinition = typeof dynamicFieldDefinitions.$inferInsert;
export type FieldValidationRule = typeof fieldValidationRules.$inferSelect;
export type InsertFieldValidationRule = typeof fieldValidationRules.$inferInsert;
export type TemplateApproval = typeof templateApprovals.$inferSelect;
export type InsertTemplateApproval = typeof templateApprovals.$inferInsert;

// Template Zod schemas  
export const insertTicketTemplateSchema = createInsertSchema(ticketTemplates).extend({
  customerCompanyId: z.string().uuid().nullable().optional(),
  defaultCategory: z.string().min(1, "Default category is required"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTemplateVersionSchema = createInsertSchema(templateVersions);
export const insertDynamicFieldDefinitionSchema = createInsertSchema(dynamicFieldDefinitions);
export const insertFieldValidationRuleSchema = createInsertSchema(fieldValidationRules);
export const insertTemplateApprovalSchema = createInsertSchema(templateApprovals);

export const ticketTemplateSchema = createInsertSchema(ticketTemplates).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ========================================
// TICKET LIST VIEWS - Visualizações Customizáveis
// ========================================

// Ticket List Views - Visualizações personalizadas da lista de tickets
export const ticketListViews = pgTable("ticket_list_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Permissões e visibilidade
  createdById: uuid("created_by_id").notNull(), // Referência ao usuário que criou
  isPublic: boolean("is_public").default(false), // true = visível para todos do tenant
  isDefault: boolean("is_default").default(false), // true = visualização padrão
  
  // Configuração das colunas
  columns: jsonb("columns").notNull(), // Array de objetos: {id, label, visible, order, width}
  
  // Configuração de filtros
  filters: jsonb("filters").default([]), // Array de filtros aplicados
  
  // Configuração de ordenação
  sorting: jsonb("sorting").default([]), // Array de ordenação: {column, direction}
  
  // Configurações de paginação
  pageSize: integer("page_size").default(25),
  
  // Metadados
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ticket_views_tenant_idx").on(table.tenantId),
  index("ticket_views_creator_idx").on(table.tenantId, table.createdById),
  index("ticket_views_public_idx").on(table.tenantId, table.isPublic),
  unique("ticket_views_tenant_name_creator").on(table.tenantId, table.name, table.createdById),
]);

// Shared Views Access - Controle de acesso para visualizações compartilhadas
export const ticketViewShares = pgTable("ticket_view_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  viewId: uuid("view_id").references(() => ticketListViews.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").notNull(), // Usuário com acesso à visualização
  
  // Permissões
  canEdit: boolean("can_edit").default(false), // Pode editar a visualização
  canShare: boolean("can_share").default(false), // Pode compartilhar com outros
  
  // Metadados
  sharedAt: timestamp("shared_at").defaultNow(),
  sharedById: uuid("shared_by_id").notNull(), // Quem compartilhou
}, (table) => [
  index("view_shares_view_idx").on(table.viewId),
  index("view_shares_user_idx").on(table.tenantId, table.userId),
  unique("view_shares_unique").on(table.viewId, table.userId),
]);

// User View Preferences - Preferências pessoais de visualização
export const userViewPreferences = pgTable("user_view_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  
  // Visualização ativa
  activeViewId: uuid("active_view_id").references(() => ticketListViews.id),
  
  // Preferências pessoais (override da visualização)
  personalSettings: jsonb("personal_settings").default({}), // Configurações que sobrescrevem a view
  
  // Metadados
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_prefs_user_idx").on(table.tenantId, table.userId),
  unique("user_prefs_unique").on(table.tenantId, table.userId),
]);

// Types para as novas tabelas
export type TicketListView = typeof ticketListViews.$inferSelect;
export type InsertTicketListView = typeof ticketListViews.$inferInsert;
export type TicketViewShare = typeof ticketViewShares.$inferSelect;
export type InsertTicketViewShare = typeof ticketViewShares.$inferInsert;
export type UserViewPreference = typeof userViewPreferences.$inferSelect;
export type InsertUserViewPreference = typeof userViewPreferences.$inferInsert;

// Zod schemas para validação
export const insertTicketListViewSchema = createInsertSchema(ticketListViews).extend({
  name: z.string().min(1, "Nome da visualização é obrigatório"),
  columns: z.array(z.object({
    id: z.string(),
    label: z.string(),
    visible: z.boolean(),
    order: z.number(),
    width: z.number().optional(),
  })),
  filters: z.array(z.object({
    column: z.string(),
    operator: z.string(),
    value: z.any(),
  })).optional(),
  sorting: z.array(z.object({
    column: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTicketViewShareSchema = createInsertSchema(ticketViewShares).omit({ 
  id: true, 
  sharedAt: true 
});

export const insertUserViewPreferenceSchema = createInsertSchema(userViewPreferences).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});