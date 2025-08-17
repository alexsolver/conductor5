// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN LAYER
// Domain Entity: ApprovalRule - Pure business logic with no external dependencies

export interface ApprovalCondition {
  field: string;
  operator: 'EQ' | 'NEQ' | 'IN' | 'NOT_IN' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'STARTS_WITH' | 'EXISTS' | 'BETWEEN';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ApprovalStepConfig {
  stepIndex: number;
  stepName: string;
  decisionMode: 'ALL' | 'ANY' | 'QUORUM';
  quorumCount?: number;
  slaHours: number;
  approvers: ApprovalApprover[];
  autoApprovalEnabled?: boolean;
  autoApprovalConditions?: ApprovalCondition[];
}

export interface ApprovalApprover {
  type: 'user' | 'user_group' | 'customer_contact' | 'supplier' | 'manager_chain' | 'auto';
  id?: string;
  name: string;
  hierarchyLevel?: number; // For manager_chain type
}

export interface ApprovalRuleValue {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  moduleType: 'tickets' | 'materials' | 'knowledge_base' | 'timecard' | 'contracts';
  entityType: string;
  queryConditions: ApprovalCondition[];
  approvalSteps: ApprovalStepConfig[];
  slaHours: number;
  businessHoursOnly: boolean;
  autoApprovalConditions?: ApprovalCondition[];
  escalationSettings?: any;
  isActive: boolean;
  priority: number;
  createdById: string;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalRule {
  private constructor(private readonly data: ApprovalRuleValue) {}

  static create(data: Omit<ApprovalRuleValue, 'id' | 'createdAt' | 'updatedAt'>): ApprovalRule {
    const now = new Date();
    return new ApprovalRule({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromDatabase(data: ApprovalRuleValue): ApprovalRule {
    return new ApprovalRule(data);
  }

  // Getters
  get id(): string { return this.data.id; }
  get tenantId(): string { return this.data.tenantId; }
  get name(): string { return this.data.name; }
  get description(): string | undefined { return this.data.description; }
  get moduleType(): string { return this.data.moduleType; }
  get entityType(): string { return this.data.entityType; }
  get queryConditions(): ApprovalCondition[] { return this.data.queryConditions; }
  get approvalSteps(): ApprovalStepConfig[] { return this.data.approvalSteps; }
  get slaHours(): number { return this.data.slaHours; }
  get businessHoursOnly(): boolean { return this.data.businessHoursOnly; }
  get escalationSettings(): any { return this.data.escalationSettings; }
  get autoApprovalConditions(): ApprovalCondition[] | undefined { return this.data.autoApprovalConditions; }
  get isActive(): boolean { return this.data.isActive; }
  get priority(): number { return this.data.priority; }
  get createdById(): string { return this.data.createdById; }
  get updatedById(): string | undefined { return this.data.updatedById; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Business Methods
  update(updates: Partial<Omit<ApprovalRuleValue, 'id' | 'tenantId' | 'createdAt' | 'createdById'>>): ApprovalRule {
    return new ApprovalRule({
      ...this.data,
      ...updates,
      updatedAt: new Date(),
    });
  }

  deactivate(): ApprovalRule {
    return this.update({ isActive: false });
  }

  activate(): ApprovalRule {
    return this.update({ isActive: true });
  }

  // Rule evaluation
  evaluateConditions(entityData: Record<string, any>): boolean {
    return this.evaluateConditionGroup(this.queryConditions, entityData);
  }

  private evaluateConditionGroup(conditions: ApprovalCondition[], entityData: Record<string, any>): boolean {
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

  private evaluateCondition(condition: ApprovalCondition, entityData: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(entityData, condition.field);
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

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Auto-approval evaluation
  shouldAutoApprove(entityData: Record<string, any>): boolean {
    if (!this.autoApprovalConditions || this.autoApprovalConditions.length === 0) {
      return false;
    }
    return this.evaluateConditionGroup(this.autoApprovalConditions, entityData);
  }

  // Domain validation
  validate(): string[] {
    const errors: string[] = [];

    if (!this.name.trim()) {
      errors.push('Rule name is required');
    }

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.moduleType) {
      errors.push('Module type is required');
    }

    if (!this.entityType) {
      errors.push('Entity type is required');
    }

    if (this.queryConditions.length === 0) {
      errors.push('At least one query condition is required');
    }

    if (this.approvalSteps.length === 0) {
      errors.push('At least one approval step is required');
    }

    // Validate approval steps
    this.approvalSteps.forEach((step, index) => {
      if (!step.stepName.trim()) {
        errors.push(`Step ${index + 1}: Step name is required`);
      }

      if (step.decisionMode === 'QUORUM' && (!step.quorumCount || step.quorumCount <= 0)) {
        errors.push(`Step ${index + 1}: Quorum count is required for QUORUM decision mode`);
      }

      if (step.approvers.length === 0) {
        errors.push(`Step ${index + 1}: At least one approver is required`);
      }

      if (step.decisionMode === 'QUORUM' && step.quorumCount && step.quorumCount > step.approvers.length) {
        errors.push(`Step ${index + 1}: Quorum count cannot exceed number of approvers`);
      }
    });

    if (this.slaHours <= 0) {
      errors.push('Default SLA hours must be positive');
    }

    if (this.priority < 0) {
      errors.push('Priority must be non-negative');
    }

    return errors;
  }

  // Export for persistence
  toDatabase(): ApprovalRuleValue {
    return { ...this.data };
  }
}