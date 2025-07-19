// Ticket schema definitions
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  uuid,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./base";
import { customers } from "./customer";

// Tickets table with ServiceNow-style professional fields
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Legacy fields (maintained for backward compatibility)
  subject: varchar("subject", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  
  // ServiceNow standard fields
  number: varchar("number", { length: 40 }), // Auto-generated ticket number
  shortDescription: varchar("short_description", { length: 160 }),
  category: varchar("category", { length: 50 }),
  subcategory: varchar("subcategory", { length: 50 }),
  impact: varchar("impact", { length: 20 }).default("medium"), // low, medium, high, critical
  urgency: varchar("urgency", { length: 20 }).default("medium"), // low, medium, high, critical
  state: varchar("state", { length: 20 }).default("new"), // new, in_progress, resolved, closed
  
  // Assignment fields
  customerId: uuid("customer_id").references(() => customers.id),
  assignedToId: varchar("assigned_to_id"),
  callerId: uuid("caller_id"),
  openedById: uuid("opened_by_id"),
  assignmentGroup: varchar("assignment_group", { length: 100 }),
  location: varchar("location", { length: 100 }),
  
  // Time tracking fields
  openedAt: timestamp("opened_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  
  // Resolution fields
  resolutionCode: varchar("resolution_code", { length: 50 }),
  resolutionNotes: text("resolution_notes"),
  workNotes: jsonb("work_notes").default([]),
  
  // CI/CMDB fields
  configurationItem: varchar("configuration_item", { length: 100 }),
  businessService: varchar("business_service", { length: 100 }),
  
  // Communication fields
  contactType: varchar("contact_type", { length: 20 }).default("email"), // email, phone, chat, portal
  notify: varchar("notify", { length: 20 }).default("do_not_notify"),
  closeNotes: text("close_notes"),
  
  // Business impact fields
  businessImpact: varchar("business_impact", { length: 50 }),
  symptoms: text("symptoms"),
  rootCause: text("root_cause"),
  workaround: text("workaround"),
  
  // Additional person references for flexible assignment
  beneficiaryId: uuid("beneficiary_id"), // Who benefits from this ticket
  beneficiaryType: varchar("beneficiary_type", { length: 20 }), // 'customer' or 'user'
  callerType: varchar("caller_type", { length: 20 }), // 'customer' or 'user'
  
  // TEMPLATE DO CHAMADO - Campos contextuais específicos
  // Informações Técnicas
  prUrl: varchar("pr_url", { length: 500 }), // URL do Pull Request
  environment: varchar("environment", { length: 100 }), // Ambiente (Dev, Staging, Prod)
  publishedVersion: varchar("published_version", { length: 100 }), // Versão publicada
  
  // Informações do Solicitante (complementares)
  callerDocument: varchar("caller_document", { length: 50 }), // CPF/CNPJ
  callerPhone: varchar("caller_phone", { length: 20 }), // Telefone
  callerAddress: text("caller_address"), // Endereço completo
  
  // Informações do Favorecido
  beneficiaryName: varchar("beneficiary_name", { length: 255 }), // Nome do favorecido
  beneficiaryDocument: varchar("beneficiary_document", { length: 50 }), // CPF/CNPJ favorecido
  beneficiaryDetails: jsonb("beneficiary_details").default({}), // Detalhes adicionais
  
  // Controle de Vencimentos
  originalDueDate: timestamp("original_due_date"), // Vencimento original
  currentDueDate: timestamp("current_due_date"), // Vencimento atual
  dueDateChangedReason: text("due_date_changed_reason"), // Motivo da mudança
  
  // Contexto da Categoria
  categoryContext: jsonb("category_context").default({}), // Campos específicos por categoria
  subcategoryDetails: jsonb("subcategory_details").default({}), // Detalhes da subcategoria
  
  // Metadata
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket messages for communication history
export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  customerId: uuid("customer_id").references(() => customers.id),
  userId: varchar("user_id"),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("comment"), // comment, note, resolution
  isInternal: varchar("is_internal", { length: 10 }).default("false"),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export const insertTicketSchema = createInsertSchema(tickets, {
  prUrl: z.string().url("URL do PR inválida").optional(),
  environment: z.enum(["development", "staging", "production"]).optional(),
  publishedVersion: z.string().max(100, "Versão muito longa").optional(),
  callerDocument: z.string().max(50, "Documento muito longo").optional(),
  callerPhone: z.string().max(20, "Telefone muito longo").optional(),
  callerAddress: z.string().optional(),
  beneficiaryName: z.string().max(255, "Nome muito longo").optional(),
  beneficiaryDocument: z.string().max(50, "Documento muito longo").optional(),
  originalDueDate: z.coerce.date().optional(),
  currentDueDate: z.coerce.date().optional(),
  dueDateChangedReason: z.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;