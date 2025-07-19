
import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./base";

// Email Processing Rules - Controls how incoming emails are processed
export const emailProcessingRules = pgTable("email_processing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Rule identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priority: integer("priority").default(0), // Higher number = higher priority
  isActive: boolean("is_active").default(true),
  
  // Email matching criteria
  fromEmailPattern: varchar("from_email_pattern", { length: 500 }), // Regex pattern for sender email
  subjectPattern: varchar("subject_pattern", { length: 500 }), // Regex pattern for subject
  bodyPattern: text("body_pattern"), // Regex pattern for email body
  attachmentRequired: boolean("attachment_required").default(false),
  
  // Processing actions
  actionType: varchar("action_type", { length: 50 }).notNull().default("create_ticket"), 
  // Types: create_ticket, update_ticket, auto_respond, forward, ignore
  
  // Ticket creation settings
  defaultCategory: varchar("default_category", { length: 100 }),
  defaultPriority: varchar("default_priority", { length: 20 }).default("medium"),
  defaultUrgency: varchar("default_urgency", { length: 20 }).default("medium"),
  defaultStatus: varchar("default_status", { length: 50 }).default("open"),
  defaultAssigneeId: uuid("default_assignee_id"),
  defaultAssignmentGroup: varchar("default_assignment_group", { length: 100 }),
  
  // Auto-response settings
  autoResponseEnabled: boolean("auto_response_enabled").default(false),
  autoResponseTemplateId: uuid("auto_response_template_id"),
  autoResponseDelay: integer("auto_response_delay").default(0), // Minutes to wait before sending
  
  // Advanced settings
  extractTicketNumber: boolean("extract_ticket_number").default(true), // Try to find existing ticket numbers
  createDuplicateTickets: boolean("create_duplicate_tickets").default(false),
  notifyAssignee: boolean("notify_assignee").default(true),
  
  // Metadata
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Response Templates - Templates for automated email responses
export const emailResponseTemplates = pgTable("email_response_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateType: varchar("template_type", { length: 50 }).notNull().default("auto_response"),
  // Types: auto_response, acknowledgment, status_update, resolution, escalation
  
  // Email content
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html"),
  bodyText: text("body_text"),
  
  // Template variables and conditions
  availableVariables: jsonb("available_variables").default([]), // List of available merge fields
  conditionalLogic: jsonb("conditional_logic").default({}), // Rules for when to use this template
  
  // Settings
  isDefault: boolean("is_default").default(false), // Default template for this type
  isActive: boolean("is_active").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Scheduling
  sendDelay: integer("send_delay").default(0), // Minutes to wait before sending
  businessHoursOnly: boolean("business_hours_only").default(false),
  
  // Tracking
  trackOpens: boolean("track_opens").default(false),
  trackClicks: boolean("track_clicks").default(false),
  
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Processing Logs - Track processed emails for debugging
export const emailProcessingLogs = pgTable("email_processing_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Email details
  messageId: varchar("message_id", { length: 255 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  receivedAt: timestamp("received_at").notNull(),
  
  // Processing results
  ruleId: uuid("rule_id").references(() => emailProcessingRules.id),
  actionTaken: varchar("action_taken", { length: 50 }).notNull(),
  ticketId: uuid("ticket_id"), // If a ticket was created/updated
  responseTemplateId: uuid("response_template_id"),
  
  // Processing details
  processingStatus: varchar("processing_status", { length: 50 }).notNull().default("processed"),
  // Status: processed, failed, ignored, pending
  errorMessage: text("error_message"),
  processingTime: integer("processing_time"), // Milliseconds
  
  // Email content (for debugging)
  emailContent: jsonb("email_content").default({}),
  extractedData: jsonb("extracted_data").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
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
