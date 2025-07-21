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
  id: varchar("id").primaryKey().notNull(),
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

// Customers table (Solicitantes - internal system requesters)
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  customerId: uuid("customer_id").references(() => customers.id),
  assignedTo: varchar("assigned_to", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket Messages table
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id),
  content: text("content").notNull(),
  sender: varchar("sender", { length: 255 }).notNull(),
  senderType: varchar("sender_type", { length: 50 }).default("agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Logs table
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
});

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
});

// Customer Companies table
export const customerCompanies = pgTable("customer_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  description: text("description"),
  size: varchar("size", { length: 50 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }),
  status: varchar("status", { length: 50 }).default("active"),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skills table
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certifications table
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
});

// User Skills table
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
});

// Favorecidos table (Brazilian business context - external beneficiaries)
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(), // Campo brasileiro - manter português
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }), // Campo brasileiro - manter português
  celular: varchar("celular", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }), // CPF brasileiro - manter português
  cnpj: varchar("cnpj", { length: 18 }), // CNPJ brasileiro - manter português
  rg: varchar("rg", { length: 20 }),
  codigoIntegracao: varchar("codigo_integracao", { length: 100 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  observacoes: text("observacoes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planning"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  managerId: uuid("manager_id"),
  clientId: uuid("client_id"),
  teamMemberIds: jsonb("team_member_ids").$type<string[]>().default([]),
  tags: text("tags").array(),
  customFields: jsonb("custom_fields"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Actions table
export const projectActions = pgTable("project_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  scheduledDate: date("scheduled_date"),
  assignedToId: uuid("assigned_to_id"),
  responsibleIds: jsonb("responsible_ids").$type<string[]>().default([]),
  dependsOnActionIds: jsonb("depends_on_action_ids").$type<string[]>().default([]),
  blockedByActionIds: jsonb("blocked_by_action_ids").$type<string[]>().default([]),
  relatedTicketId: uuid("related_ticket_id"),
  canConvertToTicket: boolean("can_convert_to_ticket").default(false),
  ticketConversionRules: jsonb("ticket_conversion_rules"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;