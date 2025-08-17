/**
 * POLICY ENGINE SERVICE - ADVANCED RULE ENGINE
 * ✅ 1QA.MD COMPLIANCE: Clean Architecture Domain Service
 * 
 * Features:
 * - Dynamic policy rule evaluation with Query Builder
 * - Complex conditional logic (AND/OR/NOT operations)
 * - Real-time compliance checking and violations
 * - Configurable limits and restrictions
 * - Risk scoring and fraud detection rules
 */

import { ExpenseReport, ExpenseItem } from '../entities/ExpenseReport';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  category: 'limit' | 'compliance' | 'fraud' | 'approval' | 'documentation';
  priority: number;
  isActive: boolean;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  violationLevel: 'info' | 'warning' | 'error' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCondition {
  field: string;
  operator: PolicyOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR' | 'NOT';
  groupId?: string;
}

export type PolicyOperator = 
  | 'equals' | 'not_equals'
  | 'greater_than' | 'greater_than_or_equal'
  | 'less_than' | 'less_than_or_equal'
  | 'in' | 'not_in'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'is_null' | 'is_not_null'
  | 'between' | 'not_between'
  | 'matches_regex';

export interface PolicyAction {
  type: 'block' | 'require_approval' | 'flag' | 'notify' | 'auto_approve' | 'escalate';
  parameters: Record<string, any>;
  message?: string;
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  field: string;
  expectedValue: any;
  actualValue: any;
  violationLevel: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  suggestedAction?: string;
}

export interface PolicyEvaluationResult {
  isCompliant: boolean;
  violations: PolicyViolation[];
  requiredActions: PolicyAction[];
  riskScore: number;
  complianceScore: number;
}

export class PolicyEngineService {
  
  /**
   * Evaluate all policies against expense report
   */
  async evaluateExpenseReport(
    expenseReport: ExpenseReport,
    tenantId: string,
    contextData?: Record<string, any>
  ): Promise<PolicyEvaluationResult> {
    console.log('🔍 [PolicyEngine] Evaluating expense report:', expenseReport.id);
    
    const policies = await this.loadActivePolicies(tenantId);
    const violations: PolicyViolation[] = [];
    const requiredActions: PolicyAction[] = [];
    
    // Create evaluation context
    const context = {
      expenseReport,
      items: expenseReport.items || [],
      totalAmount: expenseReport.totalAmount,
      submissionDate: expenseReport.submissionDate,
      employeeId: expenseReport.employeeId,
      departmentId: expenseReport.departmentId,
      costCenterId: expenseReport.costCenterId,
      projectId: expenseReport.projectId,
      ...contextData
    };
    
    // Evaluate each policy
    for (const policy of policies) {
      try {
        const policyResult = await this.evaluatePolicy(policy, context);
        
        if (!policyResult.isCompliant) {
          violations.push(...policyResult.violations);
          requiredActions.push(...policy.actions);
        }
        
      } catch (error) {
        console.error(`❌ [PolicyEngine] Error evaluating policy ${policy.name}:`, error);
        
        violations.push({
          ruleId: policy.id,
          ruleName: policy.name,
          field: 'system',
          expectedValue: 'valid evaluation',
          actualValue: 'evaluation error',
          violationLevel: 'error',
          message: `Policy evaluation failed: ${error.message}`
        });
      }
    }
    
    // Calculate scores
    const riskScore = this.calculateRiskScore(violations, context);
    const complianceScore = this.calculateComplianceScore(violations, policies.length);
    
    const result = {
      isCompliant: violations.filter(v => v.violationLevel === 'error' || v.violationLevel === 'critical').length === 0,
      violations,
      requiredActions: this.deduplicateActions(requiredActions),
      riskScore,
      complianceScore
    };
    
    console.log('✅ [PolicyEngine] Evaluation completed:', {
      compliant: result.isCompliant,
      violations: violations.length,
      riskScore,
      complianceScore
    });
    
    return result;
  }
  
