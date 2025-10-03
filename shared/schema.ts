// ✅ 1QA.MD COMPLIANCE: UNIFIED SCHEMA - SINGLE SOURCE OF TRUTH
// Re-exports from schema-master.ts as the authoritative source
// CRITICAL: Este arquivo é a fonte única para imports em todo o sistema

// Import Drizzle essentials FIRST
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';

// Re-export all schema definitions - avoiding conflicts
export * from "./schema-master";

// Export tenant-specific schemas and validation
export {
  userGroups,
  userGroupMemberships,
  insertUserGroupSchema,
  insertUserGroupMembershipSchema
} from "./schema-tenant";

// Reports & Dashboards Module Schema - using selective exports to avoid conflicts
export {
  reports,
  dashboards
} from "./schema-reports";

// GDPR Compliance Module Schema - Clean Version
export * from "./schema-gdpr-compliance-clean";

// Knowledge Base Module Schema - Clean Architecture (excluding TemplateField to avoid conflicts)
export {
  knowledgeBaseStatusEnum,
  knowledgeBaseCategoryEnum,
  knowledgeBaseVisibilityEnum,
  knowledgeBaseApprovalStatusEnum,
  knowledgeBaseArticles,
  knowledgeBaseArticleVersions,
  knowledgeBaseAttachments,
  knowledgeBaseRatings,
  knowledgeBaseApprovals,
  knowledgeBaseArticleRelations,
  knowledgeBaseSearchLogs,
  knowledgeBaseTemplates,
  knowledgeBaseComments,
  knowledgeBaseScheduledPublications,
  insertKnowledgeBaseArticleSchema,
  updateKnowledgeBaseArticleSchema,
  insertKnowledgeBaseRatingSchema,
  insertKnowledgeBaseApprovalSchema,
  insertKnowledgeBaseRelationSchema,
  insertKnowledgeBaseTemplateSchema,
  insertKnowledgeBaseCommentSchema,
  insertKnowledgeBaseScheduledPublicationSchema,
  knowledgeBaseSearchSchema,
  knowledgeBaseArticlesRelations,
  knowledgeBaseArticleVersionsRelations,
  knowledgeBaseAttachmentsRelations,
  knowledgeBaseRatingsRelations,
  knowledgeBaseApprovalsRelations,
  knowledgeBaseArticleRelationsRelations
} from "./schema-knowledge-base";

// Interactive Map Module Schema - Clean Architecture
export * from "./schema-interactive-map";

// AI Conversational Agent Module Schema - Clean Architecture
export * from "./schema-ai-agent";

// SaaS Admin Module Schema - Clean Architecture
export * from "./schema-saas-admin";

// Selective export from contracts to avoid conflicts - Export only enums
export {
  contractTypeEnum,
  contractStatusEnum,
  contractPriorityEnum,
  documentTypeEnum,
  accessLevelEnum,
  signatureStatusEnum,
  measurementPeriodEnum,
  billingCycleEnum,
  paymentStatusEnum,
  renewalTypeEnum,
  equipmentStatusEnum,
} from "./schema-contracts";

// ✅ DRIZZLE ORM SETUP - 1QA.MD PATTERNS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 50 : 20,
  min: process.env.NODE_ENV === 'production' ? 5 : 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Import all schema definitions for drizzle connection
import * as schemaDefinitions from "./schema-master";

// Export essentials for universal access
export const db = drizzle({ client: pool, schema: schemaDefinitions });
export { sql, pool };

// Selective exports from materials-services to avoid conflicts with schema-master
export {
  itemTypeEnum,
  measurementUnitEnum,
  itemStatusEnum,
  movementTypeEnum,
  linkTypeEnum,
  itemAttachments,
  itemGroups,
  itemGroupMemberships,
  itemHierarchy,
  bulkItemOperations,
  itemCustomerLinks,
  itemSupplierLinks,
  stockLocations,
  stockLevels,
  stockMovements,
  suppliers,
  supplierCatalog,
  serviceTypes,
  serviceExecution,
  assetMovements,
  assetMaintenance,
  assetMeters,
  priceLists,
  priceListItems,
  priceListVersions,
  pricingRules,
  dynamicPricing,
  materialCertifications,
  complianceAudits,
  complianceAlerts,
  complianceCertifications,
  complianceEvidence,
  complianceScores,
  systemSettings,
  // Relations
  itemsRelations,
  itemGroupsRelations,
  itemGroupMembershipsRelations,
  itemHierarchyRelations,
  stockLocationsRelations,
  suppliersRelations,
  priceListsRelations
} from "./schema-materials-services";

