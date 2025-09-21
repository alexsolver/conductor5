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
    const trigger = {
      type: data.triggers[0]?.type === 'keyword' ? 'keyword_match' : 'message_received',
      conditions: data.triggers[0]?.config ? [{
        id: uuidv4(),
        type: 'keyword',
        operator: 'contains',
        value: data.triggers[0].config.keywords?.join(' ') || ''
      }] : []
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