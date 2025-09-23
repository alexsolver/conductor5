// ✅ CHATBOT ENGINE SCHEMA - COMPLETE CHATBOT SYSTEM
// Normalized schema for full chatbot functionality with 9 node categories

import { 
  pgTable, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  jsonb, 
  integer,
  pgEnum,
  serial,
  index,
  foreignKey
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ========================================
// ENUMS
// ========================================

export const chatbotNodeCategoryEnum = pgEnum('chatbot_node_category', [
  'trigger',
  'condition', 
  'action',
  'response',
  'integration',
  'ai',
  'flow_control',
  'validation',
  'advanced'
]);

export const chatbotEdgeKindEnum = pgEnum('chatbot_edge_kind', [
  'conditional',
  'success', 
  'default',
  'error',
  'timeout'
]);

export const chatbotVariableScopeEnum = pgEnum('chatbot_variable_scope', [
  'flow',
  'session', 
  'tenant'
]);

export const chatbotFieldTypeEnum = pgEnum('chatbot_field_type', [
  'text',
  'email',
  'phone',
  'number',
  'date',
  'select',
  'multiselect',
  'checkbox',
  'file',
  'textarea'
]);

export const chatbotScheduleTypeEnum = pgEnum('chatbot_schedule_type', [
  'cron',
  'once',
  'window',
  'interval'
]);

export const chatbotExecutionStatusEnum = pgEnum('chatbot_execution_status', [
  'running',
  'completed',
  'failed',
  'timeout',
  'cancelled'
]);

// ========================================
// MAIN TABLES
// ========================================

// Core bot definition
export const chatbotBots = pgTable('chatbot_bots', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  defaultLanguage: varchar('default_language', { length: 10 }).default('pt-BR').notNull(),
  fallbackToHuman: boolean('fallback_to_human').default(true).notNull(),
  timeout: integer('timeout').default(300).notNull(), // seconds
  maxRetries: integer('max_retries').default(3).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  tenantIdx: index('chatbot_bots_tenant_idx').on(table.tenantId),
  nameIdx: index('chatbot_bots_name_idx').on(table.name)
}));

// Flow versions for each bot
export const chatbotFlows = pgTable('chatbot_flows', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar('bot_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  version: integer('version').default(1).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  description: text('description'),
  settings: jsonb('settings').default({}).notNull(), // Flow-specific settings
  createdAt: timestamp('created_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at')
}, (table) => ({
  botIdx: index('chatbot_flows_bot_idx').on(table.botId),
  activeIdx: index('chatbot_flows_active_idx').on(table.botId, table.isActive),
  botIdFk: foreignKey({
    columns: [table.botId],
    foreignColumns: [chatbotBots.id]
  }).onDelete('cascade')
}));

// Individual nodes in flows
export const chatbotNodes = pgTable('chatbot_nodes', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar('flow_id', { length: 36 }).notNull(),
  category: chatbotNodeCategoryEnum('category').notNull(),
  type: varchar('type', { length: 100 }).notNull(), // Specific type within category
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  position: jsonb('position').notNull(), // {x, y}
  config: jsonb('config').default({}).notNull(), // Node-specific configuration
  isStart: boolean('is_start').default(false).notNull(),
  isEnd: boolean('is_end').default(false).notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  flowIdx: index('chatbot_nodes_flow_idx').on(table.flowId),
  categoryIdx: index('chatbot_nodes_category_idx').on(table.category),
  startIdx: index('chatbot_nodes_start_idx').on(table.flowId, table.isStart),
  flowIdFk: foreignKey({
    columns: [table.flowId],
    foreignColumns: [chatbotFlows.id]
  }).onDelete('cascade')
}));

