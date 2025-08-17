/**
 * EXPENSE POLICY ENTITY - DOMAIN LAYER
 * ✅ 1QA.MD COMPLIANCE: Pure domain entity without external dependencies
 * ✅ CLEAN ARCHITECTURE: Domain-driven design
 * ✅ BUSINESS LOGIC: Policy evaluation and rule engine
 */

export interface ExpensePolicy {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  limits?: PolicyLimits;
  requiredDocuments?: DocumentRequirement[];
  taxRules?: TaxRule[];
  riskFactors?: RiskFactor[];
  applicableRoles?: string[];
  applicableDepartments?: string[];
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  createdById: string;
  updatedAt: Date;
  updatedById: string;
}

export interface InsertExpensePolicy {
  tenantId: string;
  name: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  limits?: PolicyLimits;
  requiredDocuments?: DocumentRequirement[];
  taxRules?: TaxRule[];
  riskFactors?: RiskFactor[];
  applicableRoles?: string[];
  applicableDepartments?: string[];
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdById: string;
  updatedById: string;
}

export interface PolicyCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
  logicalOperator?: 'and' | 'or';
  group?: string;
}

export interface PolicyAction {
  type: 'block' | 'warn' | 'require_approval' | 'set_risk_score' | 'require_document' | 'notify';
  parameters?: Record<string, any>;
  message?: string;
}

export interface PolicyLimits {
  dailyLimit?: {
    amount: number;
    currency: string;
    category?: string;
  };
  monthlyLimit?: {
    amount: number;
    currency: string;
    category?: string;
  };
  perItemLimit?: {
    amount: number;
    currency: string;
    category?: string;
  };
  mileageRate?: {
    rate: number;
    currency: string;
    vehicleType?: string;
  };
}

export interface DocumentRequirement {
  documentType: string;
  required: boolean;
  conditions?: PolicyCondition[];
  minimumAmount?: number;
}

export interface TaxRule {
  region: string;
  taxType: string;
  rate: number;
  conditions?: PolicyCondition[];
  exemptions?: string[];
}

export interface RiskFactor {
  factor: string;
  weight: number;
  conditions?: PolicyCondition[];
}

/**
 * Domain service for expense policy evaluation
 */
export class ExpensePolicyEngine {
  /**
   * Evaluate all policies against an expense report
   */
  static evaluatePolicies(
    policies: ExpensePolicy[],
    expenseReport: any,
    expenseItems: any[],
    context: PolicyEvaluationContext
  ): PolicyEvaluationResult {
    const violations: PolicyViolation[] = [];
    const warnings: PolicyWarning[] = [];
    const requiredApprovals: ApprovalRequirement[] = [];
    let riskScore = 0;

    // Sort policies by priority (higher priority first)
    const sortedPolicies = policies.sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      if (!this.isPolicyApplicable(policy, context)) {
        continue;
      }

      const policyResult = this.evaluatePolicy(policy, expenseReport, expenseItems, context);
      
      violations.push(...policyResult.violations);
      warnings.push(...policyResult.warnings);
      requiredApprovals.push(...policyResult.requiredApprovals);
      riskScore += policyResult.riskScore;
    }

