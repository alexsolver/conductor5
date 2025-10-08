/**
 * AI Configurable Actions Schema - v1.0
 * 
 * Sistema de ações configuráveis que permite associar qualquer módulo/endpoint
 * com agentes IA, definindo campos, estratégias de coleta (conversacional/menu/híbrido),
 * widgets interativos e integração com formulários internos.
 * 
 * @module schema-ai-configurable-actions
 * @version 1.0.0
 * @created 2025-10-08
 */

import { pgTable, varchar, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ========================================
// ENUMS
// ========================================

// Estratégia de coleta de dados
export const collectionStrategyEnum = pgEnum('collection_strategy', [
  'conversational',     // Apenas via conversa natural
  'interactive',        // Apenas menus/widgets interativos
  'hybrid',             // Tenta conversacional primeiro, depois menu
  'adaptive'            // IA decide baseado em contexto e confidence
]);

// Tipo de widget para coleta interativa
export const widgetTypeEnum = pgEnum('widget_type', [
  'smart_client_selector',    // Busca fuzzy + autocomplete de clientes
  'smart_location_picker',    // Geo-search + menu de locais
  'smart_datetime_picker',    // Calendário + NLP ("amanhã", "próxima segunda")
  'priority_picker',          // Seletor de prioridade (urgente/alta/média/baixa)
  'status_picker',            // Seletor de status
  'user_picker',              // Seletor de usuários/técnicos
  'file_uploader',            // Upload de arquivos com preview
  'rich_text_editor',         // Editor de texto rico
  'rating_picker',            // Avaliação por estrelas
  'checkbox_group',           // Grupo de checkboxes
  'radio_group',              // Grupo de radio buttons
  'dropdown',                 // Dropdown simples
  'multi_select',             // Seleção múltipla
  'number_stepper',           // Input numérico com +/-
  'currency_input',           // Input de moeda formatado
  'phone_input',              // Input de telefone com máscara
  'email_input',              // Input de email com validação
  'url_input',                // Input de URL
  'color_picker',             // Seletor de cor
  'custom'                    // Widget customizado
]);

// Tipo de validação
export const validationTypeEnum = pgEnum('validation_type', [
  'required',
  'min_length',
  'max_length',
  'pattern',
  'email',
  'phone',
  'url',
  'number',
  'min_value',
  'max_value',
  'date_range',
  'custom'
]);

// Status de mapeamento de campo
export const fieldMappingStatusEnum = pgEnum('field_mapping_status', [
  'active',
  'inactive',
  'deprecated'
]);

// ========================================
// SCHEMAS PARA TIPOS COMPLEXOS
// ========================================

// Configuração de extração conversacional
export const ExtractionConfigSchema = z.object({
  extractionPrompt: z.string().optional(),
  nlpPatterns: z.array(z.string()).optional(),
  examples: z.array(z.object({
    userMessage: z.string(),
    extractedValue: z.any()
  })).optional(),
  confidenceThreshold: z.number().min(0).max(1).default(0.8),
  fallbackToInteractive: z.boolean().default(true)
});

// Configuração de validação
export const ValidationConfigSchema = z.object({
  type: z.enum(['required', 'min_length', 'max_length', 'pattern', 'email', 'phone', 'url', 'number', 'min_value', 'max_value', 'date_range', 'custom']),
  value: z.any().optional(),
  errorMessage: z.string(),
  customValidator: z.string().optional() // Código JS para validação customizada
});

// Configuração de widget
export const WidgetConfigSchema = z.object({
  type: z.enum(['smart_client_selector', 'smart_location_picker', 'smart_datetime_picker', 'priority_picker', 
                'status_picker', 'user_picker', 'file_uploader', 'rich_text_editor', 'rating_picker',
                'checkbox_group', 'radio_group', 'dropdown', 'multi_select', 'number_stepper',
                'currency_input', 'phone_input', 'email_input', 'url_input', 'color_picker', 'custom']),
  options: z.any().optional(), // Opções específicas do widget
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.any().optional(),
  customComponent: z.string().optional() // Nome do componente React customizado
});

// Configuração de endpoint
export const EndpointConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string(),
  headers: z.record(z.string()).optional(),
  authentication: z.object({
    type: z.enum(['none', 'bearer', 'api_key', 'basic']),
    credentials: z.any().optional()
  }).optional(),
  timeout: z.number().optional(),
  retryConfig: z.object({
    maxRetries: z.number(),
    retryDelay: z.number()
  }).optional()
});

// Template de resposta com variáveis dinâmicas
export const ResponseTemplateSchema = z.object({
  success: z.string(),
  error: z.string(),
  confirmation: z.string().optional(),
  variables: z.array(z.object({
    name: z.string(),
    path: z.string(), // JSONPath para extrair do resultado
    formatter: z.string().optional() // Função de formatação
  })).optional()
});