// Connections between nodes
export const chatbotEdges = pgTable('chatbot_edges', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar('flow_id', { length: 36 }).notNull(),
  fromNodeId: varchar('from_node_id', { length: 36 }).notNull(),
  toNodeId: varchar('to_node_id', { length: 36 }).notNull(),
  label: varchar('label', { length: 255 }),
  condition: text('condition'), // For conditional edges
  kind: chatbotEdgeKindEnum('kind').default('default').notNull(),
  order: integer('order').default(0).notNull(), // For multiple edges from same node
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  flowIdx: index('chatbot_edges_flow_idx').on(table.flowId),
  fromIdx: index('chatbot_edges_from_idx').on(table.fromNodeId),
  toIdx: index('chatbot_edges_to_idx').on(table.toNodeId),
  flowIdFk: foreignKey({
    columns: [table.flowId],
    foreignColumns: [chatbotFlows.id]
  }).onDelete('cascade'),
  fromNodeFk: foreignKey({
    columns: [table.fromNodeId],
    foreignColumns: [chatbotNodes.id]
  }).onDelete('cascade'),
  toNodeFk: foreignKey({
    columns: [table.toNodeId],
    foreignColumns: [chatbotNodes.id]
  }).onDelete('cascade')
}));

// Flow variables
export const chatbotVariables = pgTable('chatbot_variables', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar('flow_id', { length: 36 }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  valueType: varchar('value_type', { length: 50 }).default('string').notNull(), // string, number, boolean, object, array
  defaultValue: jsonb('default_value'),
  scope: chatbotVariableScopeEnum('scope').default('flow').notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  flowIdx: index('chatbot_variables_flow_idx').on(table.flowId),
  keyIdx: index('chatbot_variables_key_idx').on(table.flowId, table.key),
  flowIdFk: foreignKey({
    columns: [table.flowId],
    foreignColumns: [chatbotFlows.id]
  }).onDelete('cascade')
}));

// Form definitions for response-form nodes
export const chatbotForms = pgTable('chatbot_forms', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  nodeId: varchar('node_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  submitButtonText: varchar('submit_button_text', { length: 100 }).default('Enviar').notNull(),
  validationMessage: text('validation_message'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  nodeIdx: index('chatbot_forms_node_idx').on(table.nodeId),
  nodeIdFk: foreignKey({
    columns: [table.nodeId],
    foreignColumns: [chatbotNodes.id]
  }).onDelete('cascade')
}));

// Form field definitions
export const chatbotFormFields = pgTable('chatbot_form_fields', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar('form_id', { length: 36 }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  fieldType: chatbotFieldTypeEnum('field_type').notNull(),
  placeholder: varchar('placeholder', { length: 255 }),
  required: boolean('required').default(false).notNull(),
  options: jsonb('options'), // For select/multiselect fields
  validation: jsonb('validation'), // Custom validation rules
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  formIdx: index('chatbot_form_fields_form_idx').on(table.formId),
  orderIdx: index('chatbot_form_fields_order_idx').on(table.formId, table.order),
  formIdFk: foreignKey({
    columns: [table.formId],
    foreignColumns: [chatbotForms.id]
  }).onDelete('cascade')
}));

// Execution logs for debugging and analytics
export const chatbotExecutions = pgTable('chatbot_executions', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  botId: varchar('bot_id', { length: 36 }).notNull(),
  flowId: varchar('flow_id', { length: 36 }).notNull(),
  channelId: varchar('channel_id', { length: 255 }), // From omnibridge
  messageId: varchar('message_id', { length: 255 }), // From omnibridge
  userId: varchar('user_id', { length: 36 }),
  status: chatbotExecutionStatusEnum('status').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  context: jsonb('context').default({}).notNull(), // Variables and state during execution
  metrics: jsonb('metrics').default({}).notNull(), // Performance metrics
  error: text('error'), // Error message if failed
  nodeTrace: jsonb('node_trace').default([]).notNull(), // Nodes executed in order
}, (table) => ({
  tenantIdx: index('chatbot_executions_tenant_idx').on(table.tenantId),
  botIdx: index('chatbot_executions_bot_idx').on(table.botId),
  statusIdx: index('chatbot_executions_status_idx').on(table.status),
  dateIdx: index('chatbot_executions_date_idx').on(table.startedAt),
  botIdFk: foreignKey({
    columns: [table.botId],
    foreignColumns: [chatbotBots.id]
  }).onDelete('cascade'),
  flowIdFk: foreignKey({
    columns: [table.flowId],
    foreignColumns: [chatbotFlows.id]
  }).onDelete('cascade')
}));

