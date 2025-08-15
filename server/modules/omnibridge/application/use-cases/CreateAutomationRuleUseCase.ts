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

  async execute(tenantId: string, userId: string, data: CreateAutomationRuleDTO): Promise<AutomationRule> {
    console.log(`🔧 [CreateAutomationRuleUseCase] Creating automation rule for tenant: ${tenantId}`);

    // Validate rule data
    this.validateRuleData(data);

    const ruleId = uuidv4();
    const now = new Date();

    const automationRule: AutomationRule = {
      id: ruleId,
      tenantId,
      name: data.name,
      description: data.description,
      isEnabled: true,
      priority: data.priority,
      triggers: data.triggers.map(trigger => ({
        id: uuidv4(),
        ruleId,
        type: trigger.type,
        conditions: trigger.conditions,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })),
      actions: data.actions.map(action => ({
        id: uuidv4(),
        ruleId,
        type: action.type,
        parameters: action.parameters,
        order: action.order,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })),
      executionStats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0
      },
      metadata: {
        createdBy: userId,
        version: 1,
        tags: data.tags || []
      },
      createdAt: now,
      updatedAt: now
    };

    const createdRule = await this.automationRuleRepository.create(automationRule);

    console.log(`✅ [CreateAutomationRuleUseCase] Created automation rule: ${createdRule.id}`);

    return createdRule;
  }

  private validateRuleData(data: CreateAutomationRuleDTO): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Rule name is required');
    }

    if (!data.triggers || data.triggers.length === 0) {
      throw new Error('At least one trigger is required');
    }

    if (!data.actions || data.actions.length === 0) {
      throw new Error('At least one action is required');
    }

    if (data.priority < 1 || data.priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }
  }
}