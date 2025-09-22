
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRule } from '../../domain/entities/AutomationRule';

export interface UpdateAutomationRuleDTO {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  priority?: number;
  triggers?: any[];
  actions?: any[];
  tags?: string[];
}

export class UpdateAutomationRuleUseCase {
  constructor(private automationRuleRepository: IAutomationRuleRepository) {}

  async execute(ruleId: string, tenantId: string, userId: string, data: UpdateAutomationRuleDTO): Promise<AutomationRule> {
    console.log(`🔧 [UpdateAutomationRuleUseCase] Updating automation rule: ${ruleId}`);

    const existingRule = await this.automationRuleRepository.findById(ruleId, tenantId);
    if (!existingRule) {
      throw new Error('Automation rule not found');
    }

    const updatedRule: AutomationRule = {
      ...existingRule,
      ...data,
      updatedAt: new Date()
    };

    const result = await this.automationRuleRepository.update(updatedRule);

    console.log(`✅ [UpdateAutomationRuleUseCase] Updated automation rule: ${ruleId}`);

    return result;
  }
}
