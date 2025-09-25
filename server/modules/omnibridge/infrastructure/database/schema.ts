
import { pgTable, varchar, timestamp, jsonb, boolean, text, integer } from 'drizzle-orm/pg-core';

export const omnibridgeChannels = pgTable('omnibridge_channels', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  integrationId: varchar('integration_id', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('inactive'),
  config: jsonb('config').default({}),
  features: jsonb('features').default([]),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  lastSync: timestamp('last_sync'),
  metrics: jsonb('metrics').default({}),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeMessages = pgTable('omnibridge_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  channelId: varchar('channel_id', { length: 36 }).notNull(),
  channelType: varchar('channel_type', { length: 50 }).notNull(),
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  subject: text('subject'),
  content: text('content'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('unread'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  tags: jsonb('tags').default([]),
  attachments: integer('attachments').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});


export const omnibridgeRules = pgTable('omnibridge_rules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  conditions: jsonb('conditions').notNull(),
  actions: jsonb('actions').notNull(),
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(0),
  executionCount: integer('execution_count').default(0),
  successCount: integer('success_count').default(0),
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeAiConfig = pgTable('omnibridge_ai_config', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  model: varchar('model', { length: 100 }).notNull().default('gpt-4'),
  temperature: integer('temperature').notNull().default(7), // stored as int * 10 (0.7 = 7)
  maxTokens: integer('max_tokens').notNull().default(1000),
  confidenceThreshold: integer('confidence_threshold').notNull().default(8), // stored as int * 10 (0.8 = 8)
  enabledAnalysis: jsonb('enabled_analysis').notNull().default({
    intention: true,
    priority: true,
    sentiment: true,
    language: true,
    entities: true
  }),
  prompts: jsonb('prompts').notNull().default({
    intentionAnalysis: 'Analise a mensagem e identifique a intenção principal:\\n- reclamacao: Cliente insatisfeito\\n- duvida: Pergunta ou esclarecimento\\n- solicitacao: Pedido de serviço\\n- elogio: Feedback positivo\\n- urgente: Situação urgente\\n\\nResponda apenas com a categoria.',
    priorityClassification: 'Classifique a prioridade da mensagem:\\n- baixa: Dúvidas gerais\\n- media: Solicitações padrão\\n- alta: Problemas operacionais\\n- critica: Emergências\\n\\nConsidere palavras como "urgente", "parou", "não funciona".',
    autoResponse: 'Responda de forma profissional e prestativa. Se for dúvida técnica, forneça informações úteis. Se for reclamação, seja empático e ofereça soluções.',
    sentimentAnalysis: 'Analise o sentimento da mensagem:\\n- positivo: Satisfação, elogio\\n- neutro: Informativo, neutro\\n- negativo: Insatisfação, reclamação\\n\\nResponda apenas com a categoria.',
    entityExtraction: 'Extraia informações importantes da mensagem:\\n- nomes de pessoas\\n- números de pedido/protocolo\\n- datas\\n- produtos/serviços mencionados\\n\\nRetorne em formato JSON.'
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeAiMetrics = pgTable('omnibridge_ai_metrics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  totalAnalyses: integer('total_analyses').default(0),
  accuracyRate: integer('accuracy_rate').default(0), // stored as percentage * 100
  responseTime: integer('response_time').default(0), // in milliseconds
  autoResponseRate: integer('auto_response_rate').default(0), // stored as percentage * 100
  escalationRate: integer('escalation_rate').default(0), // stored as percentage * 100
  analysisBreakdown: jsonb('analysis_breakdown').default({
    intention: 0,
    priority: 0,
    sentiment: 0,
    language: 0,
    entities: 0
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeTemplates = pgTable('omnibridge_templates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 500 }),
  content: text('content').notNull(),
  variables: jsonb('variables').default([]),
  category: varchar('category', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
