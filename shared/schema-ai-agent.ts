// ========================================
// AI CONVERSATIONAL AGENT SCHEMA
// ========================================
// Schema for intelligent conversational AI agents that can:
// - Execute actions across the system
// - Learn from feedback
// - Handle multi-turn conversations
// - Validate prerequisites and dependencies

import { pgTable, varchar, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ========================================
// ENUMS
// ========================================

export const agentStatusEnum = pgEnum('agent_status', [
  'active',
  'inactive',
  'training',
  'testing'
]);

export const conversationStatusEnum = pgEnum('conversation_status', [
  'active',
  'waiting_input',
  'waiting_confirmation',
  'executing_action',
  'completed',
  'escalated',
  'failed',
  'timeout'
]);

export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'agent',
  'system'
]);

export const sentimentEnum = pgEnum('sentiment', [
  'very_positive',
  'positive',
  'neutral',
  'negative',
  'very_negative',
  'urgent'
]);

export const logLevelEnum = pgEnum('log_level', [
  'debug',
  'info',
  'warning',
  'error',
  'critical'
]);

export const feedbackRatingEnum = pgEnum('feedback_rating', [
  'excellent',
  'good',
  'acceptable',
  'needs_improvement',
  'poor'
]);

export const actionStatusEnum = pgEnum('action_status', [
  'pending',
  'validating',
  'collecting_data',
  'confirming',
  'executing',
  'completed',
  'failed',
  'cancelled'
]);

// ========================================
// MAIN TABLES
// ========================================

// AI Agents - Main configuration
export const aiAgents = pgTable('ai_agents', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  
  // Basic Info
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: agentStatusEnum('status').default('active').notNull(),
  
  // Configuration via Prompt
  configPrompt: text('config_prompt').notNull(), // Original prompt from user
  
  // Generated Configuration
  personality: jsonb('personality').$type<{
    tone: string; // 'professional', 'friendly', 'technical', 'empathetic'
    language: string; // 'pt-BR', 'en', 'es'
    greeting: string;
    fallbackMessage: string;
    confirmationStyle: string; // 'detailed', 'brief', 'structured'
  }>().notNull(),
  
  // Enabled Actions (array of action types)
  enabledActions: jsonb('enabled_actions').$type<string[]>().default([]),
  
  // Permissions Matrix
  permissions: jsonb('permissions').$type<{
    [module: string]: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
    };
  }>().notNull(),
  
  // Behavior Rules
  behaviorRules: jsonb('behavior_rules').$type<{
    requireConfirmation: string[]; // Actions that require confirmation
    autoEscalateKeywords: string[]; // Keywords that trigger escalation
    maxConversationTurns: number;
    collectionStrategy: 'sequential' | 'all_at_once' | 'adaptive';
    errorHandling: 'retry' | 'escalate' | 'fallback';
  }>().notNull(),
  
  // AI Model Configuration
  aiConfig: jsonb('ai_config').$type<{
    model: string; // 'gpt-4', 'gpt-3.5-turbo'
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  }>().notNull(),
  
  // Channels where agent operates
  channels: jsonb('channels').$type<string[]>().default([]), // ['email', 'whatsapp', 'chat', 'telegram']
  
  // Statistics
  stats: jsonb('stats').$type<{
    totalConversations: number;
    successfulActions: number;
    failedActions: number;
    escalations: number;
    averageResponseTime: number;
    averageSatisfaction: number;
  }>().default({
    totalConversations: 0,
    successfulActions: 0,
    failedActions: 0,
    escalations: 0,
    averageResponseTime: 0,
    averageSatisfaction: 0
  }),
  
  // Learning Configuration
  learningEnabled: boolean('learning_enabled').default(true),
  lastLearnedAt: timestamp('last_learned_at'),
  
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(1),
  
  createdBy: varchar('created_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  tenantIdIdx: index('ai_agents_tenant_id_idx').on(table.tenantId),
  statusIdx: index('ai_agents_status_idx').on(table.status)
}));