// Scheduled triggers
export const chatbotSchedules = pgTable('chatbot_schedules', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  botId: varchar('bot_id', { length: 36 }).notNull(),
  flowId: varchar('flow_id', { length: 36 }).notNull(),
  nodeId: varchar('node_id', { length: 36 }).notNull(), // The trigger node
  scheduleType: chatbotScheduleTypeEnum('schedule_type').notNull(),
  spec: text('spec').notNull(), // Cron expression or interval spec
  payload: jsonb('payload').default({}).notNull(), // Data to pass to flow
  nextRunAt: timestamp('next_run_at'),
  lastRunAt: timestamp('last_run_at'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  tenantIdx: index('chatbot_schedules_tenant_idx').on(table.tenantId),
  nextRunIdx: index('chatbot_schedules_next_run_idx').on(table.nextRunAt),
  enabledIdx: index('chatbot_schedules_enabled_idx').on(table.isEnabled),
  botIdFk: foreignKey({
    columns: [table.botId],
    foreignColumns: [chatbotBots.id]
  }).onDelete('cascade'),
  flowIdFk: foreignKey({
    columns: [table.flowId],
    foreignColumns: [chatbotFlows.id]
  }).onDelete('cascade'),
  nodeIdFk: foreignKey({
    columns: [table.nodeId],
    foreignColumns: [chatbotNodes.id]
  }).onDelete('cascade')
}));

// Bot-to-channel bindings (integration with OmniBridge)
export const chatbotBotChannels = pgTable('chatbot_bot_channels', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar('bot_id', { length: 36 }).notNull(),
  channelId: varchar('channel_id', { length: 255 }).notNull(), // From omnibridge_channels
  routingRules: jsonb('routing_rules').default({}).notNull(), // Channel-specific routing
  priority: integer('priority').default(0).notNull(), // For multiple bots on same channel
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  botIdx: index('chatbot_bot_channels_bot_idx').on(table.botId),
  channelIdx: index('chatbot_bot_channels_channel_idx').on(table.channelId),
  priorityIdx: index('chatbot_bot_channels_priority_idx').on(table.channelId, table.priority),
  botIdFk: foreignKey({
    columns: [table.botId],
    foreignColumns: [chatbotBots.id]
  }).onDelete('cascade')
}));

// ========================================
// ZOD SCHEMAS
// ========================================

// Bot schemas
export const insertChatbotBotSchema = createInsertSchema(chatbotBots).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateChatbotBotSchema = insertChatbotBotSchema.partial();

export const selectChatbotBotSchema = createSelectSchema(chatbotBots);

// Flow schemas
export const insertChatbotFlowSchema = createInsertSchema(chatbotFlows).omit({
  id: true,
  createdAt: true,
  publishedAt: true
});

export const updateChatbotFlowSchema = insertChatbotFlowSchema.partial();

export const selectChatbotFlowSchema = createSelectSchema(chatbotFlows);

