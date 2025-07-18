// Unified Schema - Complete Recreation for Solicitantes & Favorecidos
import { pgTable, text, varchar, boolean, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core tenant table (public schema)
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

// === TENANT-SPECIFIC TABLES ===
// These will be created in tenant schemas (tenant_uuid)

// SOLICITANTES TABLE (replaces customers)
export const solicitantes = pgTable("solicitantes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  documento: varchar("documento", { length: 50 }), // CPF/CNPJ
  tipoPessoa: varchar("tipo_pessoa", { length: 20 }).default("fisica"), // fisica, juridica
  preferenciaContato: varchar("preferencia_contato", { length: 20 }).default("email"),
  idioma: varchar("idioma", { length: 10 }).default("pt-BR"),
  timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
  observacoes: text("observacoes"),
  // Status fields
  verified: boolean("verified").default(false),
  active: boolean("active").default(true),
  suspended: boolean("suspended").default(false),
  // Professional fields
  externalId: varchar("external_id", { length: 100 }),
  role: varchar("role", { length: 100 }),
  notes: text("notes"),
  avatar: text("avatar"),
  signature: text("signature"),
  // Localization
  locale: varchar("locale", { length: 10 }).default("pt-BR"),
  language: varchar("language", { length: 10 }).default("pt-BR"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FAVORECIDOS TABLE (external contacts)
export const favorecidos = pgTable("favorecidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  documento: varchar("documento", { length: 50 }),
  endereco: text("endereco"),
  podeInteragir: boolean("pode_interagir").default(false),
  tipoVinculo: varchar("tipo_vinculo", { length: 50 }).default("outro"), // cliente, fornecedor, parceiro, outro
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TICKETS TABLE (updated to reference solicitantes)
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  number: varchar("number", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  shortDescription: text("short_description"),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  impact: varchar("impact", { length: 20 }).default("low"),
  urgency: varchar("urgency", { length: 20 }).default("low"),
  state: varchar("state", { length: 50 }).default("new"),
  
  // Assignment fields
  solicitanteId: uuid("solicitante_id").references(() => solicitantes.id),
  callerId: uuid("caller_id").references(() => users.id),
  openedById: uuid("opened_by_id").references(() => users.id),
  assignedToId: uuid("assigned_to_id").references(() => users.id),
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
  resolutionCode: varchar("resolution_code", { length: 100 }),
  resolutionNotes: text("resolution_notes"),
  closeNotes: text("close_notes"),
  workNotes: text("work_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TICKET MESSAGES TABLE
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// LOCATIONS TABLE
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  country: varchar("country", { length: 50 }).default("Brasil"),
  postalCode: varchar("postal_code", { length: 20 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ACTIVITY LOGS TABLE
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === ZOD SCHEMAS ===

// Solicitantes schemas
export const insertSolicitanteSchema = createInsertSchema(solicitantes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectSolicitanteSchema = createInsertSchema(solicitantes);

export type InsertSolicitante = z.infer<typeof insertSolicitanteSchema>;
export type SelectSolicitante = typeof solicitantes.$inferSelect;

// Favorecidos schemas
export const insertFavorecidoSchema = createInsertSchema(favorecidos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectFavorecidoSchema = createInsertSchema(favorecidos);

export type InsertFavorecido = z.infer<typeof insertFavorecidoSchema>;
export type SelectFavorecido = typeof favorecidos.$inferSelect;

// Tickets schemas
export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  number: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTicketSchema = createInsertSchema(tickets);

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type SelectTicket = typeof tickets.$inferSelect;

// Ticket Messages schemas
export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type SelectTicketMessage = typeof ticketMessages.$inferSelect;

// Locations schemas
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type SelectLocation = typeof locations.$inferSelect;

// Activity Logs schemas
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type SelectActivityLog = typeof activityLogs.$inferSelect;

// Utility types
export type TenantSelect = typeof tenants.$inferSelect;
export type UserSelect = typeof users.$inferSelect;