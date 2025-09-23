import { v4 as uuidv4 } from 'uuid';
import { AutomationRule } from '../../domain/entities/AutomationRule';
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';

export interface CreateAutomationRuleDTO {
  name: string;
  description: string;
  priority: number;
  triggers: {
    type: 'new_message' | 'keyword' | 'time_based' | 'channel_specific' | 'priority_based' | 'sender_pattern' | 'content_pattern';
    conditions: any;
  }[];
  actions: {
    type: 'auto_reply' | 'forward_message' | 'create_ticket' | 'send_notification' | 'add_tags' | 'assign_agent' | 'escalate' | 'archive' | 'mark_priority' | 'webhook_call';
    parameters: any;
    order: number;
  }[];
  tags?: string[];
}

export class CreateAutomationRuleUseCase {
  constructor(private automationRuleRepository: IAutomationRuleRepository) {}

  async execute(data: any): Promise<AutomationRule> {
    console.log(`🔧 [CreateAutomationRuleUseCase] Creating automation rule for tenant: ${data.tenantId}`);

    // Validate rule data
    this.validateRuleData(data);

    const ruleId = uuidv4();
    const now = new Date();

    // Map triggers and actions to the format expected by AutomationRule
    let triggerType = 'message_received';
    let conditions: any[] = [];

    if (data.triggers && data.triggers.length > 0) {
      const firstTrigger = data.triggers[0];
      
      if (firstTrigger.type === 'keyword') {
        triggerType = 'keyword_match';
      } else if (firstTrigger.type === 'channel') {
        triggerType = 'channel_specific';
      } else if (firstTrigger.type) {
        triggerType = firstTrigger.type;
      }

      conditions = data.triggers.map(trigger => {
        const condition: any = {
          id: uuidv4(),
          type: trigger.type || 'keyword',
          operator: trigger.config?.operator || 'contains',
          field: trigger.config?.field || 'content',
          caseSensitive: trigger.config?.caseSensitive || false
        };

        // Enhanced keyword processing - handle both string and array
        if (trigger.type === 'keyword' && trigger.config) {
          let keywordValue = '';
          
          if (trigger.config.keywords) {
            // Handle both string and array formats
            if (Array.isArray(trigger.config.keywords)) {
              keywordValue = trigger.config.keywords.join(' ');
            } else {
              keywordValue = String(trigger.config.keywords);
            }
          } else if (trigger.config.value) {
            keywordValue = String(trigger.config.value);
          }
          
          condition.value = keywordValue;
          condition.keywords = keywordValue; // Preserve for backend compatibility
        } else {
          condition.value = trigger.config?.value || '';
        }

        return condition;
      });
    }

    const trigger = {
      type: triggerType,
      conditions
    };

    const actions = data.actions.map(action => ({
      id: uuidv4(),
      type: action.type === 'auto_reply' ? 'send_auto_reply' : action.type,
      params: action.config || {},
      priority: 1
    }));

    const automationRule = new AutomationRule(
      ruleId,
      data.tenantId,
      data.name,
      data.description || '',
      trigger,
      actions,
      data.enabled !== undefined ? data.enabled : true,
      data.priority || 1,
      false, // aiEnabled
      undefined, // aiPromptId
      0, // executionCount
      0, // successCount
      undefined, // lastExecuted
      now, // createdAt
      now  // updatedAt
    );

    const createdRule = await this.automationRuleRepository.create(automationRule);

    console.log(`✅ [CreateAutomationRuleUseCase] Created automation rule: ${createdRule.id}`);

    return createdRule;
  }

  private validateRuleData(data: any): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Rule name is required');
    }

    if (!data.triggers || data.triggers.length === 0) {
      throw new Error('At least one trigger is required');
    }

    if (!data.actions || data.actions.length === 0) {
      throw new Error('At least one action is required');
    }

    if (data.priority < 0 || data.priority > 10) {
      throw new Error('Priority must be between 0 and 10');
    }
  }
}