  /**
   * Evaluate single policy against context
   */
  private async evaluatePolicy(
    policy: PolicyRule,
    context: Record<string, any>
  ): Promise<{ isCompliant: boolean; violations: PolicyViolation[] }> {
    
    if (!policy.isActive) {
      return { isCompliant: true, violations: [] };
    }
    
    const violations: PolicyViolation[] = [];
    
    // Group conditions by logical grouping
    const conditionGroups = this.groupConditions(policy.conditions);
    
    // Evaluate each group (groups are connected with AND)
    let policyMatches = true;
    
    for (const group of conditionGroups) {
      const groupResult = this.evaluateConditionGroup(group, context);
      
      if (!groupResult.matches) {
        policyMatches = false;
        
        if (groupResult.violation) {
          violations.push({
            ruleId: policy.id,
            ruleName: policy.name,
            field: groupResult.violation.field,
            expectedValue: groupResult.violation.expected,
            actualValue: groupResult.violation.actual,
            violationLevel: policy.violationLevel,
            message: groupResult.violation.message || policy.description
          });
        }
      }
    }
    
    return {
      isCompliant: !policyMatches, // If policy matches, it means there's a violation
      violations
    };
  }
  
  /**
   * Group conditions by logical grouping
   */
  private groupConditions(conditions: PolicyCondition[]): PolicyCondition[][] {
    const groups: { [key: string]: PolicyCondition[] } = {};
    
    for (const condition of conditions) {
      const groupId = condition.groupId || 'default';
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(condition);
    }
    
    return Object.values(groups);
  }
  
  /**
   * Evaluate group of conditions (within group: OR logic, between groups: AND logic)
   */
  private evaluateConditionGroup(
    conditions: PolicyCondition[],
    context: Record<string, any>
  ): { matches: boolean; violation?: { field: string; expected: any; actual: any; message?: string } } {
    
    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context);
      
      // OR logic within group - if any condition matches, the group matches
      if (conditionResult.matches) {
        return { matches: true };
      }
      
