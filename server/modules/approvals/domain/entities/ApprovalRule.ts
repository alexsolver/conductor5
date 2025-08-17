export interface QueryCondition {
  field: string;
  operator: 'EQ' | 'NEQ' | 'IN' | 'NOT_IN' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'STARTS_WITH' | 'EXISTS' | 'BETWEEN';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface QueryConditions {
  conditions: QueryCondition[];
}

export interface ApprovalStepApprover {
  type: 'user' | 'group' | 'manager_chain' | 'external';
  identifier: string;
  level?: number;
}

export interface ApprovalStepConfig {
  stepName: string;
  approverMode: 'ANY' | 'ALL' | 'QUORUM';
  approvers: ApprovalStepApprover[];
  slaHours?: number;
  conditions?: Record<string, any>;
}

export interface EscalationSettings {
  enabled: boolean;
  levels: {
    level: number;
    afterHours: number;
    escalateToType: 'manager' | 'group' | 'user';
    escalateToId: string;
  }[];
}

export interface AutoApprovalConditions {
  enabled: boolean;
  rules: QueryCondition[];
}

export class ApprovalRule {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly moduleType: 'tickets' | 'materials' | 'knowledge_base' | 'timecard' | 'contracts',
    public readonly queryConditions: QueryConditions,
    public readonly approvalSteps: ApprovalStepConfig[],
    public readonly escalationSettings: EscalationSettings,
    public readonly slaHours: number,
    public readonly businessHoursOnly: boolean,
    public readonly autoApprovalConditions: AutoApprovalConditions,
    public readonly priority: number,
    public readonly isActive: boolean,
    public readonly createdById: string,
    public readonly updatedById: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validateRule();
  }

  private validateRule(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Approval rule name is required');
    }

    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.queryConditions.conditions || this.queryConditions.conditions.length === 0) {
      throw new Error('At least one query condition is required');
    }

    if (!this.approvalSteps || this.approvalSteps.length === 0) {
      throw new Error('At least one approval step is required');
    }

    if (this.slaHours <= 0) {
      throw new Error('SLA hours must be greater than 0');
    }

    if (this.priority < 1 || this.priority > 999) {
      throw new Error('Priority must be between 1 and 999');
    }

    // Validate approval steps
    this.approvalSteps.forEach((step, index) => {
      if (!step.stepName || step.stepName.trim().length === 0) {
        throw new Error(`Step ${index + 1} name is required`);
      }

      if (!step.approvers || step.approvers.length === 0) {
        throw new Error(`Step ${index + 1} must have at least one approver`);
      }

      step.approvers.forEach((approver, approverIndex) => {
        if (!approver.identifier || approver.identifier.trim().length === 0) {
          throw new Error(`Step ${index + 1}, approver ${approverIndex + 1} identifier is required`);
        }
      });
    });
  }

  public matchesEntity(entityData: Record<string, any>): boolean {
    return this.evaluateConditions(this.queryConditions.conditions, entityData);
  }

  private evaluateConditions(conditions: QueryCondition[], entityData: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], entityData);
    
    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, entityData);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else { // Default to AND
        result = result && conditionResult;
      }
    }

    return result;
  }

  private evaluateCondition(condition: QueryCondition, entityData: Record<string, any>): boolean {
    const fieldValue = entityData[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'EQ':
        return fieldValue === conditionValue;
      case 'NEQ':
        return fieldValue !== conditionValue;
      case 'IN':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'NOT_IN':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'GT':
        return Number(fieldValue) > Number(conditionValue);
      case 'GTE':
        return Number(fieldValue) >= Number(conditionValue);
      case 'LT':
        return Number(fieldValue) < Number(conditionValue);
      case 'LTE':
        return Number(fieldValue) <= Number(conditionValue);
      case 'CONTAINS':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'STARTS_WITH':
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      case 'EXISTS':
        return fieldValue !== null && fieldValue !== undefined;
      case 'BETWEEN':
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const numValue = Number(fieldValue);
          return numValue >= Number(conditionValue[0]) && numValue <= Number(conditionValue[1]);
        }
        return false;
      default:
        return false;
    }
  }

  public shouldAutoApprove(entityData: Record<string, any>): boolean {
    if (!this.autoApprovalConditions.enabled) {
      return false;
    }

    return this.evaluateConditions(this.autoApprovalConditions.rules, entityData);
  }

  public calculateSlaDeadline(startDate: Date = new Date()): Date {
    const deadline = new Date(startDate);
    
    if (this.businessHoursOnly) {
      // Simple implementation - add business hours
      // In a real system, this would consider holidays and weekends
      let hoursToAdd = this.slaHours;
      let currentHour = deadline.getHours();
      
      while (hoursToAdd > 0) {
        if (currentHour >= 8 && currentHour < 18) { // Business hours 8-18
          hoursToAdd--;
        }
        deadline.setHours(deadline.getHours() + 1);
        currentHour = deadline.getHours();
      }
    } else {
      deadline.setHours(deadline.getHours() + this.slaHours);
    }

    return deadline;
  }
}