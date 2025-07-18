// External Contacts schema definitions - ARQUITETURA CORRIGIDA
// SOLUÇÃO: customers (tabela existente) → SOLICITANTES
//          external_contacts → FAVORECIDOS apenas

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

// REMOVIDA: extendedCustomers (duplicação desnecessária)
// A tabela customers existente será usada para solicitantes

// External Contacts table (Favorecidos APENAS)
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
  // CORRIGIDO: customerId agora aponta para a tabela customers existente
  customerId: uuid("customer_id"), // Vinculação a um solicitante (customers table)
  
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
  role: varchar("role", { length: 20 }).default("favorecido"), // favorecido apenas (solicitantes usam customers)
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

// Types
export type ExternalContact = typeof externalContacts.$inferSelect;
export type InsertExternalContact = z.infer<typeof insertExternalContactSchema>;
export type TicketExternalContact = typeof ticketExternalContacts.$inferSelect;
export type InsertTicketExternalContact = z.infer<typeof insertTicketExternalContactSchema>;

// Helper types para melhor organização
export type Favorecido = ExternalContact;
export type InsertFavorecido = InsertExternalContact;

// NOTA: Solicitantes usam a tabela customers existente
// Tipos para solicitantes estão em customer.ts