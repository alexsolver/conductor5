// SCHEMA DEFINITIVO - Resolução de TODAS as inconsistências identificadas
// Este é o ÚNICO ponto de verdade do schema, resolvendo:
// 1. Fragmentação de múltiplos arquivos conflitantes
// 2. Inconsistências customers vs solicitantes  
// 3. Tipos VARCHAR vs UUID padronizados
// 4. Campos JSONB vs TEXT corrigidos
// 5. Foreign keys consistentes
// 6. Tabelas duplicadas eliminadas

import { pgTable, text, varchar, boolean, timestamp, uuid, integer, jsonb, index, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ===========================
// TABELAS PÚBLICAS (public schema)
// ===========================

// Tenants - Padronizado com UUID
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  settings: jsonb("settings").default({}), // SEMPRE JSONB, nunca TEXT
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users - IDs padronizados como UUID
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // UUID, não VARCHAR
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 50 }).default("agent").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id), // UUID FK consistente
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions - Obrigatório para Replit Auth
export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 128 }).primaryKey(),
  sess: jsonb("sess").notNull(), // JSONB, nunca TEXT
  expire: timestamp("expire").notNull(),
}, (table) => [
  index("IDX_session_expire").on(table.expire)
]);

// ===========================
// TABELAS TENANT (tenant_uuid schemas)
// ===========================

// CUSTOMERS - Unificado com campos brasileiros (resolve customers vs solicitantes)
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // UUID padronizado, não VARCHAR
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  // Campos brasileiros unificados (resolve inconsistência customers vs solicitantes)
  documento: varchar("documento", { length: 50 }), // CPF/CNPJ
  tipoPessoa: varchar("tipo_pessoa", { length: 20 }).default("fisica"), // fisica, juridica
  preferenciaContato: varchar("preferencia_contato", { length: 20 }).default("email"),
  idioma: varchar("idioma", { length: 10 }).default("pt-BR"),
  timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
  // Campos internacionais mantidos para compatibilidade
  companyName: varchar("company_name", { length: 255 }),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}), // SEMPRE JSONB
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAVORECIDOS - Definição única (elimina duplicação)
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // UUID padronizado
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  documento: varchar("documento", { length: 50 }), // CPF/CNPJ
  tipoPessoa: varchar("tipo_pessoa", { length: 20 }).default("fisica"),
  endereco: jsonb("endereco").default({}), // Endereço completo em JSONB
  dadosBancarios: jsonb("dados_bancarios").default({}), // Dados bancários em JSONB
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TICKETS - FK consistentes
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull(), // FK para customers unificado
  favorecidoId: uuid("favorecido_id"), // FK para favorecidos
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  category: varchar("category", { length: 100 }),
  assignedToId: uuid("assigned_to_id"), // FK para users
  metadata: jsonb("metadata").default({}), // SEMPRE JSONB
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// TICKET MESSAGES - FK consistentes
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ticketId: uuid("ticket_id").notNull(), // FK consistente
  userId: uuid("user_id"), // FK para users
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false),
  attachments: jsonb("attachments").default([]), // JSONB para arrays
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// PROJECTS - Estrutura padronizada com metadata
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planning"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours").default(0),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).default("0"),
  managerId: uuid("manager_id"), // Padronizado como managerId
  clientId: uuid("client_id"), // FK para customers
  teamMemberIds: uuid("team_member_ids").array().default([]),
  tags: varchar("tags").array().default([]),
  customFields: jsonb("custom_fields").default({}),
  metadata: jsonb("metadata").default({}), // Campo que estava faltando
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by").notNull(),
});

// PROJECT ACTIONS - Estrutura padronizada
export const projectActions = pgTable("project_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  projectId: uuid("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  scheduledDate: timestamp("scheduled_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"), // Padronizado como completed_at
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours").default(0),
  assignedToId: uuid("assigned_to_id"),
  responsibleIds: uuid("responsible_ids").array().default([]),
  clientContactId: uuid("client_contact_id"),
  externalReference: varchar("external_reference", { length: 255 }),
  deliveryMethod: varchar("delivery_method", { length: 100 }),
  dependsOnActionIds: uuid("depends_on_action_ids").array().default([]),
  blockedByActionIds: uuid("blocked_by_action_ids").array().default([]),
  priority: varchar("priority", { length: 20 }).default("medium"),
  tags: varchar("tags").array().default([]),
  attachments: varchar("attachments").array().default([]),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by").notNull(),
  relatedTicketId: uuid("related_ticket_id"),
  canConvertToTicket: varchar("can_convert_to_ticket", { length: 10 }).default("true"),
  ticketConversionRules: jsonb("ticket_conversion_rules").default({}),
});

