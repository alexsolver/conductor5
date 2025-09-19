
import { AutomationRule } from '../entities/AutomationRule';

export interface IAutomationRuleRepository {
  findById(id: string, tenantId: string): Promise<AutomationRule | null>;
  findByTenantId(tenantId: string, filters?: any): Promise<AutomationRule[]>;
  findActiveByTenant(tenantId: string): Promise<AutomationRule[]>;
  create(rule: AutomationRule): Promise<AutomationRule>;
  update(rule: AutomationRule): Promise<AutomationRule>;
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
