// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW DOMAIN ENTITY
// Pure business logic for SLA automation workflows

export interface SlaWorkflowTrigger {
  id: string;
  type: 'time_based' | 'event_based' | 'condition_based';
  conditions: SlaWorkflowCondition[];
  schedule?: {
    type: 'interval' | 'cron';
    value: string;
  };
}

export interface SlaWorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface SlaWorkflowAction {
  id: string;
  type: 'notify' | 'escalate' | 'assign' | 'update_field' | 'pause_sla' | 'resume_sla' | 'create_task';
  parameters?: Record<string, any>;
  config?: Record<string, any>; // Alternative property name for parameters
  delay?: number; // milliseconds
  order?: number; // Make optional since frontend may not always provide it
}

export interface SlaWorkflowExecution {
  id: string;
  workflowId: string;
  tenantId: string;
  triggeredBy: string;
  triggeredAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  context: Record<string, any>;
  executedActions: string[];
  error?: string;
  completedAt?: Date;
}

export class SlaWorkflow {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly isActive: boolean,
    public readonly triggers: SlaWorkflowTrigger[],
    public readonly actions: SlaWorkflowAction[],
    public readonly metadata: Record<string, any>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain methods
  canExecute(context: Record<string, any>): boolean {
    if (!this.isActive) return false;
    
    return this.triggers.some(trigger => this.evaluateTrigger(trigger, context));
  }

  private evaluateTrigger(trigger: SlaWorkflowTrigger, context: Record<string, any>): boolean {
    if (trigger.type === 'time_based') {
      return this.evaluateTimeBasedTrigger(trigger, context);
    }
    
    if (trigger.type === 'event_based') {
      return this.evaluateEventBasedTrigger(trigger, context);
    }
    
    if (trigger.type === 'condition_based') {
      return this.evaluateConditionBasedTrigger(trigger, context);
    }
    
    return false;
  }

  private evaluateTimeBasedTrigger(trigger: SlaWorkflowTrigger, context: Record<string, any>): boolean {
    // Time-based evaluation logic
    if (!trigger.schedule) return false;
    
    const now = new Date();
    const scheduleValue = trigger.schedule.value;
    
    if (trigger.schedule.type === 'interval') {
      // Check if interval condition is met
      const intervalMs = parseInt(scheduleValue) * 60000; // Convert minutes to ms
      const lastExecution = context.lastExecutionTime || 0;
      return (now.getTime() - lastExecution) >= intervalMs;
    }
    
    return false; // Cron evaluation would require additional library
  }

  private evaluateEventBasedTrigger(trigger: SlaWorkflowTrigger, context: Record<string, any>): boolean {
    // Event-based evaluation - check if required event occurred
    return trigger.conditions.every(condition => this.evaluateCondition(condition, context));
  }

  private evaluateConditionBasedTrigger(trigger: SlaWorkflowTrigger, context: Record<string, any>): boolean {
    if (trigger.conditions.length === 0) return true;
    
    let result = true;
    let currentLogicalOp: 'AND' | 'OR' = 'AND';
    
    for (const condition of trigger.conditions) {
      const conditionResult = this.evaluateCondition(condition, context);
      
      if (currentLogicalOp === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
      
      currentLogicalOp = condition.logicalOperator || 'AND';
    }
    
    return result;
  }

  private evaluateCondition(condition: SlaWorkflowCondition, context: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const conditionValue = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'greater_than':
        return fieldValue > conditionValue;
      case 'less_than':
        return fieldValue < conditionValue;
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'between':
        return Array.isArray(conditionValue) && 
               fieldValue >= conditionValue[0] && 
               fieldValue <= conditionValue[1];
      default:
        return false;
    }
  }

  private getFieldValue(fieldPath: string, context: Record<string, any>): any {
    const keys = fieldPath.split('.');
    let value = context;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  getNextActions(executedActions: string[]): SlaWorkflowAction[] {
    return this.actions
      .filter(action => !executedActions.includes(action.id))
      .sort((a, b) => a.order - b.order);
  }

  validateActionParameters(action: SlaWorkflowAction): boolean {
    // Get parameters from either parameters or config property
    const params = action.parameters || (action as any).config || {};
    
    // Validate required parameters for each action type
    switch (action.type) {
      case 'notify':
        return !!(params.recipients && (params.message || params.message === ''));
      case 'escalate':
        return !!(params.targetUserId || params.targetTeamId);
      case 'assign':
        return !!(params.userId);
      case 'update_field':
        return !!(params.field && params.value !== undefined);
      case 'pause_sla':
      case 'resume_sla':
        return true; // No specific parameters required
      case 'create_task':
        return !!(params.title && params.assignedTo);
      default:
        return false;
    }
  }
}