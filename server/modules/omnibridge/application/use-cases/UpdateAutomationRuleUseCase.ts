
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

    // Convert DTO to update data format
    const updateData: Partial<AutomationRule> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isEnabled !== undefined) updateData.enabled = data.isEnabled;
    if (data.priority !== undefined) updateData.priority = data.priority;
    
    // Handle triggers and actions conversion
    console.log(`🔍 [UpdateAutomationRuleUseCase] Received data.triggers:`, JSON.stringify(data.triggers, null, 2));
    
    if (data.triggers !== undefined) {
      const firstTrigger = data.triggers[0];
      let triggerType = 'message_received';
      
      if (firstTrigger?.type === 'keyword') {
        triggerType = 'keyword_match';
      } else if (firstTrigger?.type === 'channel') {
        triggerType = 'channel_specific';
      } else if (firstTrigger?.type) {
        triggerType = firstTrigger.type;
      }
      
      updateData.trigger = {
        type: triggerType,
        conditions: data.triggers.map(trigger => {
          const condition: any = {
            id: trigger.id || `condition-${Date.now()}`,
            type: trigger.type || 'keyword',
            operator: trigger.config?.operator || 'contains',
            field: trigger.config?.field || 'content',
            caseSensitive: trigger.config?.caseSensitive || false
          };
          
          // Handle different value types based on trigger type
          if (trigger.type === 'channel' && trigger.config?.channelType) {
            condition.value = trigger.config.channelType;
            condition.channelType = trigger.config.channelType;
            condition.type = 'channel';
          } else if (trigger.config?.value) {
            condition.value = trigger.config.value;
          } else if (trigger.config?.keywords) {
            condition.value = trigger.config.keywords;
          } else {
            condition.value = '';
          }
          
          // Ensure channelType is preserved for channel triggers
          if (trigger.config?.channelType) {
            condition.channelType = trigger.config.channelType;
          }
          
          return condition;
        })
      };
      console.log(`🔧 [UpdateAutomationRuleUseCase] Created updateData.trigger:`, JSON.stringify(updateData.trigger, null, 2));
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
  }
}
