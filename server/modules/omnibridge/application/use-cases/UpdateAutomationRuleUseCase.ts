
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
    try {
      console.log(`🔧 [UpdateAutomationRuleUseCase] Updating automation rule: ${ruleId}`);

      const existingRule = await this.automationRuleRepository.findById(ruleId, tenantId);
      if (!existingRule) {
        throw new Error('Automation rule not found');
      }

      // Convert DTO to update data format
      const updateData: Partial<AutomationRule> = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isEnabled !== undefined) updateData.enabled = data.isEnabled;
      if (data.priority !== undefined) updateData.priority = data.priority;
      
      // Handle triggers and actions conversion
      if (data.triggers !== undefined) {
        updateData.trigger = {
          type: data.triggers[0]?.type === 'keyword' ? 'keyword_match' : 'message_received',
          conditions: data.triggers.map(trigger => ({
            id: trigger.id || `condition-${Date.now()}`,
            type: trigger.type || 'keyword',
            operator: trigger.config?.operator || 'contains',
            value: trigger.config?.value || trigger.config?.keywords || '',
            field: trigger.config?.field || 'content',
            caseSensitive: trigger.config?.caseSensitive || false
          }))
        };
      }
      
      if (data.actions !== undefined) {
        updateData.actions = data.actions.map(action => ({
          id: action.id || `action-${Date.now()}`,
          type: action.type === 'auto_reply' ? 'send_auto_reply' : action.type,
          params: action.config || {},
          priority: 1
        }));
      }

      const result = await this.automationRuleRepository.update(ruleId, tenantId, updateData);

      console.log(`✅ [UpdateAutomationRuleUseCase] Updated automation rule: ${ruleId}`);

      return result;
    } catch (error) {
      console.error(`❌ [UpdateAutomationRuleUseCase] Error updating rule ${ruleId}:`, error);
      throw error;
    }
  }
}