// ========================================
// TABELAS PRINCIPAIS
// ========================================

// Ações Configuráveis - Define ações que podem ser executadas
export const aiConfigurableActions = pgTable('ai_configurable_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação da Ação
  actionKey: varchar('action_key', { length: 100 }).notNull(), // ex: 'create_ticket', 'register_customer'
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'tickets', 'customers', 'scheduling', etc.
  
  // Módulo/Endpoint Destino
  targetModule: varchar('target_module', { length: 100 }).notNull(), // 'tickets', 'customers', 'internal_forms'
  targetEndpoint: varchar('target_endpoint', { length: 255 }).notNull(), // '/api/tickets', '/api/customers/register'
  endpointConfig: jsonb('endpoint_config').$type<z.infer<typeof EndpointConfigSchema>>().notNull(),
  
  // Estratégia de Coleta
  collectionStrategy: collectionStrategyEnum('collection_strategy').default('hybrid').notNull(),
  
  // Integração com Formulário Interno (opcional)
  linkedFormId: uuid('linked_form_id'), // FK para internal_forms
  autoFillForm: boolean('auto_fill_form').default(true), // Se true, IA preenche formulário automaticamente
  
  // Configuração de Confirmação
  requiresConfirmation: boolean('requires_confirmation').default(true),
  confirmationTemplate: text('confirmation_template'),
  
  // Templates de Resposta
  responseTemplates: jsonb('response_templates').$type<z.infer<typeof ResponseTemplateSchema>>().notNull(),
  
  // Configuração de Permissões
  requiredPermissions: jsonb('required_permissions').$type<string[]>().default([]),
  
  // Rate Limiting
  rateLimitPerUser: integer('rate_limit_per_user').default(10), // Por hora
  rateLimitPerTenant: integer('rate_limit_per_tenant').default(100), // Por hora
  
  // Configuração de Contexto
  contextRequirements: jsonb('context_requirements').$type<{
    requiresAuth: boolean;
    requiresCustomer: boolean;
    requiresTicket: boolean;
    customRequirements?: any;
  }>().default({ requiresAuth: true, requiresCustomer: false, requiresTicket: false }),
  
  // Estatísticas
  stats: jsonb('stats').$type<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    averageConfidenceScore: number;
    conversationalSuccessRate: number; // % de vezes que conseguiu via conversa
    interactiveUsageRate: number; // % de vezes que usou menu interativo
  }>().default({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    averageConfidenceScore: 0,
    conversationalSuccessRate: 0,
    interactiveUsageRate: 0
  }),
  
  // Controles
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  
  // Auditoria
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  tenantIdIdx: index('ai_conf_actions_tenant_id_idx').on(table.tenantId),
  actionKeyIdx: index('ai_conf_actions_action_key_idx').on(table.actionKey),
  categoryIdx: index('ai_conf_actions_category_idx').on(table.category),
  linkedFormIdIdx: index('ai_conf_actions_linked_form_id_idx').on(table.linkedFormId),
  uniqueActionKey: unique('ai_conf_actions_unique_action_key').on(table.tenantId, table.actionKey)
}));

// Campos de Ação - Define os campos necessários para cada ação
export const aiActionFields = pgTable('ai_action_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  actionId: uuid('action_id').notNull(), // FK para ai_configurable_actions
  
  // Identificação do Campo
  fieldKey: varchar('field_key', { length: 100 }).notNull(), // ex: 'customer_id', 'priority', 'description'
  fieldLabel: varchar('field_label', { length: 255 }).notNull(),
  fieldDescription: text('field_description'),
  
  // Tipo e Estrutura
  fieldType: varchar('field_type', { length: 50 }).notNull(), // 'string', 'number', 'date', 'select', 'multiselect', etc.
  isRequired: boolean('is_required').default(false),
  isCritical: boolean('is_critical').default(false), // Se true, sempre usa menu interativo
  
  // Estratégia de Coleta para este Campo
  collectionStrategy: collectionStrategyEnum('collection_strategy').default('hybrid'),
  
  // Configuração de Extração Conversacional
  extractionConfig: jsonb('extraction_config').$type<z.infer<typeof ExtractionConfigSchema>>(),
  
  // Configuração de Widget Interativo
  widgetConfig: jsonb('widget_config').$type<z.infer<typeof WidgetConfigSchema>>(),
  
  // Validações
  validations: jsonb('validations').$type<z.infer<typeof ValidationConfigSchema>[]>().default([]),
  
  // Valores Padrão e Opções
  defaultValue: jsonb('default_value'),
  allowedValues: jsonb('allowed_values').$type<any[]>(), // Para campos select/multiselect
  
  // Dependências entre Campos
  dependsOn: jsonb('depends_on').$type<Array<{
    fieldKey: string;
    condition: {
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    };
  }>>().default([]),
  
  // Ordem de Coleta
  displayOrder: integer('display_order').default(0),
  
  // Controles
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  actionIdIdx: index('ai_action_fields_action_id_idx').on(table.actionId),
  fieldKeyIdx: index('ai_action_fields_field_key_idx').on(table.fieldKey),
  uniqueFieldKey: unique('ai_action_fields_unique_field_key').on(table.actionId, table.fieldKey)
}));

