// MASTER SCHEMA - SINGLE SOURCE OF TRUTH
// Consolidates all fragmented schemas into one unified definition
// This replaces: schema.ts, schema-simple.ts, schema-unified.ts

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

// User storage table - JWT Authentication (public schema)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { length: 50 }).default("agent").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  company: varchar("company", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTenantEmail: unique("customers_tenant_email_unique").on(table.tenantId, table.email),
  // Critical indexes for performance
  tenantEmailIdx: index("customers_tenant_email_idx").on(table.tenantId, table.email),
  tenantActiveIdx: index("customers_tenant_active_idx").on(table.tenantId, table.isActive),
}));

// Tickets table - Foreign keys optimized and critical indexes added
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),      // CONTEXTUAL: Support workflow starts "open"
  priority: varchar("priority", { length: 20 }).default("medium"),
  customerId: uuid("customer_id").references(() => customers.id),
  assignedToId: uuid("assigned_to_id").references(() => users.id), // Fixed: string → UUID FK
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tickets_tenant_status_priority_idx").on(table.tenantId, table.status, table.priority),
  index("tickets_tenant_assigned_idx").on(table.tenantId, table.assignedToId),
  index("tickets_tenant_customer_idx").on(table.tenantId, table.customerId),
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

// Skills table - Search and categorization indexes
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("skills_tenant_name_idx").on(table.tenantId, table.name),
  index("skills_tenant_category_idx").on(table.tenantId, table.category),
  index("skills_tenant_active_idx").on(table.tenantId, table.isActive),
  index("skills_category_active_idx").on(table.tenantId, table.category, table.isActive),
]);

// Certifications table - Issuer and validity indexes
export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }),
  description: text("description"),
  validityPeriodMonths: integer("validity_period_months"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("certifications_tenant_name_idx").on(table.tenantId, table.name),
  index("certifications_tenant_issuer_idx").on(table.tenantId, table.issuer),
  index("certifications_tenant_active_idx").on(table.tenantId, table.isActive),
  index("certifications_validity_idx").on(table.tenantId, table.validityPeriodMonths),
]);

// User Skills table - Composite indexes for skill matching
export const userSkills = pgTable("user_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  skillId: uuid("skill_id").references(() => skills.id),
  level: varchar("level", { length: 50 }).default("beginner"),
  yearsOfExperience: integer("years_of_experience"),
  certificationId: uuid("certification_id").references(() => certifications.id),
  isVerified: boolean("is_verified").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_skills_tenant_user_idx").on(table.tenantId, table.userId),
  index("user_skills_tenant_skill_idx").on(table.tenantId, table.skillId),
  index("user_skills_skill_level_idx").on(table.tenantId, table.skillId, table.level),
  index("user_skills_tenant_verified_idx").on(table.tenantId, table.isVerified),
  index("user_skills_experience_idx").on(table.tenantId, table.yearsOfExperience),
]);

// Favorecidos table (Brazilian beneficiaries) - Nomenclature standardized and constraints added
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),        // Standardized: nome → name
  email: varchar("email", { length: 255 }),                // Already English ✓
  phone: varchar("phone", { length: 20 }),                 // Standardized: telefone → phone
  cellPhone: varchar("cell_phone", { length: 20 }),        // Standardized: celular → cell_phone
  cpf: varchar("cpf", { length: 14 }),                     // Keep Brazilian legal term ✓
  cnpj: varchar("cnpj", { length: 18 }),                   // Keep Brazilian legal term ✓
  rg: varchar("rg", { length: 20 }),                       // Keep Brazilian legal term ✓
  integrationCode: varchar("integration_code", { length: 100 }), // Standardized: codigo_integracao → integration_code
  address: text("address"),                                 // Standardized: endereco → address
  city: varchar("city", { length: 100 }),                  // Standardized: cidade → city
  state: varchar("state", { length: 2 }),                  // Standardized: estado → state
  zipCode: varchar("zip_code", { length: 10 }),            // Standardized: cep → zip_code
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
  assignedToId: uuid("assigned_to_id").references(() => users.id),      // Fixed: added FK reference
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
  index("project_actions_tenant_assigned_idx").on(table.tenantId, table.assignedToId),
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
export const insertSkillSchema = createInsertSchema(skills);
export const insertCertificationSchema = createInsertSchema(certifications);
export const insertUserSkillSchema = createInsertSchema(userSkills);
export const insertFavorecidoSchema = createInsertSchema(favorecidos);
export const insertProjectSchema = createInsertSchema(projects);
export const insertProjectActionSchema = createInsertSchema(projectActions);

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
  tenantId: uuid("tenant_id").notNull(),
  sourceTable: varchar("source_table", { length: 100 }).notNull(), // favorecidos
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

export const insertMarketLocalizationSchema = createInsertSchema(marketLocalization);
export const insertFieldAliasMappingSchema = createInsertSchema(fieldAliasMapping);
export const insertLocalizationContextSchema = createInsertSchema(localizationContext);
export const insertHolidaySchema = createInsertSchema(holidays);

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

// Schedule types
export type InsertActivityType = typeof activityTypes.$inferInsert;
export type ActivityType = typeof activityTypes.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type InsertAgentAvailability = typeof agentAvailability.$inferInsert;
export type AgentAvailability = typeof agentAvailability.$inferSelect;
export type InsertScheduleSettings = typeof scheduleSettings.$inferInsert;
export type ScheduleSettings = typeof scheduleSettings.$inferSelect;