// OmniBridge Logging & Learning System Schema
// Sistema completo de rastreamento de conversas e aprendizado contínuo para agentes de IA

import { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const feedbackRatingEnum = pgEnum('feedback_rating', ['excellent', 'good', 'neutral', 'poor', 'terrible']);
export const improvementTypeEnum = pgEnum('improvement_type', ['prompt_update', 'action_config', 'field_mapping', 'context_enhancement']);

// 1. Conversation Logs - Registro de sessões de conversa
export const conversationLogs = pgTable('conversation_logs', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  agentId: integer('agent_id').notNull(), // Reference to omnibridge_ai_agents
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  channelType: varchar('channel_type', { length: 50 }), // email, whatsapp, slack, etc
  channelIdentifier: varchar('channel_identifier', { length: 255 }), // email address, phone, etc
  userId: integer('user_id'), // User who interacted with the agent
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  totalMessages: integer('total_messages').default(0),
  totalActions: integer('total_actions').default(0),
  escalatedToHuman: boolean('escalated_to_human').default(false),
  escalatedAt: timestamp('escalated_at'),
  escalatedToUserId: integer('escalated_to_user_id'),
  metadata: jsonb('metadata'), // Additional context (browser info, location, etc)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Conversation Messages - Mensagens individuais
export const conversationMessages = pgTable('conversation_messages', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  conversationId: integer('conversation_id').notNull().references(() => conversationLogs.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  rawContent: text('raw_content'), // Original content before processing
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  processingTimeMs: integer('processing_time_ms'), // Time to generate response
  tokenCount: integer('token_count'), // Number of tokens used
  contextWindowSize: integer('context_window_size'), // Context window at this message
  intentDetected: varchar('intent_detected', { length: 255 }), // Detected user intent
  confidence: integer('confidence'), // Confidence score 0-100
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Action Executions - Log de ferramentas/ações executadas
export const actionExecutions = pgTable('action_executions', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  messageId: integer('message_id').notNull().references(() => conversationMessages.id, { onDelete: 'cascade' }),
  conversationId: integer('conversation_id').notNull().references(() => conversationLogs.id, { onDelete: 'cascade' }),
  actionName: varchar('action_name', { length: 255 }).notNull(), // createTicket, sendEmail, etc
  actionType: varchar('action_type', { length: 50 }), // entity, communication, integration, etc
  parameters: jsonb('parameters').notNull(), // Input parameters sent to action
  result: jsonb('result'), // Output/result from action
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  executionTimeMs: integer('execution_time_ms').notNull(),
  retryCount: integer('retry_count').default(0),
  triggeredBy: varchar('triggered_by', { length: 50 }).default('ai'), // ai, user, system
  metadata: jsonb('metadata'),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Feedback Annotations - Anotações e feedback sobre trechos
export const feedbackAnnotations = pgTable('feedback_annotations', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  conversationId: integer('conversation_id').references(() => conversationLogs.id, { onDelete: 'cascade' }),
  messageId: integer('message_id').references(() => conversationMessages.id, { onDelete: 'cascade' }),
  actionExecutionId: integer('action_execution_id').references(() => actionExecutions.id, { onDelete: 'cascade' }),
  rating: feedbackRatingEnum('rating'),
  category: varchar('category', { length: 100 }), // response_quality, action_accuracy, tone, speed
  tags: jsonb('tags'), // Array of tags: ["pergunta-mal-formulada", "resposta-genérica"]
  notes: text('notes'), // Detailed feedback notes
  correctiveAction: text('corrective_action'), // What should have been done
  expectedBehavior: text('expected_behavior'), // What was expected
  actualBehavior: text('actual_behavior'), // What actually happened
  severity: varchar('severity', { length: 20 }), // low, medium, high, critical
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: integer('resolved_by'), // User ID who resolved
  annotatedBy: integer('annotated_by').notNull(), // User ID who created annotation
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. Agent Improvements - Melhorias baseadas no feedback
export const agentImprovements = pgTable('agent_improvements', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  agentId: integer('agent_id').notNull(), // Reference to omnibridge_ai_agents
  basedOnAnnotationId: integer('based_on_annotation_id').references(() => feedbackAnnotations.id, { onDelete: 'set null' }),
  improvementType: improvementTypeEnum('improvement_type').notNull(),
  description: text('description').notNull(),
  beforeConfig: jsonb('before_config'), // Configuration before change
  afterConfig: jsonb('after_config'), // Configuration after change
  promptUpdate: text('prompt_update'), // If prompt was updated
  impactMetrics: jsonb('impact_metrics'), // Metrics showing impact of change
  applied: boolean('applied').default(false),
  appliedAt: timestamp('applied_at'),
  appliedBy: integer('applied_by'), // User ID who applied
  rollbackAvailable: boolean('rollback_available').default(true),
  version: integer('version').notNull().default(1),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const conversationLogsRelations = relations(conversationLogs, ({ many }) => ({
  messages: many(conversationMessages),
  actions: many(actionExecutions),
  feedback: many(feedbackAnnotations),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one, many }) => ({
  conversation: one(conversationLogs, {
    fields: [conversationMessages.conversationId],
    references: [conversationLogs.id],
  }),
  actions: many(actionExecutions),
  feedback: many(feedbackAnnotations),
}));

export const actionExecutionsRelations = relations(actionExecutions, ({ one, many }) => ({
  conversation: one(conversationLogs, {
    fields: [actionExecutions.conversationId],
    references: [conversationLogs.id],
  }),
  message: one(conversationMessages, {
    fields: [actionExecutions.messageId],
    references: [conversationMessages.id],
  }),
  feedback: many(feedbackAnnotations),
}));

export const feedbackAnnotationsRelations = relations(feedbackAnnotations, ({ one }) => ({
  conversation: one(conversationLogs, {
    fields: [feedbackAnnotations.conversationId],
    references: [conversationLogs.id],
  }),
  message: one(conversationMessages, {
    fields: [feedbackAnnotations.messageId],
    references: [conversationMessages.id],
  }),
  actionExecution: one(actionExecutions, {
    fields: [feedbackAnnotations.actionExecutionId],
    references: [actionExecutions.id],
  }),
  improvement: one(agentImprovements, {
    fields: [feedbackAnnotations.id],
    references: [agentImprovements.basedOnAnnotationId],
  }),
}));

export const agentImprovementsRelations = relations(agentImprovements, ({ one }) => ({
  annotation: one(feedbackAnnotations, {
    fields: [agentImprovements.basedOnAnnotationId],
    references: [feedbackAnnotations.id],
  }),
}));

// Zod Insert Schemas
export const insertConversationLogSchema = createInsertSchema(conversationLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({
  id: true,
  createdAt: true,
});

export const insertActionExecutionSchema = createInsertSchema(actionExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackAnnotationSchema = createInsertSchema(feedbackAnnotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentImprovementSchema = createInsertSchema(agentImprovements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript Types
export type ConversationLog = typeof conversationLogs.$inferSelect;
export type InsertConversationLog = z.infer<typeof insertConversationLogSchema>;

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;

export type ActionExecution = typeof actionExecutions.$inferSelect;
export type InsertActionExecution = z.infer<typeof insertActionExecutionSchema>;

export type FeedbackAnnotation = typeof feedbackAnnotations.$inferSelect;
export type InsertFeedbackAnnotation = z.infer<typeof insertFeedbackAnnotationSchema>;

export type AgentImprovement = typeof agentImprovements.$inferSelect;
export type InsertAgentImprovement = z.infer<typeof insertAgentImprovementSchema>;
