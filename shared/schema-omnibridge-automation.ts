
// ======================================
// OMNIBRIDGE AUTOMATION SCHEMA
// ======================================
// Schema específico para automações do OmniBridge com Query Builder

export interface OmniBridgeQueryRule {
  field: string;
  operator: string;
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export interface OmniBridgeQueryBuilder {
  rules: OmniBridgeQueryRule[];
  logicalOperator: 'AND' | 'OR';
}

export interface OmniBridgeAutomationAction {
  id: string;
  type: string;
  name: string;
  description: string;
  config: Record<string, any>;
  priority: number;
}

export interface OmniBridgeAutomationRule {
  id?: string;
  tenantId: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: OmniBridgeQueryBuilder;
  actions: OmniBridgeAutomationAction[];
  priority: number;
  aiPromptId?: string;
  executionCount: number;
  successCount: number;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Campos disponíveis para automações
export const OMNIBRIDGE_AUTOMATION_FIELDS = [
  'channelType',
  'from',
  'to', 
  'subject',
  'content',
  'priority',
  'tags',
  'receivedAt',
  'sentAt',
  'messageType',
  'attachments',
  'isRead',
  'senderType',
  'customerGroup',
  'messageLength',
  'businessHours',
  'responseTime',
  'sentiment',
  'intent',
  'urgency',
  'language',
  'metadata'
] as const;

// Operadores disponíveis
export const OMNIBRIDGE_AUTOMATION_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'regex',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'between',
  'in',
  'not_in',
  'is_empty',
  'is_not_empty',
  'ai_matches'
] as const;

export type OmniBridgeAutomationField = typeof OMNIBRIDGE_AUTOMATION_FIELDS[number];
export type OmniBridgeAutomationOperator = typeof OMNIBRIDGE_AUTOMATION_OPERATORS[number];