// AI Actions - Available actions that agents can execute
export const aiActions = pgTable('ai_actions', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  
  // Action Definition
  actionType: varchar('action_type', { length: 100 }).notNull().unique(), // 'create_ticket', 'search_customer', etc.
  category: varchar('category', { length: 50 }).notNull(), // 'tickets', 'customers', 'notifications', etc.
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  // Prerequisites
  prerequisites: jsonb('prerequisites').$type<Array<{
    check: string; // 'customer_exists', 'ticket_not_duplicate', etc.
    actionIfFails?: string; // Action to execute if check fails
    errorMessage?: string;
  }>>().default([]),
  
  // Required and Optional Parameters
  requiredParams: jsonb('required_params').$type<Array<{
    name: string;
    type: string; // 'string', 'number', 'email', 'phone', 'date', 'select'
    description: string;
    validation?: any; // Validation rules
    extractionPrompt?: string; // Prompt to extract this param from conversation
  }>>().notNull(),
  
  optionalParams: jsonb('optional_params').$type<Array<{
    name: string;
    type: string;
    description: string;
    defaultValue?: any;
  }>>().default([]),
  
  // Execution Configuration
  requiresConfirmation: boolean('requires_confirmation').default(true),
  confirmationTemplate: text('confirmation_template'), // Template for confirmation message
  successTemplate: text('success_template'), // Template for success message
  errorTemplate: text('error_template'), // Template for error message
  
  // Rate Limiting
  rateLimitPerHour: integer('rate_limit_per_hour'),
  rateLimitPerDay: integer('rate_limit_per_day'),
  
  // Statistics
  executionCount: integer('execution_count').default(0),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  averageExecutionTime: integer('average_execution_time').default(0), // milliseconds
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  actionTypeIdx: index('ai_actions_action_type_idx').on(table.actionType),
  categoryIdx: index('ai_actions_category_idx').on(table.category)
}));

// AI Conversations - Active and historical conversations
export const aiConversations = pgTable('ai_conversations', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  
  // User/Channel Info
  userId: varchar('user_id', { length: 100 }).notNull(), // Email, phone, or user ID
  channelId: varchar('channel_id', { length: 36 }),
  channelType: varchar('channel_type', { length: 50 }).notNull(), // 'email', 'whatsapp', 'chat'
  
  // Conversation State
  status: conversationStatusEnum('status').default('active').notNull(),
  currentStep: varchar('current_step', { length: 100 }).default('greeting'),
  
  // Detected Intent and Action
  detectedIntent: varchar('detected_intent', { length: 100 }),
  intendedAction: varchar('intended_action', { length: 100 }), // Action agent plans to execute
  
  // Collected Data
  collectedParams: jsonb('collected_params').default({}), // Parameters collected so far
  missingParams: jsonb('missing_params').$type<string[]>().default([]), // Still needed
  
  // Context and Memory
  context: jsonb('context').$type<{
    customerData?: any;
    ticketData?: any;
    relatedEntities?: any;
    conversationSummary?: string;
  }>().default({}),
  
  // Sentiment Analysis
  overallSentiment: sentimentEnum('overall_sentiment'),
  sentimentHistory: jsonb('sentiment_history').$type<Array<{
    timestamp: string;
    sentiment: string;
    confidence: number;
  }>>().default([]),
  
  // Metrics
  turnCount: integer('turn_count').default(0),
  actionExecutions: integer('action_executions').default(0),
  
  // Timestamps
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'), // Auto-cleanup old conversations
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  tenantIdIdx: index('ai_conversations_tenant_id_idx').on(table.tenantId),
  agentIdIdx: index('ai_conversations_agent_id_idx').on(table.agentId),
  statusIdx: index('ai_conversations_status_idx').on(table.status),
  userIdIdx: index('ai_conversations_user_id_idx').on(table.userId)
}));

// AI Conversation Messages - Individual messages in conversations
export const aiConversationMessages = pgTable('ai_conversation_messages', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar('conversation_id', { length: 36 }).notNull(),
  
  // Message Content
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  
  // Metadata
  metadata: jsonb('metadata').$type<{
    sentiment?: string;
    detectedIntent?: string;
    extractedEntities?: any;
    confidence?: number;
    processingTime?: number;
  }>().default({}),
  
  // AI Processing
  aiProcessed: boolean('ai_processed').default(false),
  aiResponse: text('ai_response'),
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index('ai_conv_messages_conversation_id_idx').on(table.conversationId),
  timestampIdx: index('ai_conv_messages_timestamp_idx').on(table.timestamp)
}));

