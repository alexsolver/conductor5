// CONSOLIDATED SCHEMA - Single Source of Truth
// This file consolidates all schema definitions to eliminate fragmentation
// Addresses all inconsistencies identified in the schema analysis

import { pgTable, text, varchar, boolean, timestamp, uuid, integer, jsonb, decimal, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ===========================
// PUBLIC SCHEMA TABLES
// ===========================

// Tenants table (public schema)
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  subdomain: varchar("subdomain", { length: 50 }).unique().notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (public schema) 
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 50 }).default("agent").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  passwordHash: text("password_hash").notNull(),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table (public schema)
export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 128 }).primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// ===========================
// TENANT-SPECIFIC TABLES
// ===========================

// UNIFIED CUSTOMERS TABLE (consolidates customers/solicitantes)
// This resolves the customers vs solicitantes inconsistency
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  
  // Basic information
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  
  // Brazilian-specific fields (for CLT compliance)
  documento: varchar("documento", { length: 50 }), // CPF/CNPJ
  tipoPessoa: varchar("tipo_pessoa", { length: 20 }).default("fisica"), // fisica, juridica
  preferenciaContato: varchar("preferencia_contato", { length: 20 }).default("email"),
  
  // Localization and preferences
  idioma: varchar("idioma", { length: 10 }).default("pt-BR"),
  timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
  locale: varchar("locale", { length: 10 }).default("pt-BR"),
  language: varchar("language", { length: 10 }).default("pt-BR"),
  
  // Professional fields
  company: varchar("company", { length: 255 }),
  externalId: varchar("external_id", { length: 100 }),
  role: varchar("role", { length: 100 }),
  
  // Additional information
  observacoes: text("observacoes"),
  notes: text("notes"),
  avatar: text("avatar"),
  signature: text("signature"),
  
  // Status fields
  verified: boolean("verified").default(false),
  active: boolean("active").default(true),
  suspended: boolean("suspended").default(false),
  
  // Metadata
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FAVORECIDOS TABLE (external contacts with standardized structure)
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  
  // Basic information
  nome: varchar("nome", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  documento: varchar("documento", { length: 50 }),
  endereco: text("endereco"),
  
  // Business relationship
  tipoVinculo: varchar("tipo_vinculo", { length: 50 }).default("outro"), // cliente, fornecedor, parceiro, outro
  podeInteragir: boolean("pode_interagir").default(false),
  
  // Additional information
  observacoes: text("observacoes"),
  metadata: jsonb("metadata").default({}),
  
  // Status
  ativo: boolean("ativo").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TICKETS TABLE (unified structure referencing customers)
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  
  // Ticket identification
  number: varchar("number", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  shortDescription: text("short_description"),
  description: text("description"),
  
  // Status and priority
  status: varchar("status", { length: 50 }).default("open").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"),
  impact: varchar("impact", { length: 20 }).default("low"),
  urgency: varchar("urgency", { length: 20 }).default("low"),
  state: varchar("state", { length: 50 }).default("new"),
  
  // Categorization
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  
  // Assignment (standardized foreign key references)
  customerId: uuid("customer_id").references(() => customers.id),
  callerId: uuid("caller_id"), // References users.id (cross-schema)
  openedById: uuid("opened_by_id"), // References users.id (cross-schema)
  assignedToId: uuid("assigned_to_id"), // References users.id (cross-schema)
  assignmentGroup: varchar("assignment_group", { length: 100 }),
  
  // Business fields
  businessImpact: text("business_impact"),
  symptoms: text("symptoms"),
  rootCause: text("root_cause"),
  workaround: text("workaround"),
  contactType: varchar("contact_type", { length: 50 }),
  notify: boolean("notify").default(true),
  
  // Timing fields
  openedAt: timestamp("opened_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  dueDate: timestamp("due_date"),
  
  // Metadata
  metadata: jsonb("metadata").default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TICKET MESSAGES TABLE
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "cascade" }).notNull(),
  senderId: uuid("sender_id"), // References users.id (cross-schema)
  senderType: varchar("sender_type", { length: 20 }).default("user"), // user, customer, system
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("comment"), // comment, internal, solution
  isInternal: boolean("is_internal").default(false),
  attachments: jsonb("attachments").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// LOCATIONS TABLE (standardized structure)
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Geographic information
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"),
  postalCode: varchar("postal_code", { length: 20 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  
  // Classification
  category: varchar("category", { length: 100 }),
  
  // Metadata
  metadata: jsonb("metadata").default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CUSTOMER COMPANIES TABLE
export const customerCompanies = pgTable("customer_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  size: varchar("size", { length: 50 }),
  website: varchar("website", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CUSTOMER COMPANY MEMBERSHIPS TABLE (many-to-many relationship)
export const customerCompanyMemberships = pgTable("customer_company_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  companyId: uuid("company_id").references(() => customerCompanies.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 100 }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ACTIVITY LOGS TABLE (for audit trail)
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  entityType: varchar("entity_type", { length: 50 }).notNull(), // ticket, customer, etc.
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // created, updated, deleted, etc.
  userId: uuid("user_id"), // References users.id (cross-schema)
  details: jsonb("details").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// FAVORECIDO LOCATIONS TABLE (linking favorecidos to locations)
export const favorecidoLocations = pgTable("favorecido_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Standardized to UUID type
  favorecidoId: uuid("favorecido_id").references(() => favorecidos.id, { onDelete: "cascade" }).notNull(),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// TECHNICAL SKILLS TABLES
// ===========================

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  provider: varchar("provider", { length: 100 }),
  description: text("description"),
  validityMonths: integer("validity_months"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSkills = pgTable("user_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(), // References users.id (cross-schema)
  skillId: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  level: varchar("level", { length: 20 }).default("beginner"), // beginner, intermediate, advanced, expert
  yearsExperience: integer("years_experience"),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===========================
// PROJECTS TABLES
// ===========================

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planning"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  clientId: uuid("client_id").references(() => customers.id),
  managerId: uuid("manager_id"), // References users.id (cross-schema)
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectActions = pgTable("project_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  assignedToId: uuid("assigned_to_id"), // References users.id (cross-schema)
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PROJECT TIMELINE TABLE
export const projectTimeline = pgTable("project_timeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  
  // Event details
  eventType: varchar("event_type", { length: 50 }).notNull(), // project_created, status_changed, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // References
  actionId: uuid("action_id"), // References projectActions.id
  relatedEntityId: uuid("related_entity_id"),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  
  // Data tracking
  oldValue: text("old_value"),
  newValue: text("new_value"),
  metadata: jsonb("metadata").default({}),
  
  // Timestamps and audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(), // References users.id (cross-schema)
});

// ===========================
// INSERT SCHEMAS (ZOD VALIDATION)
// ===========================

// Public schema insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertSessionSchema = createInsertSchema(sessions);

// Tenant-specific insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertFavorecidoSchema = createInsertSchema(favorecidos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertCustomerCompanySchema = createInsertSchema(customerCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertCustomerCompanyMembershipSchema = createInsertSchema(customerCompanyMemberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertFavorecidoLocationSchema = createInsertSchema(favorecidoLocations).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertUserSkillSchema = createInsertSchema(userSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertProjectActionSchema = createInsertSchema(projectActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

export const insertProjectTimelineSchema = createInsertSchema(projectTimeline).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string().uuid(),
});

// ===========================
// TYPE EXPORTS
// ===========================

// Public schema types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Tenant-specific types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Favorecido = typeof favorecidos.$inferSelect;
export type InsertFavorecido = z.infer<typeof insertFavorecidoSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type CustomerCompany = typeof customerCompanies.$inferSelect;
export type InsertCustomerCompany = z.infer<typeof insertCustomerCompanySchema>;

export type CustomerCompanyMembership = typeof customerCompanyMemberships.$inferSelect;
export type InsertCustomerCompanyMembership = z.infer<typeof insertCustomerCompanyMembershipSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type FavorecidoLocation = typeof favorecidoLocations.$inferSelect;
export type InsertFavorecidoLocation = z.infer<typeof insertFavorecidoLocationSchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectAction = typeof projectActions.$inferSelect;
export type InsertProjectAction = z.infer<typeof insertProjectActionSchema>;

export type ProjectTimeline = typeof projectTimeline.$inferSelect;
export type InsertProjectTimeline = z.infer<typeof insertProjectTimelineSchema>;

// ===========================
// SCHEMA RELATIONS (OPTIONAL)
// ===========================

export const tenantRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

export const userRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const customerRelations = relations(customers, ({ many }) => ({
  tickets: many(tickets),
  companyMemberships: many(customerCompanyMemberships),
}));

export const ticketRelations = relations(tickets, ({ one, many }) => ({
  customer: one(customers, {
    fields: [tickets.customerId],
    references: [customers.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessageRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
}));

// Export the consolidated schema for Drizzle usage
export const schema = {
  // Public schema tables
  tenants,
  users,
  sessions,
  
  // Tenant-specific tables
  customers,
  favorecidos,
  tickets,
  ticketMessages,
  locations,
  customerCompanies,
  customerCompanyMemberships,
  activityLogs,
  favorecidoLocations,
  skills,
  certifications,
  userSkills,
  projects,
  projectActions,
  projectTimeline,
  
  // Relations
  tenantRelations,
  userRelations,
  customerRelations,
  ticketRelations,
  ticketMessageRelations,
};

export default schema;