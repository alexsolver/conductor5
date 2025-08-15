
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';

export class DeleteAutomationRuleUseCase {
  constructor(private automationRuleRepository: IAutomationRuleRepository) {}

  async execute(ruleId: string, tenantId: string): Promise<boolean> {
    console.log(`🗑️ [DeleteAutomationRuleUseCase] Deleting automation rule: ${ruleId}`);

    const existingRule = await this.automationRuleRepository.findById(ruleId, tenantId);
    if (!existingRule) {
      throw new Error('Automation rule not found');
    }

    const result = await this.automationRuleRepository.delete(ruleId, tenantId);

    console.log(`✅ [DeleteAutomationRuleUseCase] Deleted automation rule: ${ruleId}`);

    return result;
  }
}
