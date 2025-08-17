import { ApprovalRule } from '../entities/ApprovalRule';
import { ApprovalInstance } from '../entities/ApprovalInstance';
import { ModuleType } from '../entities/ApprovalInstance';

export interface MatchResult {
  rule: ApprovalRule;
  shouldAutoApprove: boolean;
  matchedConditions: string[];
}

export class ApprovalRuleEngine {
  
  /**
   * Finds all applicable rules for a given entity
   */
  public findApplicableRules(
    rules: ApprovalRule[],
    entityType: ModuleType,
    entityData: Record<string, any>
  ): MatchResult[] {
    const applicableRules: MatchResult[] = [];
    
    // Filter rules by module type and active status
    const moduleRules = rules.filter(rule => 
      rule.moduleType === entityType && rule.isActive
    );

    // Sort by priority (lower number = higher priority)
    const sortedRules = moduleRules.sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (rule.matchesEntity(entityData)) {
        const shouldAutoApprove = rule.shouldAutoApprove(entityData);
        
        applicableRules.push({
          rule,
          shouldAutoApprove,
          matchedConditions: this.getMatchedConditions(rule, entityData)
        });
      }
    }

    return applicableRules;
  }

  /**
   * Gets the best matching rule (highest priority that matches)
   */
  public getBestMatch(
    rules: ApprovalRule[],
    entityType: ModuleType,
    entityData: Record<string, any>
  ): MatchResult | null {
    const applicableRules = this.findApplicableRules(rules, entityType, entityData);
    
    return applicableRules.length > 0 ? applicableRules[0] : null;
  }

  /**
   * Determines if an approval should be auto-approved
   */
  public shouldAutoApprove(
    rule: ApprovalRule,
    entityData: Record<string, any>
  ): boolean {
    return rule.shouldAutoApprove(entityData);
  }

  /**
   * Calculates SLA deadline for an approval instance
   */
  public calculateSlaDeadline(
    rule: ApprovalRule,
    startDate: Date = new Date()
  ): Date {
    return rule.calculateSlaDeadline(startDate);
  }

  /**
   * Validates if entity data contains required fields for rule evaluation
   */
  public validateEntityData(
    rule: ApprovalRule,
    entityData: Record<string, any>
  ): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    // Extract field names from rule conditions
    const requiredFields = this.extractRequiredFields(rule);
    
    for (const field of requiredFields) {
      if (!(field in entityData)) {
        missingFields.push(field);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Gets evaluation context for debugging
   */
  public getEvaluationContext(
    rule: ApprovalRule,
    entityData: Record<string, any>
  ): {
    ruleId: string;
    ruleName: string;
    entityData: Record<string, any>;
    conditions: any[];
    matches: boolean;
    autoApprove: boolean;
    slaDeadline: Date;
  } {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      entityData,
      conditions: rule.queryConditions.conditions,
      matches: rule.matchesEntity(entityData),
      autoApprove: rule.shouldAutoApprove(entityData),
      slaDeadline: rule.calculateSlaDeadline()
    };
  }

  /**
   * Extracts field names referenced in rule conditions
   */
  private extractRequiredFields(rule: ApprovalRule): string[] {
    const fields = new Set<string>();
    
    for (const condition of rule.queryConditions.conditions) {
      fields.add(condition.field);
    }

    return Array.from(fields);
  }

  /**
   * Gets the matched conditions for debugging purposes
   */
  private getMatchedConditions(
    rule: ApprovalRule,
    entityData: Record<string, any>
  ): string[] {
    const matchedConditions: string[] = [];
    
    for (const condition of rule.queryConditions.conditions) {
      const fieldValue = entityData[condition.field];
      const conditionString = `${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`;
      
      if (this.evaluateCondition(condition, entityData)) {
        matchedConditions.push(`✓ ${conditionString} (${JSON.stringify(fieldValue)})`);
      } else {
        matchedConditions.push(`✗ ${conditionString} (${JSON.stringify(fieldValue)})`);
      }
    }

    return matchedConditions;
  }

  /**
   * Evaluates a single condition - duplicated from ApprovalRule for engine-level access
   */
  private evaluateCondition(condition: any, entityData: Record<string, any>): boolean {
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
}