// Validation: Ensure all critical exports are available
import type {
  users, customers, tickets, tenants, companies,
  ticketPlannedItems, ticketConsumedItems,
  items, customerItemMappings, insertCustomerItemMappingSchema
} from "./schema-master";

import type {
  PriceList, PricingRule
} from "./schema-materials-services";

// User Notification Preferences - Already exported from schema-master

// Re-export all types for consistency
export type {
  users, customers, tickets, tenants, companies,
  ticketPlannedItems, ticketConsumedItems,
  items, customerItemMappings, insertCustomerItemMappingSchema
};

// Re-export materials-services types
export type {
  PriceList, PricingRule
} from "./schema-materials-services";

// User Notification Preferences types - Already exported from schema-master

// This file serves as the single entry point for all schema definitions
// All imports should use: import { ... } from '@shared/schema'

// CRITICAL FIX: Remove duplicate tickets definition
// The tickets table is properly defined in schema-master.ts
// This redundant definition was causing schema conflicts

// Removed duplicate userNotificationPreferences table - using the one from schema-notifications.ts per 1qa.md

// Export all tables and schemas
export * from './schema-field-layout';

// ✅ 1QA.MD: Approval Rules Export - Critical for Approval Management Module
// Export approval-related tables and enums from schema-master
export {
  approvalRules,
  approvalInstances,
  approvalDecisions,
  approvalSteps,
  approvalConditions,
  approvalWorkflows,
  approvalEntityTypeEnum,
  queryOperatorEnum
} from './schema-master';

// Selective export from schema-sla to avoid queryOperatorEnum conflict with schema-master
// TEMPORARILY COMMENTED TO FIX MODULE LOADING ISSUE - WILL RE-ENABLE ONCE SYSTEM IS STABLE
// export {
//   slaDefinitions,
//   slaWorkflows,
//   slaWorkflowExecutions,
//   slaInstances,
//   slaEvents,
//   slaViolations,
//   slaReports,
//   insertSlaDefinitionSchema,
//   insertSlaInstanceSchema,
//   insertSlaEventSchema,
//   insertSlaViolationSchema,
//   insertSlaReportSchema,
//   SlaDefinition,
//   InsertSlaDefinition,
//   SlaInstance,
//   InsertSlaInstance,
//   SlaEvent,
//   InsertSlaEvent,
//   SlaViolation,
//   InsertSlaViolation,
//   SlaReport,
//   InsertSlaReport
// } from './schema-sla';

// Selective exports from locations to avoid conflicts
export {
  locationTypeEnum,
  geometryTypeEnum,
  locationStatusEnum,
  segmentTypeEnum,
  areaTypeEnum,
  routeTypeEnum,
  difficultyLevelEnum,
  serviceLevelEnum,
  securityLevelEnum,
  accessTypeEnum,
  membershipTypeEnum,
  groupTypeEnum,
  locations as geoLocations,
  locationSegments,
  locationAreas,
  locationRoutes,
  areaGroups,
  locationAreaMemberships,
  insertLocationSchema as insertGeoLocationSchema,
  insertLocationSegmentSchema,
  insertLocationAreaSchema,
  insertLocationRouteSchema,
  insertAreaGroupSchema,
  businessHoursSchema,
  accessRequirementsSchema,
  slaConfigSchema
} from './schema-locations';

// OmniBridge tables
import { pgTable, varchar, timestamp, jsonb, text, integer, boolean, uuid, json, unique, index } from 'drizzle-orm/pg-core';

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


