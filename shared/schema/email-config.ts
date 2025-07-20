
import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./base";

// Email Processing Rules - Controls how incoming emails are processed
export const emailProcessingRules = pgTable("email_processing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Rule identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  
  // Email matching patterns
  fromEmailPattern: varchar("from_email_pattern", { length: 255 }),
  subjectPattern: varchar("subject_pattern", { length: 255 }),
  bodyPattern: text("body_pattern"),
  attachmentRequired: boolean("attachment_required").default(false),
  
  // Action configuration
  actionType: varchar("action_type", { length: 50 }).notNull(),
  defaultCategory: varchar("default_category", { length: 100 }),
  defaultPriority: varchar("default_priority", { length: 50 }),
  defaultUrgency: varchar("default_urgency", { length: 50 }),
  defaultStatus: varchar("default_status", { length: 50 }),
  defaultAssigneeId: uuid("default_assignee_id"),
  defaultAssignmentGroup: varchar("default_assignment_group", { length: 100 }),
  
  // Auto response settings
  autoResponseEnabled: boolean("auto_response_enabled").default(false),
  autoResponseTemplateId: uuid("auto_response_template_id"),
  autoResponseDelay: integer("auto_response_delay").default(0),
  
  // Ticket management
  extractTicketNumber: boolean("extract_ticket_number").default(false),
  createDuplicateTickets: boolean("create_duplicate_tickets").default(false),
  notifyAssignee: boolean("notify_assignee").default(false),
  
  // Additional metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Response Templates - Templates for automated email responses
export const emailResponseTemplates = pgTable("email_response_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateType: varchar("template_type", { length: 50 }).notNull().default("auto_response"),
  
  // Email content
  subjectTemplate: text("subject_template").notNull(),
  bodyTemplateHtml: text("body_template_html"),
  bodyTemplateText: text("body_template_text"),
  
  // Settings
  priority: integer("priority").default(1),
  languageCode: varchar("language_code", { length: 10 }).default('en'),
  variableMapping: jsonb("variable_mapping").default({}), 
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Processing Logs - Track processed emails for debugging  
export const emailProcessingLogs = pgTable("email_processing_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Email details
  messageId: varchar("message_id", { length: 255 }),
  emailFrom: varchar("email_from", { length: 255 }),
  emailSubject: text("email_subject"),
  processedAt: timestamp("processed_at"),
  
  // Processing results
  ruleId: uuid("rule_id"),
  actionTaken: varchar("action_taken", { length: 50 }),
  ticketId: uuid("ticket_id"),
  
  // Processing details
  processingStatus: varchar("processing_status", { length: 50 }).default("processed"),
  errorMessage: text("error_message"),
  processingTimeMs: integer("processing_time_ms"),
  
  // Additional metadata
  metadata: jsonb("metadata").default({}),
});

// Zod schemas for validation
export const insertEmailProcessingRuleSchema = createInsertSchema(emailProcessingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEmailProcessingRuleSchema = insertEmailProcessingRuleSchema.partial();

export const insertEmailResponseTemplateSchema = createInsertSchema(emailResponseTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEmailResponseTemplateSchema = insertEmailResponseTemplateSchema.partial();

export const insertEmailProcessingLogSchema = createInsertSchema(emailProcessingLogs).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type EmailProcessingRule = typeof emailProcessingRules.$inferSelect;
export type InsertEmailProcessingRule = z.infer<typeof insertEmailProcessingRuleSchema>;
export type UpdateEmailProcessingRule = z.infer<typeof updateEmailProcessingRuleSchema>;

export type EmailResponseTemplate = typeof emailResponseTemplates.$inferSelect;
export type InsertEmailResponseTemplate = z.infer<typeof insertEmailResponseTemplateSchema>;
export type UpdateEmailResponseTemplate = z.infer<typeof updateEmailResponseTemplateSchema>;

export type EmailProcessingLog = typeof emailProcessingLogs.$inferSelect;
export type InsertEmailProcessingLog = z.infer<typeof insertEmailProcessingLogSchema>;

// Enums for validation
export const actionTypes = [
  'create_ticket',
  'update_ticket', 
  'auto_respond',
  'forward',
  'ignore'
] as const;

export const templateTypes = [
  'auto_response',
  'acknowledgment',
  'status_update', 
  'resolution',
  'escalation'
] as const;

export const processingStatuses = [
  'processed',
  'failed',
  'ignored',
  'pending'
] as const;

export type ActionType = typeof actionTypes[number];
export type TemplateType = typeof templateTypes[number];
export type ProcessingStatus = typeof processingStatuses[number];
