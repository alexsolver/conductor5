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

  async execute(data: any): Promise<AutomationRuleEntity> {
    console.log(`🔧 [CreateAutomationRuleUseCase] Creating automation rule for tenant: ${data.tenantId}`);

    // Validate rule data
    this.validateRuleData(data);

    const ruleId = uuidv4();
    const now = new Date();

    // Map triggers and actions to the format expected by AutomationRuleEntity
    const conditions = data.triggers.map(trigger => ({
      type: trigger.type,
      operator: 'equals',
      value: JSON.stringify(trigger.conditions)
    }));

    const actions = data.actions.map(action => ({
      type: action.type,
      config: action.parameters
    }));

    const automationRule = new AutomationRuleEntity(
      ruleId,
      data.name,
      conditions,
      actions,
      data.tenantId,
      data.description,
      true, // isActive
      data.priority,
      0, // executionCount
      0, // successCount
      null, // lastExecuted
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