// Mapeamentos de Campo - Mapeia campos da ação para campos do formulário/endpoint
export const aiActionFieldMappings = pgTable('ai_action_field_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  actionId: uuid('action_id').notNull(),
  fieldId: uuid('field_id').notNull(), // FK para ai_action_fields
  
  // Mapeamento para Endpoint
  endpointFieldPath: varchar('endpoint_field_path', { length: 255 }), // ex: 'customer.name', 'ticket.priority'
  
  // Mapeamento para Formulário Interno (se vinculado)
  formFieldId: varchar('form_field_id', { length: 100 }), // ID do campo no formulário interno
  
  // Transformação de Dados
  transformation: jsonb('transformation').$type<{
    type: 'direct' | 'computed' | 'lookup' | 'custom';
    expression?: string; // Expressão para transformação
    lookupTable?: string; // Tabela para lookup
    customFunction?: string; // Nome da função customizada
  }>(),
  
  // Status
  status: fieldMappingStatusEnum('status').default('active'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  actionIdIdx: index('ai_field_mappings_action_id_idx').on(table.actionId),
  fieldIdIdx: index('ai_field_mappings_field_id_idx').on(table.fieldId),
  formFieldIdIdx: index('ai_field_mappings_form_field_id_idx').on(table.formFieldId)
}));

// Vínculo de Agentes com Ações - Define quais ações cada agente pode executar
export const aiAgentActionBindings = pgTable('ai_agent_action_bindings', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull(), // FK para ai_agents
  actionId: uuid('action_id').notNull(), // FK para ai_configurable_actions
  
  // Configuração Específica do Agente para esta Ação
  customPrompt: text('custom_prompt'), // Prompt específico para este agente usar nesta ação
  priority: integer('priority').default(1), // Prioridade desta ação para este agente
  
  // Override de Estratégia
  overrideCollectionStrategy: collectionStrategyEnum('override_collection_strategy'),
  
  // Override de Confirmação
  overrideRequiresConfirmation: boolean('override_requires_confirmation'),
  
  // Controles
  isEnabled: boolean('is_enabled').default(true),
  
  // Estatísticas específicas deste binding
  executionCount: integer('execution_count').default(0),
  successRate: integer('success_rate').default(0), // Percentual
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  agentIdIdx: index('ai_agent_action_bindings_agent_id_idx').on(table.agentId),
  actionIdIdx: index('ai_agent_action_bindings_action_id_idx').on(table.actionId),
  uniqueBinding: unique('ai_agent_action_bindings_unique').on(table.agentId, table.actionId)
}));

// Histórico de Execução de Campos - Rastreia como cada campo foi coletado
export const aiFieldCollectionHistory = pgTable('ai_field_collection_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  actionExecutionId: uuid('action_execution_id').notNull(), // FK para ai_action_executions
  fieldId: uuid('field_id').notNull(), // FK para ai_action_fields
  
  // Método de Coleta
  collectionMethod: varchar('collection_method', { length: 50 }).notNull(), // 'conversational', 'interactive', 'default'
  
  // Extração Conversacional (se aplicável)
  extractedFrom: text('extracted_from'), // Mensagem do usuário de onde foi extraído
  extractionConfidence: integer('extraction_confidence'), // 0-100
  nlpModelUsed: varchar('nlp_model_used', { length: 100 }),
  
  // Widget Usado (se aplicável)
  widgetUsed: widgetTypeEnum('widget_used'),
  
  // Valor Coletado
  collectedValue: jsonb('collected_value').notNull(),
  
  // Validação
  validationPassed: boolean('validation_passed').notNull(),
  validationErrors: jsonb('validation_errors').$type<string[]>().default([]),
  
  // Tentativas
  attemptCount: integer('attempt_count').default(1),
  
  // Timing
  collectionStartedAt: timestamp('collection_started_at').notNull(),
  collectionCompletedAt: timestamp('collection_completed_at'),
  collectionDuration: integer('collection_duration'), // milliseconds
  
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  actionExecutionIdIdx: index('ai_field_history_action_exec_id_idx').on(table.actionExecutionId),
  fieldIdIdx: index('ai_field_history_field_id_idx').on(table.fieldId),
  collectionMethodIdx: index('ai_field_history_collection_method_idx').on(table.collectionMethod)
}));

