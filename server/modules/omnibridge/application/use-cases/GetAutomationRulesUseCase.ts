
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRule } from '../../domain/entities/AutomationRule';

export class GetAutomationRulesUseCase {
  constructor(private automationRuleRepository: IAutomationRuleRepository) {}

  async execute(tenantId: string, filters?: {
    isEnabled?: boolean;
    priority?: number;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{
    rules: AutomationRule[];
    total: number;
    stats: {
      totalRules: number;
      enabledRules: number;
      disabledRules: number;
      totalExecutions: number;
    };
  }> {
    console.log(`🔍 [GetAutomationRulesUseCase] Getting automation rules for tenant: ${tenantId}`);

    const rules = await this.automationRuleRepository.findByTenantId(tenantId);
    const stats = await this.automationRuleRepository.getStats(tenantId);

    console.log(`✅ [GetAutomationRulesUseCase] Retrieved ${rules.length} automation rules`);

    return {
      rules,
      total: rules.length,
      stats
    };
  }
}
