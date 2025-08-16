
import { AutomationRuleEntity } from '../entities/AutomationRule';

export interface IAutomationRuleRepository {
  findById(id: string, tenantId: string): Promise<AutomationRuleEntity | null>;
  findByTenant(tenantId: string, filters?: any): Promise<AutomationRuleEntity[]>;
  findActiveByTenant(tenantId: string): Promise<AutomationRuleEntity[]>;
  create(rule: AutomationRuleEntity): Promise<AutomationRuleEntity>;
  update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity>;
  delete(id: string, tenantId: string): Promise<boolean>;
  toggleStatus(id: string, tenantId: string, isActive: boolean): Promise<boolean>;
  updateExecutionStats(id: string, tenantId: string, success: boolean): Promise<boolean>;
  getStats(tenantId: string): Promise<{
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    totalExecutions: number;
  }>;
}