// AI Conversation Logs - Detailed logs for troubleshooting
export const aiConversationLogs = pgTable('ai_conversation_logs', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar('conversation_id', { length: 36 }).notNull(),
  
  // Log Details
  level: logLevelEnum('level').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'intent_detection', 'validation', 'execution', etc.
  message: text('message').notNull(),
  
  // Context
  details: jsonb('details').default({}),
  stackTrace: text('stack_trace'),
  
  // Timing
  duration: integer('duration'), // milliseconds
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index('ai_conv_logs_conversation_id_idx').on(table.conversationId),
  levelIdx: index('ai_conv_logs_level_idx').on(table.level),
  timestampIdx: index('ai_conv_logs_timestamp_idx').on(table.timestamp)
}));

// AI Action Executions - Track all action executions
export const aiActionExecutions = pgTable('ai_action_executions', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar('conversation_id', { length: 36 }).notNull(),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  actionType: varchar('action_type', { length: 100 }).notNull(),
  
  // Execution State
  status: actionStatusEnum('status').default('pending').notNull(),
  
  // Input/Output
  inputParams: jsonb('input_params').notNull(),
  validationResult: jsonb('validation_result'),
  executionResult: jsonb('execution_result'),
  errorDetails: jsonb('error_details'),
  
  // Confirmation
  confirmationRequested: boolean('confirmation_requested').default(false),
  userConfirmed: boolean('user_confirmed'),
  confirmationTimestamp: timestamp('confirmation_timestamp'),
  
  // Metrics
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  executionTime: integer('execution_time'), // milliseconds
  
  // Result
  resultEntityId: varchar('result_entity_id', { length: 36 }), // ID of created/updated entity
  resultEntityType: varchar('result_entity_type', { length: 50 }), // 'ticket', 'customer', etc.
  
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index('ai_action_exec_conversation_id_idx').on(table.conversationId),
  agentIdIdx: index('ai_action_exec_agent_id_idx').on(table.agentId),
  actionTypeIdx: index('ai_action_exec_action_type_idx').on(table.actionType),
  statusIdx: index('ai_action_exec_status_idx').on(table.status)
}));

// AI Conversation Feedback - User feedback for learning
export const aiConversationFeedback = pgTable('ai_conversation_feedback', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar('conversation_id', { length: 36 }).notNull(),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  
  // Feedback
  rating: feedbackRatingEnum('rating').notNull(),
  comment: text('comment'),
  
  // Specific Issues
  issues: jsonb('issues').$type<string[]>().default([]), // ['tone_inappropriate', 'missing_info', 'wrong_action']
  
  // Corrections
  correctAnswer: text('correct_answer'), // What should have been done
  suggestedPromptAdjustment: text('suggested_prompt_adjustment'),
  
  // Tags for categorization
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Learning Status
  appliedToLearning: boolean('applied_to_learning').default(false),
  learningAppliedAt: timestamp('learning_applied_at'),
  
  // Reviewer
  reviewedBy: varchar('reviewed_by', { length: 36 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index('ai_feedback_conversation_id_idx').on(table.conversationId),
  agentIdIdx: index('ai_feedback_agent_id_idx').on(table.agentId),
  ratingIdx: index('ai_feedback_rating_idx').on(table.rating),
  appliedIdx: index('ai_feedback_applied_idx').on(table.appliedToLearning)
}));

// AI Learning Patterns - Extracted patterns from feedback
export const aiLearningPatterns = pgTable('ai_learning_patterns', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  
  // Pattern Details
  patternType: varchar('pattern_type', { length: 50 }).notNull(), // 'successful_approach', 'common_error', 'improvement'
  category: varchar('category', { length: 50 }).notNull(), // 'intent_detection', 'data_collection', 'action_execution'
  
  // Pattern Data
  pattern: jsonb('pattern').$type<{
    trigger: any; // Conditions that trigger this pattern
    action: any; // What to do
    confidence: number;
    examples: any[]; // Conversation IDs that support this pattern
  }>().notNull(),
  
  // Impact
  improvement: text('improvement'), // Description of improvement
  promptAdjustment: text('prompt_adjustment'), // Suggested prompt change
  
  // Metrics
  supportingFeedbackCount: integer('supporting_feedback_count').default(1),
  applied: boolean('applied').default(false),
  appliedAt: timestamp('applied_at'),
  impactScore: integer('impact_score').default(0), // Measured improvement after applying
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  agentIdIdx: index('ai_learning_patterns_agent_id_idx').on(table.agentId),
  patternTypeIdx: index('ai_learning_patterns_pattern_type_idx').on(table.patternType),
  appliedIdx: index('ai_learning_patterns_applied_idx').on(table.applied)
}));