// Node schemas
export const insertChatbotNodeSchema = createInsertSchema(chatbotNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateChatbotNodeSchema = insertChatbotNodeSchema.partial();

export const selectChatbotNodeSchema = createSelectSchema(chatbotNodes);

// Edge schemas
export const insertChatbotEdgeSchema = createInsertSchema(chatbotEdges).omit({
  id: true,
  createdAt: true
});

export const updateChatbotEdgeSchema = insertChatbotEdgeSchema.partial();

export const selectChatbotEdgeSchema = createSelectSchema(chatbotEdges);

// Variable schemas
export const insertChatbotVariableSchema = createInsertSchema(chatbotVariables).omit({
  id: true,
  createdAt: true
});

export const updateChatbotVariableSchema = insertChatbotVariableSchema.partial();

export const selectChatbotVariableSchema = createSelectSchema(chatbotVariables);

// Form schemas
export const insertChatbotFormSchema = createInsertSchema(chatbotForms).omit({
  id: true,
  createdAt: true
});

export const insertChatbotFormFieldSchema = createInsertSchema(chatbotFormFields).omit({
  id: true,
  createdAt: true
});

export const selectChatbotFormSchema = createSelectSchema(chatbotForms);
export const selectChatbotFormFieldSchema = createSelectSchema(chatbotFormFields);

// Execution schemas
export const insertChatbotExecutionSchema = createInsertSchema(chatbotExecutions).omit({
  id: true,
  startedAt: true
});

export const selectChatbotExecutionSchema = createSelectSchema(chatbotExecutions);

// Schedule schemas
export const insertChatbotScheduleSchema = createInsertSchema(chatbotSchedules).omit({
  id: true,
  createdAt: true
});

export const selectChatbotScheduleSchema = createSelectSchema(chatbotSchedules);

// Bot Channel schemas
export const insertChatbotBotChannelSchema = createInsertSchema(chatbotBotChannels).omit({
  id: true,
  createdAt: true
});

export const selectChatbotBotChannelSchema = createSelectSchema(chatbotBotChannels);

// ========================================
// TYPE DEFINITIONS
// ========================================

export type InsertChatbotBot = z.infer<typeof insertChatbotBotSchema>;
export type SelectChatbotBot = z.infer<typeof selectChatbotBotSchema>;
export type UpdateChatbotBot = z.infer<typeof updateChatbotBotSchema>;

export type InsertChatbotFlow = z.infer<typeof insertChatbotFlowSchema>;
export type SelectChatbotFlow = z.infer<typeof selectChatbotFlowSchema>;
export type UpdateChatbotFlow = z.infer<typeof updateChatbotFlowSchema>;

export type InsertChatbotNode = z.infer<typeof insertChatbotNodeSchema>;
export type SelectChatbotNode = z.infer<typeof selectChatbotNodeSchema>;
export type UpdateChatbotNode = z.infer<typeof updateChatbotNodeSchema>;

export type InsertChatbotEdge = z.infer<typeof insertChatbotEdgeSchema>;
export type SelectChatbotEdge = z.infer<typeof selectChatbotEdgeSchema>;
export type UpdateChatbotEdge = z.infer<typeof updateChatbotEdgeSchema>;

export type InsertChatbotVariable = z.infer<typeof insertChatbotVariableSchema>;
export type SelectChatbotVariable = z.infer<typeof selectChatbotVariableSchema>;
export type UpdateChatbotVariable = z.infer<typeof updateChatbotVariableSchema>;

export type InsertChatbotForm = z.infer<typeof insertChatbotFormSchema>;
export type SelectChatbotForm = z.infer<typeof selectChatbotFormSchema>;

export type InsertChatbotFormField = z.infer<typeof insertChatbotFormFieldSchema>;
export type SelectChatbotFormField = z.infer<typeof selectChatbotFormFieldSchema>;

export type InsertChatbotExecution = z.infer<typeof insertChatbotExecutionSchema>;
export type SelectChatbotExecution = z.infer<typeof selectChatbotExecutionSchema>;

export type InsertChatbotSchedule = z.infer<typeof insertChatbotScheduleSchema>;
export type SelectChatbotSchedule = z.infer<typeof selectChatbotScheduleSchema>;

export type InsertChatbotBotChannel = z.infer<typeof insertChatbotBotChannelSchema>;
export type SelectChatbotBotChannel = z.infer<typeof selectChatbotBotChannelSchema>;

// ========================================
// COMPOSITE TYPES FOR API
// ========================================

export type ChatbotFlowWithNodes = SelectChatbotFlow & {
  nodes: SelectChatbotNode[];
  edges: SelectChatbotEdge[];
  variables: SelectChatbotVariable[];
};

export type ChatbotBotWithFlows = SelectChatbotBot & {
  flows: ChatbotFlowWithNodes[];
  channels: SelectChatbotBotChannel[];
};

export type ChatbotNodeWithForm = SelectChatbotNode & {
  form?: SelectChatbotForm & {
    fields: SelectChatbotFormField[];
  };
};

// ========================================
// NODE TYPE DEFINITIONS
// ========================================

// Node type constants for each category
export const CHATBOT_NODE_TYPES = {
  // Triggers (10 types)
  TRIGGER: {
    MESSAGE_RECEIVED: 'message_received',
    KEYWORD: 'keyword', 
    INTENT_AI: 'intent_ai',
    WEBHOOK: 'webhook',
    SCHEDULE: 'schedule',
    CHANNEL_SPECIFIC: 'channel_specific',
    SYSTEM_EVENT: 'system_event',
    SENDER_PATTERN: 'sender_pattern',
    PRIORITY: 'priority',
    LOCATION: 'location'
  },
  
  // Conditions (10 types)
  CONDITION: {
    TEXT: 'text',
    VARIABLE: 'variable',
    USER: 'user',
    TIME: 'time',
    CHANNEL: 'channel',
    CONTEXT: 'context',
    SENTIMENT: 'sentiment',
    LANGUAGE: 'language',
    ATTACHMENT: 'attachment',
    GEOLOCATION: 'geolocation'
  },
  
  // Actions (12 types)  
  ACTION: {
    SEND_MESSAGE: 'send_message',
    SEND_IMAGE: 'send_image',
    SEND_AUDIO: 'send_audio',
    SEND_VIDEO: 'send_video',
    SEND_DOCUMENT: 'send_document',
    SET_VARIABLE: 'set_variable',
    API_CALL: 'api_call',
    TAG_USER: 'tag_user',
    CREATE_TICKET: 'create_ticket',
    NOTIFY_TEAM: 'notify_team',
    SCHEDULE_ACTION: 'schedule_action',
    UPDATE_DATABASE: 'update_database'
  },
  
  // Response Types (10 types)
  RESPONSE: {
    SIMPLE: 'simple',
    QUICK_REPLIES: 'quick_replies',
    INTERACTIVE_MENU: 'interactive_menu',
    CAROUSEL: 'carousel',
    FORM: 'form',
    DYNAMIC_LIST: 'dynamic_list',
    POLL: 'poll',
    OPEN_QUESTION: 'open_question',
    DATE_PICKER: 'date_picker',
    FILE_UPLOAD: 'file_upload'
  },
  
  // Integrations (10 types)
  INTEGRATION: {
    CRM: 'crm',
    ERP: 'erp',
    KNOWLEDGE_BASE: 'knowledge_base',
    CALENDAR: 'calendar',
    PAYMENT: 'payment',
    EMAIL_MARKETING: 'email_marketing',
    ANALYTICS: 'analytics',
    DATABASE: 'database',
    THIRD_PARTY_API: 'third_party_api',
    OUTBOUND_WEBHOOK: 'outbound_webhook'
  },
  
  // AI Processing (10 types)
  AI: {
    SENTIMENT_ANALYSIS: 'sentiment_analysis',
    NLP: 'nlp',
    TRANSLATION: 'translation',
    RECOMMENDATIONS: 'recommendations',
    CLASSIFICATION: 'classification',
    ENTITY_EXTRACTION: 'entity_extraction',
    TEXT_GENERATION: 'text_generation',
    PREDICTIVE_ANALYSIS: 'predictive_analysis',
    OCR: 'ocr',
    VOICE_RECOGNITION: 'voice_recognition'
  },
  
  // Flow Control (10 types)
  FLOW: {
    WAIT: 'wait',
    LOOP: 'loop',
    BRANCH: 'branch',
    TRANSFER_HUMAN: 'transfer_human',
    END_CONVERSATION: 'end_conversation',
    RETURN_MENU: 'return_menu',
    SAVE_STATE: 'save_state',
    LOAD_CONTEXT: 'load_context',
    SWITCH_CASE: 'switch_case',
    COUNTER: 'counter'
  },
  
  // Validation (10 types)  
  VALIDATION: {
    EMAIL: 'email',
    PHONE: 'phone',
    CPF_CNPJ: 'cpf_cnpj',
    DATE: 'date',
    NUMERIC: 'numeric',
    CEP: 'cep',
    CUSTOM: 'custom',
    DUPLICATES: 'duplicates',
    FORMAT: 'format',
    SANITIZATION: 'sanitization'
  },
  
  // Advanced (Context/Memory)
  ADVANCED: {
    MEMORY_PERSIST: 'memory_persist',
    SESSION_VARIABLE: 'session_variable',
    INTERACTION_HISTORY: 'interaction_history',
    DYNAMIC_PROFILE: 'dynamic_profile',
    MULTICHANNEL_SYNC: 'multichannel_sync'
  }
} as const;