// ========================================
// RELATIONS
// ========================================

export const aiConfigurableActionsRelations = relations(aiConfigurableActions, ({ many }) => ({
  fields: many(aiActionFields),
  fieldMappings: many(aiActionFieldMappings),
  agentBindings: many(aiAgentActionBindings)
}));

export const aiActionFieldsRelations = relations(aiActionFields, ({ one, many }) => ({
  action: one(aiConfigurableActions, {
    fields: [aiActionFields.actionId],
    references: [aiConfigurableActions.id]
  }),
  mappings: many(aiActionFieldMappings),
  collectionHistory: many(aiFieldCollectionHistory)
}));

export const aiActionFieldMappingsRelations = relations(aiActionFieldMappings, ({ one }) => ({
  action: one(aiConfigurableActions, {
    fields: [aiActionFieldMappings.actionId],
    references: [aiConfigurableActions.id]
  }),
  field: one(aiActionFields, {
    fields: [aiActionFieldMappings.fieldId],
    references: [aiActionFields.id]
  })
}));

export const aiAgentActionBindingsRelations = relations(aiAgentActionBindings, ({ one }) => ({
  action: one(aiConfigurableActions, {
    fields: [aiAgentActionBindings.actionId],
    references: [aiConfigurableActions.id]
  })
}));

export const aiFieldCollectionHistoryRelations = relations(aiFieldCollectionHistory, ({ one }) => ({
  field: one(aiActionFields, {
    fields: [aiFieldCollectionHistory.fieldId],
    references: [aiActionFields.id]
  })
}));

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const insertAiConfigurableActionSchema = createInsertSchema(aiConfigurableActions, {
  actionKey: z.string().min(3).max(100).regex(/^[a-z_]+$/, 'Action key must be lowercase with underscores'),
  name: z.string().min(3).max(255),
  targetModule: z.string().min(1),
  targetEndpoint: z.string().min(1),
  endpointConfig: EndpointConfigSchema,
  responseTemplates: ResponseTemplateSchema
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAiActionFieldSchema = createInsertSchema(aiActionFields, {
  fieldKey: z.string().min(1).max(100),
  fieldLabel: z.string().min(1).max(255),
  extractionConfig: ExtractionConfigSchema.optional(),
  widgetConfig: WidgetConfigSchema.optional()
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAiActionFieldMappingSchema = createInsertSchema(aiActionFieldMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiAgentActionBindingSchema = createInsertSchema(aiAgentActionBindings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiFieldCollectionHistorySchema = createInsertSchema(aiFieldCollectionHistory).omit({
  id: true,
  createdAt: true
});

// ========================================
// TYPE EXPORTS
// ========================================

export type AiConfigurableAction = typeof aiConfigurableActions.$inferSelect;
export type InsertAiConfigurableAction = z.infer<typeof insertAiConfigurableActionSchema>;

export type AiActionField = typeof aiActionFields.$inferSelect;
export type InsertAiActionField = z.infer<typeof insertAiActionFieldSchema>;

export type AiActionFieldMapping = typeof aiActionFieldMappings.$inferSelect;
export type InsertAiActionFieldMapping = z.infer<typeof insertAiActionFieldMappingSchema>;

export type AiAgentActionBinding = typeof aiAgentActionBindings.$inferSelect;
export type InsertAiAgentActionBinding = z.infer<typeof insertAiAgentActionBindingSchema>;

export type AiFieldCollectionHistory = typeof aiFieldCollectionHistory.$inferSelect;
export type InsertAiFieldCollectionHistory = z.infer<typeof insertAiFieldCollectionHistorySchema>;

// ========================================
// HELPER TYPES
// ========================================

export type CollectionStrategy = 'conversational' | 'interactive' | 'hybrid' | 'adaptive';
export type WidgetType = 'smart_client_selector' | 'smart_location_picker' | 'smart_datetime_picker' | 'priority_picker' | 'status_picker' | 'user_picker' | 'file_uploader' | 'rich_text_editor' | 'rating_picker' | 'checkbox_group' | 'radio_group' | 'dropdown' | 'multi_select' | 'number_stepper' | 'currency_input' | 'phone_input' | 'email_input' | 'url_input' | 'color_picker' | 'custom';
export type ValidationType = 'required' | 'min_length' | 'max_length' | 'pattern' | 'email' | 'phone' | 'url' | 'number' | 'min_value' | 'max_value' | 'date_range' | 'custom';
export type FieldMappingStatus = 'active' | 'inactive' | 'deprecated';

export type ExtractionConfig = z.infer<typeof ExtractionConfigSchema>;
export type ValidationConfig = z.infer<typeof ValidationConfigSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type EndpointConfig = z.infer<typeof EndpointConfigSchema>;
export type ResponseTemplate = z.infer<typeof ResponseTemplateSchema>;
