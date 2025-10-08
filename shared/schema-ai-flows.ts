// ========================================
// AI VISUAL FLOW BUILDER SCHEMA
// ========================================
// Schema for visual flow-based AI action builder (n8n-style)
// Allows users to create complex AI workflows using drag-and-drop nodes

import { pgTable, varchar, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ========================================
// ENUMS
// ========================================

export const flowStatusEnum = pgEnum('flow_status', [
  'draft',
  'active',
  'inactive',
  'archived'
]);

export const nodeTypeEnum = pgEnum('node_type', [
  'trigger',
  'conversation',
  'data',
  'logic',
  'action',
  'communication',
  'integration',
  'end'
]);

export const executionStatusEnum = pgEnum('execution_status', [
  'running',
  'completed',
  'failed',
  'cancelled'
]);

// ========================================
// MAIN TABLES
// ========================================

// AI Action Flows - Visual flow definitions
export const aiActionFlows = pgTable('ai_action_flows', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  
  // Basic Info
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'ticket', 'customer', 'general', etc
  icon: varchar('icon', { length: 50 }).default('Workflow'),
  status: flowStatusEnum('status').default('draft').notNull(),
  
  // Flow Definition (React Flow format)
  nodes: jsonb('nodes').$type<Array<{
    id: string;
    type: string; // node type from registry
    position: { x: number; y: number };
    data: Record<string, any>; // node configuration
  }>>().default([]).notNull(),
  
  edges: jsonb('edges').$type<Array<{
    id: string;
    source: string; // source node id
    target: string; // target node id
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
  }>>().default([]).notNull(),
  
  // Configuration
  settings: jsonb('settings').$type<{
    requireConfirmation?: boolean;
    timeout?: number; // seconds
    retryOnError?: boolean;
    maxRetries?: number;
  }>().default({}),
  
  // Metadata
  isTemplate: boolean('is_template').default(false),
  isPublic: boolean('is_public').default(false), // share with other tenants
  
  // Usage Stats
  stats: jsonb('stats').$type<{
    totalExecutions?: number;
    successfulExecutions?: number;
    failedExecutions?: number;
    avgExecutionTime?: number;
    lastExecuted?: string;
  }>().default({}),
  
  // Audit
  createdBy: varchar('created_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  tenantIdx: index('ai_action_flows_tenant_idx').on(table.tenantId),
  statusIdx: index('ai_action_flows_status_idx').on(table.status),
  categoryIdx: index('ai_action_flows_category_idx').on(table.category)
}));

// Node Type Definitions - Registry of available node types
export const aiNodeDefinitions = pgTable('ai_node_definitions', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  
  // Node Type Info
  type: varchar('type', { length: 100 }).notNull().unique(), // unique identifier like 'ask_question', 'create_ticket'
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: nodeTypeEnum('category').notNull(),
  icon: varchar('icon', { length: 50 }).default('Circle'),
  color: varchar('color', { length: 20 }).default('#6366f1'),
  
  // Configuration Schema
  configSchema: jsonb('config_schema').$type<{
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json' | 'code';
      required?: boolean;
      defaultValue?: any;
      options?: Array<{ label: string; value: string }>;
      placeholder?: string;
      helpText?: string;
    }>;
  }>().notNull(),
  
  // Input/Output Definition
  inputs: jsonb('inputs').$type<Array<{
    name: string;
    type: string;
    required?: boolean;
  }>>().default([]),
  
  outputs: jsonb('outputs').$type<Array<{
    name: string;
    type: string;
    description?: string;
  }>>().default([]),
  
  // Execution Handler
  handlerType: varchar('handler_type', { length: 50 }).notNull(), // 'builtin', 'custom', 'api'
  handlerConfig: jsonb('handler_config').$type<{
    endpoint?: string; // for API handlers
    method?: string;
    function?: string; // for builtin handlers
    code?: string; // for custom code
  }>(),
  
  // Availability
  isSystemNode: boolean('is_system_node').default(true), // built-in vs custom
  isActive: boolean('is_active').default(true),
  
  // Metadata
  version: varchar('version', { length: 20 }).default('1.0.0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  typeIdx: index('ai_node_definitions_type_idx').on(table.type),
  categoryIdx: index('ai_node_definitions_category_idx').on(table.category)
}));

// Flow Executions - Execution history and logs
export const aiFlowExecutions = pgTable('ai_flow_executions', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar('flow_id', { length: 36 }).notNull(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  
  // Execution Context
  conversationId: varchar('conversation_id', { length: 36 }), // link to AI conversation
  triggeredBy: varchar('triggered_by', { length: 36 }), // user id
  
  // Status
  status: executionStatusEnum('status').default('running').notNull(),
  
  // Execution Data
  input: jsonb('input').$type<Record<string, any>>().default({}),
  output: jsonb('output').$type<Record<string, any>>(),
  
  // Node Execution Trace
  nodeExecutions: jsonb('node_executions').$type<Array<{
    nodeId: string;
    nodeType: string;
    startTime: string;
    endTime?: string;
    status: 'running' | 'completed' | 'failed' | 'skipped';
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
  }>>().default([]),
  
  // Error Info
  error: text('error'),
  errorNode: varchar('error_node', { length: 36 }), // node that caused error
  
  // Timing
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration') // milliseconds
}, (table) => ({
  flowIdx: index('ai_flow_executions_flow_idx').on(table.flowId),
  tenantIdx: index('ai_flow_executions_tenant_idx').on(table.tenantId),
  statusIdx: index('ai_flow_executions_status_idx').on(table.status),
  conversationIdx: index('ai_flow_executions_conversation_idx').on(table.conversationId)
}));

// ========================================
// RELATIONS
// ========================================

export const aiActionFlowsRelations = relations(aiActionFlows, ({ many }) => ({
  executions: many(aiFlowExecutions)
}));

export const aiFlowExecutionsRelations = relations(aiFlowExecutions, ({ one }) => ({
  flow: one(aiActionFlows, {
    fields: [aiFlowExecutions.flowId],
    references: [aiActionFlows.id]
  })
}));

// ========================================
// ZOD SCHEMAS
// ========================================

export const insertAiActionFlowSchema = createInsertSchema(aiActionFlows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiNodeDefinitionSchema = createInsertSchema(aiNodeDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiFlowExecutionSchema = createInsertSchema(aiFlowExecutions).omit({
  id: true,
  startedAt: true
});

// ========================================
// TYPES
// ========================================

export type AiActionFlow = typeof aiActionFlows.$inferSelect;
export type InsertAiActionFlow = z.infer<typeof insertAiActionFlowSchema>;

export type AiNodeDefinition = typeof aiNodeDefinitions.$inferSelect;
export type InsertAiNodeDefinition = z.infer<typeof insertAiNodeDefinitionSchema>;

export type AiFlowExecution = typeof aiFlowExecutions.$inferSelect;
export type InsertAiFlowExecution = z.infer<typeof insertAiFlowExecutionSchema>;
