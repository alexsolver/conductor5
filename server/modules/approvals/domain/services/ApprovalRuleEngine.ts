// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN SERVICE
// Domain Service: ApprovalRuleEngine - Business logic for rule evaluation and matching

import { ApprovalRule } from '../entities/ApprovalRule';
import { ApprovalInstance } from '../entities/ApprovalInstance';
import { IApprovalRuleRepository } from '../repositories/IApprovalRuleRepository';

export interface RuleEvaluationResult {
  rule: ApprovalRule;
  matches: boolean;
  autoApprovalEligible: boolean;
  evaluationDetails: {
    conditionResults: Array<{
      field: string;
      operator: string;
      value: any;
      actualValue: any;
      result: boolean;
    }>;
    autoApprovalResults?: Array<{
      field: string;
      operator: string;
      value: any;
      actualValue: any;
      result: boolean;
    }>;
  };
}

export interface ApprovalWorkflowPlan {
  rule: ApprovalRule;
  autoApprove: boolean;
  estimatedSlaHours: number;
  steps: Array<{
    stepIndex: number;
    stepName: string;
    approvers: Array<{
      type: string;
      id?: string;
      name: string;
    }>;
    decisionMode: string;
    slaHours: number;
  }>;
}

export class ApprovalRuleEngine {
  constructor(
    private readonly approvalRuleRepository: IApprovalRuleRepository
  ) {}

  // Primary rule evaluation method
  async evaluateRulesForEntity(
    tenantId: string,
    moduleType: string,
    entityType: string,
    entityData: Record<string, any>
  ): Promise<RuleEvaluationResult[]> {
    // Get all applicable rules for the entity type
    const rules = await this.approvalRuleRepository.findByModule(tenantId, moduleType, entityType);
    
    // Sort by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);
    
    const evaluationResults: RuleEvaluationResult[] = [];
    
    for (const rule of sortedRules) {
      if (!rule.isActive) continue;
      
      const result = this.evaluateRule(rule, entityData);
      evaluationResults.push(result);
    }
    
    return evaluationResults;
  }

  // Evaluate a single rule against entity data
  evaluateRule(rule: ApprovalRule, entityData: Record<string, any>): RuleEvaluationResult {
    const conditionResults = rule.queryConditions.map(condition => ({
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
      actualValue: this.getNestedValue(entityData, condition.field),
      result: this.evaluateCondition(condition, entityData),
    }));
    
    const matches = rule.evaluateConditions(entityData);
    
    let autoApprovalEligible = false;
    let autoApprovalResults: any[] = [];
    
    if (matches && rule.autoApprovalEnabled && rule.autoApprovalConditions) {
      autoApprovalResults = rule.autoApprovalConditions.map(condition => ({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        actualValue: this.getNestedValue(entityData, condition.field),
        result: this.evaluateCondition(condition, entityData),
      }));
      
      autoApprovalEligible = rule.shouldAutoApprove(entityData);
    }
    
    return {
      rule,
      matches,
      autoApprovalEligible,
      evaluationDetails: {
        conditionResults,
        autoApprovalResults: autoApprovalResults.length > 0 ? autoApprovalResults : undefined,
      },
    };
  }

  // Find the best matching rule for an entity
  async findBestMatchingRule(
    tenantId: string,
    moduleType: string,
    entityType: string,
    entityData: Record<string, any>
  ): Promise<ApprovalRule | null> {
    const evaluationResults = await this.evaluateRulesForEntity(
      tenantId,
      moduleType,
      entityType,
      entityData
    );
    
    // Find the first (highest priority) matching rule
    const matchingResult = evaluationResults.find(result => result.matches);
    
    return matchingResult?.rule || null;
  }

  // Create approval workflow plan
  async createWorkflowPlan(
    tenantId: string,
    moduleType: string,
    entityType: string,
    entityData: Record<string, any>
  ): Promise<ApprovalWorkflowPlan | null> {
    const rule = await this.findBestMatchingRule(tenantId, moduleType, entityType, entityData);
    
    if (!rule) {
      return null;
    }
    
    const evaluationResult = this.evaluateRule(rule, entityData);
    
    return {
      rule,
      autoApprove: evaluationResult.autoApprovalEligible,
      estimatedSlaHours: rule.defaultSlaHours,
      steps: rule.approvalSteps.map(step => ({
        stepIndex: step.stepIndex,
        stepName: step.stepName,
        approvers: step.approvers.map(approver => ({
          type: approver.type,
          id: approver.id,
          name: approver.name,
        })),
        decisionMode: step.decisionMode,
        slaHours: step.slaHours,
      })),
    };
  }

  // Check if entity requires approval
  async requiresApproval(
    tenantId: string,
    moduleType: string,
    entityType: string,
    entityData: Record<string, any>
  ): Promise<boolean> {
    const rule = await this.findBestMatchingRule(tenantId, moduleType, entityType, entityData);
    return rule !== null;
  }

  // Check if entity qualifies for auto-approval
  async qualifiesForAutoApproval(
    tenantId: string,
    moduleType: string,
    entityType: string,
    entityData: Record<string, any>
  ): Promise<boolean> {
    const rule = await this.findBestMatchingRule(tenantId, moduleType, entityType, entityData);
    
    if (!rule) {
      return false;
    }
    
    return rule.shouldAutoApprove(entityData);
  }

  // Validate rule logic and conflicts
  async validateRule(rule: ApprovalRule): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    conflicts: ApprovalRule[];
  }> {
    const errors = rule.validate();
    const warnings: string[] = [];
    
    // Check for conflicting rules
    const conflicts = await this.approvalRuleRepository.findConflictingRules(rule);
    
    // Add warnings for potential issues
    if (rule.autoApprovalEnabled && (!rule.autoApprovalConditions || rule.autoApprovalConditions.length === 0)) {
      warnings.push('Auto-approval is enabled but no auto-approval conditions are defined');
    }
    
    if (rule.approvalSteps.length > 5) {
      warnings.push('Rule has many approval steps which may slow down the process');
    }
    
    if (rule.defaultSlaHours > 168) { // 1 week
      warnings.push('Default SLA is very long (over 1 week)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      conflicts,
    };
  }

  // Test rule against sample data
  testRule(rule: ApprovalRule, testData: Record<string, any>[]): {
    testData: Record<string, any>;
    matches: boolean;
    autoApprovalEligible: boolean;
    stepCount: number;
    estimatedSlaHours: number;
  }[] {
    return testData.map(data => {
      const result = this.evaluateRule(rule, data);
      
      return {
        testData: data,
        matches: result.matches,
        autoApprovalEligible: result.autoApprovalEligible,
        stepCount: rule.approvalSteps.length,
        estimatedSlaHours: rule.defaultSlaHours,
      };
    });
  }

  // Private helper methods
  private evaluateCondition(condition: any, entityData: Record<string, any>): boolean {
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
}