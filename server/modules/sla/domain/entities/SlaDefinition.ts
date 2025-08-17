// ✅ 1QA.MD COMPLIANCE: SLA DOMAIN ENTITY
// Clean Architecture domain entity for SLA definitions

export interface SlaDefinition {
  id: string;
  tenantId: string;
  
  // Basic SLA information
  name: string;
  description?: string;
  type: 'SLA' | 'OLA' | 'UC';
  status: 'active' | 'inactive' | 'expired' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Validity period
  validFrom: Date;
  validUntil?: Date;
  
  // Application rules
  applicationRules: SlaApplicationRule[];
  
  // Target metrics
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  updateTimeMinutes?: number;
  idleTimeMinutes?: number;
  
  // Working calendar
  businessHoursOnly: boolean;
  workingDays: number[];
  workingHours: { start: string; end: string };
  timezone: string;
  
  // Escalation settings
  escalationEnabled: boolean;
  escalationThresholdPercent: number;
  escalationActions: SlaEscalationAction[];
  
  // Pause/Resume conditions
  pauseConditions: SlaCondition[];
  resumeConditions: SlaCondition[];
  stopConditions: SlaCondition[];
  
  // Automation workflows
  workflowActions: SlaWorkflowAction[];
  
  // System fields
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlaApplicationRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface SlaCondition {
  type: 'ticket_created' | 'ticket_assigned' | 'status_change' | 'priority_change' | 'category_change' | 'customer_response' | 'agent_response';
  field?: string;
  operator?: string;
  value?: any;
}

export interface SlaEscalationAction {
  level: number;
  thresholdPercent: number;
  action: 'notify' | 'reassign' | 'escalate_priority' | 'create_incident';
  target?: string;
  message?: string;
}

export interface SlaWorkflowAction {
  trigger: 'start' | 'pause' | 'resume' | 'breach' | 'complete';
  action: 'notify' | 'update_field' | 'run_automation' | 'create_task';
  parameters: Record<string, any>;
}

export interface SlaInstance {
  id: string;
  tenantId: string;
  slaDefinitionId: string;
  ticketId: string;
  
  // SLA lifecycle
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;
  violatedAt?: Date;
  
  // Current status
  status: 'running' | 'paused' | 'completed' | 'violated';
  currentMetric: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time';
  
  // Time tracking
  elapsedMinutes: number;
  pausedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  
  // Performance metrics
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  idleTimeMinutes: number;
  
  // Breach tracking
  isBreached: boolean;
  breachDurationMinutes: number;
  breachPercentage: number;
  
  // Last activity tracking
  lastActivityAt?: Date;
  lastAgentActivityAt?: Date;
  lastCustomerActivityAt?: Date;
  
  // Escalation tracking
  escalationLevel: number;
  escalatedAt?: Date;
  escalatedTo?: string;
  
  // Automation tracking
  automationTriggered: boolean;
  automationActions: any[];
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

export interface SlaEvent {
  id: string;
  tenantId: string;
  slaInstanceId: string;
  ticketId: string;
  
  // Event details
  eventType: 'started' | 'paused' | 'resumed' | 'completed' | 'violated' | 'escalated';
  eventReason?: string;
  previousStatus?: string;
  newStatus?: string;
  
  // Time tracking
  elapsedMinutesAtEvent: number;
  remainingMinutesAtEvent: number;
  
  // Trigger information
  triggeredBy: 'system' | 'user' | 'automation';
  triggeredByUserId?: string;
  triggerCondition?: string;
  
  // Event data
  eventData: Record<string, any>;
  
  createdAt: Date;
}

export interface SlaViolation {
  id: string;
  tenantId: string;
  slaInstanceId: string;
  ticketId: string;
  slaDefinitionId: string;
  
  // Violation details
  violationType: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time';
  targetMinutes: number;
  actualMinutes: number;
  violationMinutes: number;
  violationPercentage: number;
  
  // Impact assessment
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  businessImpact?: string;
  
  // Resolution tracking
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  
  // Root cause analysis
  rootCause?: string;
  preventiveActions?: string;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}