export const omnibridgeAutomationRules = pgTable('omnibridge_automation_rules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  trigger: jsonb('trigger').notNull(),
  actions: jsonb('actions').notNull().default([]),
  enabled: boolean('enabled').default(true),
  priority: integer('priority').default(1),
  aiEnabled: boolean('ai_enabled').default(false),
  aiPromptId: varchar('ai_prompt_id', { length: 36 }),
  executionCount: integer('execution_count').default(0),
  successCount: integer('success_count').default(0),
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ✅ 1QA.MD: Custom Fields imported from schema-master.ts to avoid duplicates

// ✅ 1QA.MD: Note - Ticket template functionality is handled through templateName/templateAlternative fields in tickets table

// Note: tickets and ticketRelationships are already exported from schema-master via schema-tenant

// Export all tables and schemas
export * from './schema-master';
export * from './schema-public';
export * from './schema-tenant';

// User Skills table (if not already defined elsewhere)
export const userSkills = pgTable('user_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  skillId: uuid('skill_id').notNull(),
  proficiencyLevel: varchar('proficiency_level', { length: 50 }).default('beginner').notNull(),
  yearsOfExperience: integer('years_of_experience').default(0).notNull(),
  certifications: text('certifications').default('[]'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    tenantIdIdx: index('user_skills_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('user_skills_user_id_idx').on(table.userId),
    skillIdIdx: index('user_skills_skill_id_idx').on(table.skillId),
    uniqueUserSkill: unique('unique_user_skill').on(table.tenantId, table.userId, table.skillId)
  };
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
    intentionAnalysis: 'Analise a mensagem e identifique a intenção principal',
    priorityClassification: 'Classifique a prioridade da mensagem',
    autoResponse: 'Responda de forma profissional e prestativa',
    sentimentAnalysis: 'Analise o sentimento da mensagem',
    entityExtraction: 'Extraia informações importantes da mensagem'
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const omnibridgeSettings = pgTable('omnibridge_settings', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  channels: jsonb('channels').notNull().default([]),
  filters: jsonb('filters').notNull().default({}),
  search: jsonb('search').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// AI Agents para atendimento conversacional
export const omnibridgeAiAgents = pgTable('omnibridge_ai_agents', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  personality: jsonb('personality').notNull().default({
    tone: 'professional',
    language: 'pt-BR',
    greeting: 'Olá! Como posso ajudar você hoje?',
    fallbackMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?'
  }),
  channels: jsonb('channels').notNull().default([]), // ['email', 'whatsapp', 'telegram']
  enabledActions: jsonb('enabled_actions').notNull().default([]), // Lista de ações que pode executar
  conversationConfig: jsonb('conversation_config').notNull().default({
    useMenus: true,
    maxTurns: 10,
    requireConfirmation: true,
    escalationKeywords: ['humano', 'atendente', 'supervisor']
  }),
  aiConfig: jsonb('ai_config').notNull().default({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1500,
    extractionPrompts: {
      general: 'Extraia as informações necessárias da conversa',
      confirmation: 'Confirme se entendi corretamente:'
    }
  }),
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(1),
  stats: jsonb('stats').default({
    conversationsHandled: 0,
    actionsExecuted: 0,
    successRate: 100,
    averageResponseTime: 0
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Conversas ativas dos agentes IA
export const omnibridgeAiConversations = pgTable('omnibridge_ai_conversations', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 100 }).notNull(), // Email ou identificador do usuário
  channelId: varchar('channel_id', { length: 36 }).notNull(),
  channelType: varchar('channel_type', { length: 50 }).notNull(), // 'email', 'whatsapp', 'telegram'
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'waiting_input', 'completed', 'escalated'
  context: jsonb('context').notNull().default({}), // Informações coletadas na conversa
  currentStep: varchar('current_step', { length: 100 }).notNull().default('greeting'),
  intendedAction: varchar('intended_action', { length: 100 }), // Ação que o agente pretende executar
  actionParams: jsonb('action_params').default({}), // Parâmetros coletados para a ação
  conversationHistory: jsonb('conversation_history').notNull().default([]),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Para limpeza automática de conversas antigas
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Menu templates para interação estruturada
export const omnibridgeAiMenus = pgTable('omnibridge_ai_menus', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  actionType: varchar('action_type', { length: 100 }).notNull(), // Tipo de ação para o qual o menu é usado
  menuData: jsonb('menu_data').notNull().default({
    title: 'Selecione uma opção:',
    options: [],
    allowCustomInput: false,
    maxSelections: 1
  }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Templates de ações com parâmetros configuráveis
export const omnibridgeAiActionTemplates = pgTable('omnibridge_ai_action_templates', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  actionType: varchar('action_type', { length: 100 }).notNull(), // Tipo da ação (send_notification, create_ticket, etc.)
  template: jsonb('template').notNull().default({
    requiredParams: [],
    optionalParams: [],
    extractionPrompt: '',
    confirmationMessage: '',
    successMessage: '',
    errorMessage: ''
  }),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
// OmniBridge Logging & Learning System Schema
export * from "./schema-omnibridge-logging";