    return {
      violations,
      warnings,
      requiredApprovals,
      riskScore: Math.min(riskScore, 100), // Cap at 100
      overallCompliance: violations.length === 0,
      requiresManualReview: violations.some(v => v.severity === 'critical') || riskScore >= 70
    };
  }

  /**
   * Check if policy is applicable for current context
   */
  private static isPolicyApplicable(policy: ExpensePolicy, context: PolicyEvaluationContext): boolean {
    // Check if policy is active
    if (!policy.isActive) {
      return false;
    }

    // Check effective dates
    const now = new Date();
    if (policy.effectiveFrom > now || (policy.effectiveTo && policy.effectiveTo < now)) {
      return false;
    }

    // Check role applicability
    if (policy.applicableRoles && policy.applicableRoles.length > 0) {
      if (!policy.applicableRoles.includes(context.userRole)) {
        return false;
      }
    }

    // Check department applicability
    if (policy.applicableDepartments && policy.applicableDepartments.length > 0) {
      if (!policy.applicableDepartments.includes(context.departmentId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single policy
   */
  private static evaluatePolicy(
    policy: ExpensePolicy,
    expenseReport: any,
    expenseItems: any[],
    context: PolicyEvaluationContext
  ): PolicyEvaluationResult {
    const violations: PolicyViolation[] = [];
    const warnings: PolicyWarning[] = [];
    const requiredApprovals: ApprovalRequirement[] = [];
    let riskScore = 0;

    // Evaluate conditions
    const conditionsMet = this.evaluateConditions(policy.conditions, expenseReport, expenseItems, context);

    if (conditionsMet) {
      // Execute actions
      for (const action of policy.actions) {
        const actionResult = this.executeAction(action, policy, expenseReport, expenseItems, context);
        
        violations.push(...actionResult.violations);
        warnings.push(...actionResult.warnings);
        requiredApprovals.push(...actionResult.requiredApprovals);
        riskScore += actionResult.riskScore;
      }
    }

    // Check limits
    if (policy.limits) {
      const limitResult = this.checkLimits(policy.limits, expenseReport, expenseItems, context);
      violations.push(...limitResult.violations);
      warnings.push(...limitResult.warnings);
    }

    return {
      violations,
      warnings,
      requiredApprovals,
      riskScore,
      overallCompliance: violations.length === 0,
      requiresManualReview: false
    };
  }

  /**
   * Evaluate policy conditions
   */
  private static evaluateConditions(
    conditions: PolicyCondition[],
    expenseReport: any,
    expenseItems: any[],
    context: PolicyEvaluationContext
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    // Group conditions
    const groups: { [key: string]: PolicyCondition[] } = {};
    conditions.forEach(condition => {
      const group = condition.group || 'default';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(condition);
    });

    // Evaluate each group (AND between groups, OR within groups based on logicalOperator)
    for (const group of Object.values(groups)) {
      let groupResult = false;
      
      for (const condition of group) {
        const conditionResult = this.evaluateCondition(condition, expenseReport, expenseItems, context);
        
        if (condition.logicalOperator === 'or') {
          groupResult = groupResult || conditionResult;
        } else {
          groupResult = groupResult && conditionResult;
        }
      }
      
      if (!groupResult) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(
    condition: PolicyCondition,
    expenseReport: any,
    expenseItems: any[],
    context: PolicyEvaluationContext
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, expenseReport, expenseItems, context);
    
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'nin':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      case 'startsWith':
        return typeof fieldValue === 'string' && fieldValue.startsWith(condition.value);
      case 'endsWith':
        return typeof fieldValue === 'string' && fieldValue.endsWith(condition.value);
      default:
        return false;
    }
  }

  /**
   * Get field value from expense report, items, or context
   */
  private static getFieldValue(
    field: string,
    expenseReport: any,
    expenseItems: any[],
    context: PolicyEvaluationContext
  ): any {
    // Handle nested field paths (e.g., 'items.amount', 'context.userRole')
    const parts = field.split('.');
    
    if (parts[0] === 'report') {
      return this.getNestedValue(expenseReport, parts.slice(1));
    } else if (parts[0] === 'items') {
      // For items, return array of values or aggregate
      if (parts[1] === 'count') {
        return expenseItems.length;
      } else if (parts[1] === 'totalAmount') {
        return expenseItems.reduce((sum, item) => sum + (item.amountLocal || 0), 0);
      } else {
        return expenseItems.map(item => this.getNestedValue(item, parts.slice(1)));
      }
    } else if (parts[0] === 'context') {
      return this.getNestedValue(context, parts.slice(1));
    } else {
      // Default to expense report
      return this.getNestedValue(expenseReport, parts);
    }
  }

  /**
   * Get nested value from object
   */
  private static getNestedValue(obj: any, parts: string[]): any {
    return parts.reduce((current, part) => current?.[part], obj);
  }

  /**
   * Execute policy action
   */
  private static executeAction(
    action: PolicyAction,
    policy: ExpensePolicy,
    expenseReport: any,
    expenseItems: any[],
    context: PolicyEvaluationContext
  ): PolicyEvaluationResult {
    const violations: PolicyViolation[] = [];
    const warnings: PolicyWarning[] = [];
    const requiredApprovals: ApprovalRequirement[] = [];
    let riskScore = 0;

    switch (action.type) {
      case 'block':
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          severity: 'critical',
          message: action.message || 'This expense violates company policy and cannot be submitted.',
          field: action.parameters?.field,
          value: action.parameters?.value
        });
        break;

      case 'warn':
        warnings.push({
          policyId: policy.id,
          policyName: policy.name,
          message: action.message || 'This expense may violate company policy.',
          field: action.parameters?.field,
          value: action.parameters?.value
        });
        break;

      case 'require_approval':
        requiredApprovals.push({
          level: action.parameters?.level || 'manager',
          reason: action.message || 'Additional approval required due to policy.',
          policyId: policy.id
        });
        break;

      case 'set_risk_score':
        riskScore = action.parameters?.score || 10;
        break;

      case 'require_document':
        // Implementation would add document requirement
        break;

      case 'notify':
        // Implementation would send notification
        break;
    }

    return {
      violations,
      warnings,
      requiredApprovals,
      riskScore,
      overallCompliance: violations.length === 0,
      requiresManualReview: false
    };
  }

  /**
   * Check policy limits
   */
  private static checkLimits(
    limits: PolicyLimits,
    expenseReport: any,
    expenseItems: any[],
    context: PolicyEvaluationContext
  ): { violations: PolicyViolation[]; warnings: PolicyWarning[] } {
    const violations: PolicyViolation[] = [];
    const warnings: PolicyWarning[] = [];

    // Check daily limits
    if (limits.dailyLimit) {
      const dailyTotal = this.calculateDailyTotal(expenseItems, limits.dailyLimit.category);
      if (dailyTotal > limits.dailyLimit.amount) {
        violations.push({
          policyId: 'daily-limit',
          policyName: 'Daily Expense Limit',
          severity: 'major',
          message: `Daily limit of ${limits.dailyLimit.amount} ${limits.dailyLimit.currency} exceeded (${dailyTotal})`,
          field: 'dailyAmount',
          value: dailyTotal
        });
      }
    }

    // Check monthly limits
    if (limits.monthlyLimit) {
      // This would require additional data about monthly totals
      // Implementation would check against historical data
    }

    // Check per-item limits
    if (limits.perItemLimit) {
      expenseItems.forEach((item, index) => {
        if (item.amountLocal > limits.perItemLimit!.amount) {
          violations.push({
            policyId: 'per-item-limit',
            policyName: 'Per Item Expense Limit',
            severity: 'major',
            message: `Item ${index + 1} exceeds limit of ${limits.perItemLimit!.amount} ${limits.perItemLimit!.currency}`,
            field: `items[${index}].amount`,
            value: item.amountLocal
          });
        }
      });
    }

    return { violations, warnings };
  }

  /**
   * Calculate daily total for specific category
   */
  private static calculateDailyTotal(expenseItems: any[], category?: string): number {
    const today = new Date().toISOString().split('T')[0];
    
    return expenseItems
      .filter(item => {
        const itemDate = new Date(item.expenseDate).toISOString().split('T')[0];
        const categoryMatch = !category || item.category === category;
        return itemDate === today && categoryMatch;
      })
      .reduce((sum, item) => sum + (item.amountLocal || 0), 0);
  }
}

export interface PolicyEvaluationContext {
  userId: string;
  userRole: string;
  departmentId: string;
  employeeId: string;
  submissionDate: Date;
  historicalData?: any;
}

export interface PolicyEvaluationResult {
  violations: PolicyViolation[];
  warnings: PolicyWarning[];
  requiredApprovals: ApprovalRequirement[];
  riskScore: number;
  overallCompliance: boolean;
  requiresManualReview: boolean;
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  severity: 'minor' | 'major' | 'critical';
  message: string;
  field?: string;
  value?: any;
}

export interface PolicyWarning {
  policyId: string;
  policyName: string;
  message: string;
  field?: string;
  value?: any;
}

export interface ApprovalRequirement {
  level: string;
  reason: string;
  policyId: string;
}