// ========================================
// RELATIONS
// ========================================

export const aiAgentsRelations = relations(aiAgents, ({ many }) => ({
  conversations: many(aiConversations),
  actionExecutions: many(aiActionExecutions),
  feedback: many(aiConversationFeedback),
  learningPatterns: many(aiLearningPatterns)
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  agent: one(aiAgents, {
    fields: [aiConversations.agentId],
    references: [aiAgents.id]
  }),
  messages: many(aiConversationMessages),
  logs: many(aiConversationLogs),
  actionExecutions: many(aiActionExecutions),
  feedback: one(aiConversationFeedback)
}));

export const aiConversationMessagesRelations = relations(aiConversationMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiConversationMessages.conversationId],
    references: [aiConversations.id]
  })
}));

export const aiConversationLogsRelations = relations(aiConversationLogs, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiConversationLogs.conversationId],
    references: [aiConversations.id]
  })
}));

export const aiActionExecutionsRelations = relations(aiActionExecutions, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiActionExecutions.conversationId],
    references: [aiConversations.id]
  }),
  agent: one(aiAgents, {
    fields: [aiActionExecutions.agentId],
    references: [aiAgents.id]
  })
}));

export const aiConversationFeedbackRelations = relations(aiConversationFeedback, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiConversationFeedback.conversationId],
    references: [aiConversations.id]
  }),
  agent: one(aiAgents, {
    fields: [aiConversationFeedback.agentId],
    references: [aiAgents.id]
  })
}));

export const aiLearningPatternsRelations = relations(aiLearningPatterns, ({ one }) => ({
  agent: one(aiAgents, {
    fields: [aiLearningPatterns.agentId],
    references: [aiAgents.id]
  })
}));

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const insertAiAgentSchema = createInsertSchema(aiAgents, {
  configPrompt: z.string().min(10, 'Configuration prompt must be at least 10 characters'),
  name: z.string().min(3, 'Agent name must be at least 3 characters'),
  personality: z.object({
    tone: z.string(),
    language: z.string(),
    greeting: z.string(),
    fallbackMessage: z.string(),
    confirmationStyle: z.string()
  }),
  permissions: z.record(z.object({
    create: z.boolean(),
    read: z.boolean(),
    update: z.boolean(),
    delete: z.boolean()
  }))
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiConversationMessageSchema = createInsertSchema(aiConversationMessages).omit({
  id: true,
  createdAt: true
});

export const insertAiConversationLogSchema = createInsertSchema(aiConversationLogs).omit({
  id: true,
  createdAt: true
});

export const insertAiActionExecutionSchema = createInsertSchema(aiActionExecutions).omit({
  id: true,
  createdAt: true
});

export const insertAiConversationFeedbackSchema = createInsertSchema(aiConversationFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ========================================
// TYPES
// ========================================

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;

export type AiAction = typeof aiActions.$inferSelect;
export type InsertAiAction = typeof aiActions.$inferInsert;

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;

export type AiConversationMessage = typeof aiConversationMessages.$inferSelect;
export type InsertAiConversationMessage = z.infer<typeof insertAiConversationMessageSchema>;

export type AiConversationLog = typeof aiConversationLogs.$inferSelect;
export type InsertAiConversationLog = z.infer<typeof insertAiConversationLogSchema>;

export type AiActionExecution = typeof aiActionExecutions.$inferSelect;
export type InsertAiActionExecution = z.infer<typeof insertAiActionExecutionSchema>;

export type AiConversationFeedback = typeof aiConversationFeedback.$inferSelect;
export type InsertAiConversationFeedback = z.infer<typeof insertAiConversationFeedbackSchema>;

export type AiLearningPattern = typeof aiLearningPatterns.$inferSelect;
export type InsertAiLearningPattern = typeof aiLearningPatterns.$inferInsert;
