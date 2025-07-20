import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================================
// OMNIBRIDGE COMMUNICATION MODULE
// Unified communication management for all channels
// =====================================================

// Communication Channels - Core channel configuration
export const omnibridgeChannels = pgTable("omnibridge_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Channel identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  channelType: varchar("channel_type", { length: 50 }).notNull(), // email, whatsapp, telegram, sms, chatbot
  provider: varchar("provider", { length: 100 }), // gmail, outlook, twilio, telegram_bot
  
  // Configuration
  config: jsonb("config").default({}), // Provider-specific settings
  credentials: jsonb("credentials").default({}), // Encrypted credentials
  isActive: boolean("is_active").default(true),
  isMonitoring: boolean("is_monitoring").default(false),
  
  // Rate limiting and quotas
  messageLimit: integer("message_limit").default(1000),
  dailyQuota: integer("daily_quota").default(10000),
  currentUsage: integer("current_usage").default(0),
  
  // Health monitoring
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: varchar("health_status", { length: 20 }).default("unknown"), // healthy, degraded, error
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  
  // Metadata
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message Inbox - Unified inbox for all communication channels
export const omnibridgeInbox = pgTable("omnibridge_inbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Message identification
  messageId: varchar("message_id", { length: 255 }).unique(), // External message ID
  threadId: varchar("thread_id", { length: 255 }), // Conversation thread
  channelId: uuid("channel_id").notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(),
  
  // Sender/Recipient info
  fromContact: varchar("from_contact", { length: 255 }).notNull(), // Email, phone, username
  fromName: varchar("from_name", { length: 255 }),
  toContact: varchar("to_contact", { length: 255 }),
  
  // Message content
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  
  // Attachments and media
  hasAttachments: boolean("has_attachments").default(false),
  attachmentCount: integer("attachment_count").default(0),
  attachmentDetails: jsonb("attachment_details").default([]),
  mediaType: varchar("media_type", { length: 50 }), // text, image, audio, video, document
  
  // Classification and processing
  direction: varchar("direction", { length: 10 }).default("inbound"), // inbound, outbound
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  category: varchar("category", { length: 100 }),
  tags: text("tags"), // Comma-separated tags
  
  // Processing status
  isRead: boolean("is_read").default(false),
  isProcessed: boolean("is_processed").default(false),
  isArchived: boolean("is_archived").default(false),
  processingRuleId: uuid("processing_rule_id"),
  ticketId: uuid("ticket_id"),
  
  // Response tracking
  needsResponse: boolean("needs_response").default(false),
  responseDeadline: timestamp("response_deadline"),
  respondedAt: timestamp("responded_at"),
  
  // Original message metadata
  originalHeaders: jsonb("original_headers").default({}),
  providerData: jsonb("provider_data").default({}),
  
  // Timestamps
  messageDate: timestamp("message_date"),
  receivedAt: timestamp("received_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Processing Rules - Unified rules for all communication channels
export const omnibridgeProcessingRules = pgTable("omnibridge_processing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Rule identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  
  // Channel targeting
  applicableChannels: jsonb("applicable_channels").default([]), // Array of channel types
  specificChannelIds: jsonb("specific_channel_ids").default([]), // Specific channel instances
  
  // Matching conditions
  conditions: jsonb("conditions").default({}), // Complex condition logic
  senderPattern: varchar("sender_pattern", { length: 255 }),
  subjectPattern: varchar("subject_pattern", { length: 255 }),
  contentPattern: text("content_pattern"),
  keywordTriggers: text("keyword_triggers"), // Comma-separated keywords
  
  // Time-based conditions
  timeRestrictions: jsonb("time_restrictions").default({}), // Business hours, days of week
  urgencyDetection: boolean("urgency_detection").default(true),
  
  // Actions configuration
  actionType: varchar("action_type", { length: 50 }).notNull(), // create_ticket, auto_respond, forward, escalate, categorize
  actionConfig: jsonb("action_config").default({}),
  
  // Ticket creation settings
  defaultCategory: varchar("default_category", { length: 100 }),
  defaultPriority: varchar("default_priority", { length: 50 }),
  defaultUrgency: varchar("default_urgency", { length: 50 }),
  defaultStatus: varchar("default_status", { length: 50 }),
  defaultAssigneeId: uuid("default_assignee_id"),
  defaultAssignmentGroup: varchar("default_assignment_group", { length: 100 }),
  
  // Auto response settings
  autoResponseEnabled: boolean("auto_response_enabled").default(false),
  autoResponseTemplateId: uuid("auto_response_template_id"),
  autoResponseDelay: integer("auto_response_delay").default(0), // Minutes
  
  // Escalation settings
  escalationEnabled: boolean("escalation_enabled").default(false),
  escalationTimeMinutes: integer("escalation_time_minutes").default(240), // 4 hours
  escalationTargetGroup: varchar("escalation_target_group", { length: 100 }),
  
  // Additional features
  extractTicketNumber: boolean("extract_ticket_number").default(true),
  preventDuplicateTickets: boolean("prevent_duplicate_tickets").default(true),
  notifyAssignee: boolean("notify_assignee").default(true),
  sendAcknowledgment: boolean("send_acknowledgment").default(false),
  
  // Rule execution tracking
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  averageExecutionTime: integer("average_execution_time").default(0), // Milliseconds
  
  // Metadata
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Response Templates - Multi-channel response templates
export const omnibridgeResponseTemplates = pgTable("omnibridge_response_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateType: varchar("template_type", { length: 50 }).notNull(), // auto_response, acknowledgment, escalation, resolution
  category: varchar("category", { length: 100 }), // support, sales, billing
  
  // Channel compatibility
  supportedChannels: jsonb("supported_channels").default([]), // Which channels can use this template
  channelVariants: jsonb("channel_variants").default({}), // Channel-specific content variations
  
  // Content for different channels
  emailSubject: text("email_subject"),
  emailBodyHtml: text("email_body_html"),
  emailBodyText: text("email_body_text"),
  smsContent: text("sms_content"),
  whatsappContent: text("whatsapp_content"),
  chatbotContent: text("chatbot_content"),
  
  // Template variables and personalization
  variableMapping: jsonb("variable_mapping").default({}),
  personalizationLevel: varchar("personalization_level", { length: 20 }).default("basic"), // basic, advanced, ai
  
  // Conditions for template usage
  triggerConditions: jsonb("trigger_conditions").default({}),
  languageCode: varchar("language_code", { length: 10 }).default("pt-BR"),
  
  // Settings
  priority: integer("priority").default(1),
  requiresApproval: boolean("requires_approval").default(false),
  isActive: boolean("is_active").default(true),
  
  // Signature settings
  signatureId: uuid("signature_id"),
  includeSignature: boolean("include_signature").default(true),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  successRate: integer("success_rate").default(0), // Percentage
  
  // A/B testing support
  isVariant: boolean("is_variant").default(false),
  parentTemplateId: uuid("parent_template_id"),
  variantWeight: integer("variant_weight").default(100),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Signatures - Signatures for different support groups across channels
export const omnibridgeSignatures = pgTable("omnibridge_signatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Signature identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  supportGroup: varchar("support_group", { length: 100 }).notNull(), // Level 1, Level 2, Billing, Sales
  
  // Multi-channel signature content
  emailSignatureHtml: text("email_signature_html"),
  emailSignatureText: text("email_signature_text"),
  smsSignature: text("sms_signature"),
  whatsappSignature: text("whatsapp_signature"),
  chatbotSignature: text("chatbot_signature"),
  
  // Contact information
  contactName: varchar("contact_name", { length: 255 }),
  contactTitle: varchar("contact_title", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactWhatsapp: varchar("contact_whatsapp", { length: 50 }),
  
  // Company information
  companyName: varchar("company_name", { length: 255 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  companyAddress: text("company_address"),
  
  // Branding and assets
  logoUrl: varchar("logo_url", { length: 500 }),
  brandColors: jsonb("brand_colors").default({}),
  socialLinks: jsonb("social_links").default({}),
  
  // Settings
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  autoInclude: boolean("auto_include").default(true),
  
  // Channel-specific settings
  channelSettings: jsonb("channel_settings").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Processing Logs - Comprehensive logging for all channels
export const omnibridgeProcessingLogs = pgTable("omnibridge_processing_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Message identification
  messageId: varchar("message_id", { length: 255 }),
  inboxId: uuid("inbox_id"),
  channelId: uuid("channel_id"),
  channelType: varchar("channel_type", { length: 50 }),
  
  // Message details
  messageFrom: varchar("message_from", { length: 255 }),
  messageSubject: text("message_subject"),
  messageDirection: varchar("message_direction", { length: 10 }),
  
  // Processing details
  processingRuleId: uuid("processing_rule_id"),
  actionTaken: varchar("action_taken", { length: 50 }),
  processingStatus: varchar("processing_status", { length: 50 }).default("processed"), // processed, failed, ignored, pending
  
  // Results
  ticketId: uuid("ticket_id"),
  responseTemplateId: uuid("response_template_id"),
  escalationTriggered: boolean("escalation_triggered").default(false),
  
  // Performance metrics
  processingTimeMs: integer("processing_time_ms"),
  queueWaitTimeMs: integer("queue_wait_time_ms").default(0),
  
  // Error handling
  errorMessage: text("error_message"),
  errorCode: varchar("error_code", { length: 50 }),
  retryCount: integer("retry_count").default(0),
  
  // Additional context
  metadata: jsonb("metadata").default({}),
  
  processedAt: timestamp("processed_at").defaultNow(),
});

// Channel Analytics - Performance metrics for communication channels
export const omnibridgeAnalytics = pgTable("omnibridge_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Time period
  date: timestamp("date").notNull(),
  hour: integer("hour"), // Hour of day (0-23) for hourly metrics
  
  // Channel identification
  channelId: uuid("channel_id"),
  channelType: varchar("channel_type", { length: 50 }),
  
  // Volume metrics
  inboundMessages: integer("inbound_messages").default(0),
  outboundMessages: integer("outbound_messages").default(0),
  totalMessages: integer("total_messages").default(0),
  
  // Processing metrics
  processedMessages: integer("processed_messages").default(0),
  failedMessages: integer("failed_messages").default(0),
  ignoredMessages: integer("ignored_messages").default(0),
  
  // Response metrics
  autoResponses: integer("auto_responses").default(0),
  manualResponses: integer("manual_responses").default(0),
  averageResponseTimeMinutes: integer("average_response_time_minutes").default(0),
  
  // Quality metrics
  ticketsCreated: integer("tickets_created").default(0),
  escalationsTriggered: integer("escalations_triggered").default(0),
  customerSatisfactionScore: integer("customer_satisfaction_score"), // 1-100
  
  // Performance metrics
  systemResponseTimeMs: integer("system_response_time_ms").default(0),
  errorRate: integer("error_rate").default(0), // Percentage
  uptime: integer("uptime").default(100), // Percentage
  
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================================================
// ZOD SCHEMAS FOR VALIDATION
// =====================================================

export const insertOmnibridgeChannelSchema = createInsertSchema(omnibridgeChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOmnibridgeChannelSchema = insertOmnibridgeChannelSchema.partial();

export const insertOmnibridgeInboxSchema = createInsertSchema(omnibridgeInbox).omit({
  id: true,
  receivedAt: true,
});

export const updateOmnibridgeInboxSchema = insertOmnibridgeInboxSchema.partial();

export const insertOmnibridgeProcessingRuleSchema = createInsertSchema(omnibridgeProcessingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  executionCount: true,
  lastExecuted: true,
  averageExecutionTime: true,
});

export const updateOmnibridgeProcessingRuleSchema = insertOmnibridgeProcessingRuleSchema.partial();

export const insertOmnibridgeResponseTemplateSchema = createInsertSchema(omnibridgeResponseTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsed: true,
  successRate: true,
});

export const updateOmnibridgeResponseTemplateSchema = insertOmnibridgeResponseTemplateSchema.partial();

export const insertOmnibridgeSignatureSchema = createInsertSchema(omnibridgeSignatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOmnibridgeSignatureSchema = insertOmnibridgeSignatureSchema.partial();

export const insertOmnibridgeProcessingLogSchema = createInsertSchema(omnibridgeProcessingLogs).omit({
  id: true,
  processedAt: true,
});

export const insertOmnibridgeAnalyticsSchema = createInsertSchema(omnibridgeAnalytics).omit({
  id: true,
  createdAt: true,
});

// =====================================================
// TYPESCRIPT TYPES
// =====================================================

export type OmnibridgeChannel = typeof omnibridgeChannels.$inferSelect;
export type InsertOmnibridgeChannel = z.infer<typeof insertOmnibridgeChannelSchema>;
export type UpdateOmnibridgeChannel = z.infer<typeof updateOmnibridgeChannelSchema>;

export type OmnibridgeInboxMessage = typeof omnibridgeInbox.$inferSelect;
export type InsertOmnibridgeInboxMessage = z.infer<typeof insertOmnibridgeInboxSchema>;
export type UpdateOmnibridgeInboxMessage = z.infer<typeof updateOmnibridgeInboxSchema>;

export type OmnibridgeProcessingRule = typeof omnibridgeProcessingRules.$inferSelect;
export type InsertOmnibridgeProcessingRule = z.infer<typeof insertOmnibridgeProcessingRuleSchema>;
export type UpdateOmnibridgeProcessingRule = z.infer<typeof updateOmnibridgeProcessingRuleSchema>;

export type OmnibridgeResponseTemplate = typeof omnibridgeResponseTemplates.$inferSelect;
export type InsertOmnibridgeResponseTemplate = z.infer<typeof insertOmnibridgeResponseTemplateSchema>;
export type UpdateOmnibridgeResponseTemplate = z.infer<typeof updateOmnibridgeResponseTemplateSchema>;

export type OmnibridgeSignature = typeof omnibridgeSignatures.$inferSelect;
export type InsertOmnibridgeSignature = z.infer<typeof insertOmnibridgeSignatureSchema>;
export type UpdateOmnibridgeSignature = z.infer<typeof updateOmnibridgeSignatureSchema>;

export type OmnibridgeProcessingLog = typeof omnibridgeProcessingLogs.$inferSelect;
export type InsertOmnibridgeProcessingLog = z.infer<typeof insertOmnibridgeProcessingLogSchema>;

export type OmnibridgeAnalytics = typeof omnibridgeAnalytics.$inferSelect;
export type InsertOmnibridgeAnalytics = z.infer<typeof insertOmnibridgeAnalyticsSchema>;

// =====================================================
// ENUMS AND CONSTANTS
// =====================================================

export const channelTypes = [
  'email',
  'whatsapp', 
  'telegram',
  'sms',
  'chatbot',
  'webchat',
  'voice',
  'social_media'
] as const;

export const messageDirections = [
  'inbound',
  'outbound'
] as const;

export const messagePriorities = [
  'low',
  'normal', 
  'high',
  'urgent'
] as const;

export const actionTypes = [
  'create_ticket',
  'update_ticket',
  'auto_respond',
  'forward',
  'escalate',
  'categorize',
  'ignore',
  'archive'
] as const;

export const templateTypes = [
  'auto_response',
  'acknowledgment',
  'status_update',
  'resolution',
  'escalation',
  'welcome',
  'goodbye',
  'hold_notification'
] as const;

export const processingStatuses = [
  'processed',
  'failed',
  'ignored',
  'pending',
  'retrying'
] as const;

export const healthStatuses = [
  'healthy',
  'degraded',
  'error',
  'unknown'
] as const;

export type ChannelType = typeof channelTypes[number];
export type MessageDirection = typeof messageDirections[number];
export type MessagePriority = typeof messagePriorities[number];
export type ActionType = typeof actionTypes[number];
export type TemplateType = typeof templateTypes[number];
export type ProcessingStatus = typeof processingStatuses[number];
export type HealthStatus = typeof healthStatuses[number];