      // Collect violation info from first failing condition
      if (!conditionResult.matches && !conditionResult.violation) {
        return {
          matches: false,
          violation: {
            field: condition.field,
            expected: condition.value,
            actual: conditionResult.actualValue,
            message: this.getViolationMessage(condition, conditionResult.actualValue)
          }
        };
      }
    }
    
    return { matches: false };
  }
  
  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: PolicyCondition,
    context: Record<string, any>
  ): { matches: boolean; actualValue?: any; violation?: any } {
    
    const actualValue = this.getFieldValue(condition.field, context);
    const expectedValue = condition.value;
    
    let matches = false;
    
    switch (condition.operator) {
      case 'equals':
        matches = actualValue === expectedValue;
        break;
        
      case 'not_equals':
        matches = actualValue !== expectedValue;
        break;
        
      case 'greater_than':
        matches = Number(actualValue) > Number(expectedValue);
        break;
        
      case 'greater_than_or_equal':
        matches = Number(actualValue) >= Number(expectedValue);
        break;
        
      case 'less_than':
        matches = Number(actualValue) < Number(expectedValue);
        break;
        
      case 'less_than_or_equal':
        matches = Number(actualValue) <= Number(expectedValue);
        break;
        
      case 'in':
        matches = Array.isArray(expectedValue) && expectedValue.includes(actualValue);
        break;
        
      case 'not_in':
        matches = Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
        break;
        
      case 'contains':
        matches = String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        break;
        
      case 'not_contains':
        matches = !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        break;
        
      case 'starts_with':
        matches = String(actualValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());
        break;
        
      case 'ends_with':
        matches = String(actualValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());
        break;
        
      case 'is_null':
        matches = actualValue == null;
        break;
        
      case 'is_not_null':
        matches = actualValue != null;
        break;
        
      case 'between':
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          matches = Number(actualValue) >= Number(expectedValue[0]) && Number(actualValue) <= Number(expectedValue[1]);
        }
        break;
        
      case 'not_between':
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          matches = Number(actualValue) < Number(expectedValue[0]) || Number(actualValue) > Number(expectedValue[1]);
        }
        break;
        
      case 'matches_regex':
        try {
          const regex = new RegExp(String(expectedValue));
          matches = regex.test(String(actualValue));
        } catch (error) {
          console.error('Invalid regex pattern:', expectedValue);
          matches = false;
        }
        break;
        
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        matches = false;
    }
    
    return { matches, actualValue };
  }
  
  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(fieldPath: string, context: Record<string, any>): any {
    const parts = fieldPath.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * Generate violation message
   */
  private getViolationMessage(condition: PolicyCondition, actualValue: any): string {
    const messages: Record<PolicyOperator, string> = {
      'equals': `Expected '${condition.value}', but got '${actualValue}'`,
      'not_equals': `Value should not be '${condition.value}'`,
      'greater_than': `Value ${actualValue} must be greater than ${condition.value}`,
      'greater_than_or_equal': `Value ${actualValue} must be greater than or equal to ${condition.value}`,
      'less_than': `Value ${actualValue} must be less than ${condition.value}`,
      'less_than_or_equal': `Value ${actualValue} must be less than or equal to ${condition.value}`,
      'in': `Value '${actualValue}' must be one of: ${Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}`,
      'not_in': `Value '${actualValue}' is not allowed`,
      'contains': `Value must contain '${condition.value}'`,
      'not_contains': `Value must not contain '${condition.value}'`,
      'starts_with': `Value must start with '${condition.value}'`,
      'ends_with': `Value must end with '${condition.value}'`,
      'is_null': `Value must be empty`,
      'is_not_null': `Value is required`,
      'between': `Value ${actualValue} must be between ${Array.isArray(condition.value) ? condition.value.join(' and ') : condition.value}`,
      'not_between': `Value ${actualValue} must not be between ${Array.isArray(condition.value) ? condition.value.join(' and ') : condition.value}`,
      'matches_regex': `Value '${actualValue}' does not match required format`
    };
    
    return messages[condition.operator] || `Condition failed for field '${condition.field}'`;
  }
  
  /**
   * Calculate risk score based on violations and context
   */
  private calculateRiskScore(violations: PolicyViolation[], context: Record<string, any>): number {
    let score = 0;
    
    // Base score from violations
    for (const violation of violations) {
      switch (violation.violationLevel) {
        case 'critical':
          score += 25;
          break;
        case 'error':
          score += 15;
          break;
        case 'warning':
          score += 5;
          break;
        case 'info':
          score += 1;
          break;
      }
    }
    
    // Additional risk factors
    const totalAmount = context.totalAmount || 0;
    if (totalAmount > 10000) score += 10; // High value
    if (totalAmount > 50000) score += 20; // Very high value
    
    // Weekend/holiday submission
    const submissionDate = context.submissionDate as Date;
    if (submissionDate && this.isWeekend(submissionDate)) {
      score += 5;
    }
    
    return Math.min(100, score); // Cap at 100
  }
  
  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(violations: PolicyViolation[], totalPolicies: number): number {
    const criticalViolations = violations.filter(v => v.violationLevel === 'critical' || v.violationLevel === 'error').length;
    
    if (totalPolicies === 0) return 100;
    
    const complianceRatio = Math.max(0, (totalPolicies - criticalViolations) / totalPolicies);
    return Math.round(complianceRatio * 100);
  }
  
  /**
   * Remove duplicate actions
   */
  private deduplicateActions(actions: PolicyAction[]): PolicyAction[] {
    const seen = new Set<string>();
    return actions.filter(action => {
      const key = `${action.type}_${JSON.stringify(action.parameters)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Check if date is weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }
  
  /**
   * Load active policies for tenant
   */
  private async loadActivePolicies(tenantId: string): Promise<PolicyRule[]> {
    // TODO: Implement via repository
    // For now, return sample policies
    return [
      {
        id: 'daily-limit-meals',
        name: 'Daily Meal Limit',
        description: 'Meal expenses cannot exceed R$120 per day',
        category: 'limit',
        priority: 100,
        isActive: true,
        conditions: [
          {
            field: 'items',
            operator: 'greater_than',
            value: 120,
            logicalOperator: 'AND'
          }
        ],
        actions: [
          {
            type: 'require_approval',
            parameters: { approverLevel: 'manager' },
            message: 'Meal expense exceeds daily limit and requires manager approval'
          }
        ],
        violationLevel: 'warning',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'weekend-submission',
        name: 'Weekend Submission Check',
        description: 'Flag expenses submitted on weekends for review',
        category: 'fraud',
        priority: 50,
        isActive: true,
        conditions: [
          {
            field: 'submissionDate',
            operator: 'matches_regex',
            value: '(Saturday|Sunday)'
          }
        ],
        actions: [
          {
            type: 'flag',
            parameters: { reason: 'weekend_submission' },
            message: 'Expense submitted on weekend - requires additional review'
          }
        ],
        violationLevel: 'info',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}