// ACTIVITY LOGS - Auditoria padronizada
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: uuid("entity_id"),
  details: jsonb("details").default({}), // SEMPRE JSONB
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// LOCATIONS - Estrutura padronizada
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  country: varchar("country", { length: 50 }).default("Brasil"),
  postalCode: varchar("postal_code", { length: 20 }),
  coordinates: jsonb("coordinates").default({}), // JSONB para lat/lng
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SKILLS - Habilidades Técnicas para módulo technical-skills
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  level: varchar("level", { length: 20 }).default("beginner"), // beginner, intermediate, advanced, expert
  tags: jsonb("tags").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// USER SKILLS - Relação usuário-habilidades
export const userSkills = pgTable("user_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
  proficiencyLevel: varchar("proficiency_level", { length: 20 }).default("beginner"),
  yearsExperience: integer("years_experience").default(0),
  certifications: jsonb("certifications").default([]),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CERTIFICATIONS - Certificações dos usuários
export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  skillId: uuid("skill_id").references(() => skills.id),
  name: varchar("name", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  credentialId: varchar("credential_id", { length: 100 }),
  credentialUrl: varchar("credential_url", { length: 500 }),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// INTERNAL FORMS - Formulários internos para módulo internal-forms
export const internalForms = pgTable("internal_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  formType: varchar("form_type", { length: 50 }).default("standard"),
  fields: jsonb("fields").default([]),
  validationRules: jsonb("validation_rules").default({}),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SCHEDULES - Agendamentos para módulo schedule-management
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern").default({}),
  status: varchar("status", { length: 20 }).default("scheduled"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SCHEDULE AVAILABILITY - Disponibilidade de agenda
export const scheduleAvailability = pgTable("schedule_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SCHEDULE CONFLICTS - Conflitos de agenda
export const scheduleConflicts = pgTable("schedule_conflicts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  scheduleId: uuid("schedule_id").notNull().references(() => schedules.id),
  conflictingScheduleId: uuid("conflicting_schedule_id").notNull().references(() => schedules.id),
  conflictType: varchar("conflict_type", { length: 50 }).default("overlap"),
  severity: varchar("severity", { length: 20 }).default("medium"),
  isResolved: boolean("is_resolved").default(false),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// ===========================
// RELACIONAMENTOS (FKs consistentes)
// ===========================

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  customer: one(customers, {
    fields: [tickets.customerId],
    references: [customers.id],
  }),
  favorecido: one(favorecidos, {
    fields: [tickets.favorecidoId],
    references: [favorecidos.id],
  }),
  messages: many(ticketMessages),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(customers, {
    fields: [projects.clientId],
    references: [customers.id],
  }),
  actions: many(projectActions),
}));

// ===========================
// SCHEMAS DE VALIDAÇÃO (Zod)
// ===========================

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectActionSchema = createInsertSchema(projectActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSkillSchema = createInsertSchema(userSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInternalFormSchema = createInsertSchema(internalForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleAvailabilitySchema = createInsertSchema(scheduleAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleConflictSchema = createInsertSchema(scheduleConflicts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// ===========================
// TIPOS TYPESCRIPT
// ===========================

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Favorecido = typeof favorecidos.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectAction = typeof projectActions.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Location = typeof locations.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectAction = z.infer<typeof insertProjectActionSchema>;
export type Skill = typeof skills.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type InternalForm = typeof internalForms.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type ScheduleAvailability = typeof scheduleAvailability.$inferSelect;
export type ScheduleConflict = typeof scheduleConflicts.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type InsertInternalForm = z.infer<typeof insertInternalFormSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertScheduleAvailability = z.infer<typeof insertScheduleAvailabilitySchema>;
export type InsertScheduleConflict = z.infer<typeof insertScheduleConflictSchema>;