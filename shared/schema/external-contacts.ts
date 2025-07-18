// External Contacts schema definitions (Solicitantes e Favorecidos)
import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  uuid,
  boolean,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./base";
import { customerCompanies } from "./customer-company";
import { locations } from "./location";

// Extended Customers table (Solicitantes)
// Evolução da tabela customers existente para incluir campos de solicitante
export const extendedCustomers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Campos básicos
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  
  // Novos campos para solicitantes
  documento: varchar("documento", { length: 50 }), // CPF/CNPJ
  tipoPessoa: varchar("tipo_pessoa", { length: 20 }).default("fisica"), // fisica, juridica
  companyId: uuid("company_id").references(() => customerCompanies.id),
  locationId: uuid("location_id").references(() => locations.id),
  preferenciaContato: varchar("preferencia_contato", { length: 20 }).default("email"), // email, telefone, ambos
  idioma: varchar("idioma", { length: 5 }).default("pt-BR"),
  observacoes: text("observacoes"),
  
  // Campos existentes mantidos
  company: varchar("company", { length: 255 }),
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  
  // Status fields
  verified: boolean("verified").default(false),
  active: boolean("active").default(true),
  suspended: boolean("suspended").default(false),
  lastLogin: timestamp("last_login"),
  
  // Localization fields
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  locale: varchar("locale", { length: 10 }).default("pt-BR"),
  language: varchar("language", { length: 5 }).default("pt"),
  
  // Professional fields
  externalId: varchar("external_id", { length: 255 }),
  role: varchar("role", { length: 100 }),
  notes: varchar("notes", { length: 1000 }),
  avatar: varchar("avatar", { length: 500 }),
  signature: varchar("signature", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External Contacts table (Favorecidos)
export const externalContacts = pgTable("external_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Campos básicos
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 50 }),
  
  // Relacionamentos opcionais
  companyId: uuid("company_id").references(() => customerCompanies.id),
  locationId: uuid("location_id").references(() => locations.id),
  customerId: uuid("customer_id").references(() => extendedCustomers.id), // Vinculação a um solicitante
  
  // Configurações específicas
  podeInteragir: boolean("pode_interagir").default(false),
  tipoVinculo: varchar("tipo_vinculo", { length: 50 }).default("outro"), // colaborador, gerente_local, parceiro, auditor, outro
  
  // Status e controle
  status: varchar("status", { length: 20 }).default("ativo"), // ativo, inativo, pendente
  observacoes: text("observacoes"),
  
  // Metadados
  metadata: jsonb("metadata").default({}),
  tags: jsonb("tags").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pivot table for Ticket External Contacts (N:N relationship)
export const ticketExternalContacts = pgTable("ticket_external_contacts", {
  ticketId: uuid("ticket_id").notNull(),
  contactId: uuid("contact_id").notNull().references(() => externalContacts.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).default("favorecido"), // solicitante, favorecido
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.ticketId, table.contactId] }),
  };
});

// Schema types for External Contacts
export const insertExternalContactSchema = createInsertSchema(externalContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export const insertTicketExternalContactSchema = createInsertSchema(ticketExternalContacts).omit({
  createdAt: true,
});

// Enhanced Customer schema (extending existing)
export const insertExtendedCustomerSchema = createInsertSchema(extendedCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
});

// Types
export type ExternalContact = typeof externalContacts.$inferSelect;
export type InsertExternalContact = z.infer<typeof insertExternalContactSchema>;
export type TicketExternalContact = typeof ticketExternalContacts.$inferSelect;
export type InsertTicketExternalContact = z.infer<typeof insertTicketExternalContactSchema>;
export type ExtendedCustomer = typeof extendedCustomers.$inferSelect;
export type InsertExtendedCustomer = z.infer<typeof insertExtendedCustomerSchema>;

// Helper types for better organization
export type Solicitante = ExtendedCustomer;
export type InsertSolicitante = InsertExtendedCustomer;
export type Favorecido = ExternalContact;
export type InsertFavorecido = InsertExternalContact;