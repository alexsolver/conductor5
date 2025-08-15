
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { AutomationRule, AutomationExecution } from '../../domain/entities/AutomationRule';
import { Message } from '../../domain/entities/Message';
import { v4 as uuidv4 } from 'uuid';

export class ExecuteAutomationRuleUseCase {
  constructor(
    private automationRuleRepository: IAutomationRuleRepository,
    private messageRepository: IMessageRepository
  ) {}

  async execute(message: Message, tenantId: string): Promise<AutomationExecution[]> {
    console.log(`🤖 [ExecuteAutomationRuleUseCase] Processing message: ${message.id} for tenant: ${tenantId}`);

    const activeRules = await this.automationRuleRepository.findActiveRules(tenantId);
    const executions: AutomationExecution[] = [];

    for (const rule of activeRules) {
      if (await this.shouldExecuteRule(rule, message)) {
        const execution = await this.executeRule(rule, message);
        executions.push(execution);
      }
    }

    console.log(`✅ [ExecuteAutomationRuleUseCase] Executed ${executions.length} automation rules`);

    return executions;
  }

  private async shouldExecuteRule(rule: AutomationRule, message: Message): Promise<boolean> {
    for (const trigger of rule.triggers) {
      if (!trigger.isActive) continue;

      switch (trigger.type) {
        case 'new_message':
          return true;

        case 'keyword':
          if (trigger.conditions.keywords) {
            const keywords = trigger.conditions.keywords as string[];
            const messageContent = message.content.toLowerCase();
            return keywords.some(keyword => messageContent.includes(keyword.toLowerCase()));
          }
          break;

        case 'channel_specific':
          if (trigger.conditions.channels) {
            const channels = trigger.conditions.channels as string[];
            return channels.includes(message.channelId);
          }
          break;

        case 'priority_based':
          if (trigger.conditions.priority) {
            const priorities = trigger.conditions.priority as string[];
            return priorities.includes(message.priority);
          }
          break;

        case 'sender_pattern':
          if (trigger.conditions.senderPattern) {
            const pattern = new RegExp(trigger.conditions.senderPattern as string, 'i');
            return pattern.test(message.from);
          }
          break;

        case 'content_pattern':
          if (trigger.conditions.contentPattern) {
            const pattern = new RegExp(trigger.conditions.contentPattern as string, 'i');
            return pattern.test(message.content);
          }
          break;

        case 'time_based':
          if (trigger.conditions.timeRange) {
            const now = new Date();
            const currentTime = now.getHours() * 100 + now.getMinutes();
            const start = this.parseTime(trigger.conditions.timeRange.start);
            const end = this.parseTime(trigger.conditions.timeRange.end);
            return currentTime >= start && currentTime <= end;
          }
          break;
      }
    }

    return false;
  }

  private async executeRule(rule: AutomationRule, message: Message): Promise<AutomationExecution> {
    const executionId = uuidv4();
    const startTime = Date.now();

    const execution: AutomationExecution = {
      id: executionId,
      ruleId: rule.id,
      messageId: message.id,
      triggeredAt: new Date(),
      status: 'executing',
      executedActions: []
    };

    try {
      // Sort actions by order
      const sortedActions = rule.actions.sort((a, b) => a.order - b.order);

      for (const action of sortedActions) {
        if (!action.isActive) continue;

        try {
          const result = await this.executeAction(action, message, rule.tenantId);
          execution.executedActions.push({
            actionId: action.id,
            status: 'success',
            result
          });
        } catch (error) {
          console.error(`❌ [ExecuteAutomationRuleUseCase] Action failed: ${action.id}`, error);
          execution.executedActions.push({
            actionId: action.id,
            status: 'failed',
            error: error.message
          });
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.executionTime = Date.now() - startTime;

      // Update rule statistics
      await this.updateRuleStats(rule, true, execution.executionTime);

    } catch (error) {
      console.error(`❌ [ExecuteAutomationRuleUseCase] Rule execution failed: ${rule.id}`, error);
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      execution.executionTime = Date.now() - startTime;

      await this.updateRuleStats(rule, false, execution.executionTime);
    }

    return execution;
  }

  private async executeAction(action: any, message: Message, tenantId: string): Promise<any> {
    switch (action.type) {
      case 'auto_reply':
        return await this.executeAutoReply(action, message);

      case 'forward_message':
        return await this.executeForwardMessage(action, message);

      case 'create_ticket':
        return await this.executeCreateTicket(action, message, tenantId);

      case 'send_notification':
        return await this.executeSendNotification(action, message, tenantId);

      case 'add_tags':
        return await this.executeAddTags(action, message);

      case 'assign_agent':
        return await this.executeAssignAgent(action, message);

      case 'mark_priority':
        return await this.executeMarkPriority(action, message);

      case 'archive':
        return await this.executeArchive(action, message);

      case 'webhook_call':
        return await this.executeWebhookCall(action, message);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeAutoReply(action: any, message: Message): Promise<any> {
    console.log(`📤 [AutoReply] Sending auto reply for message: ${message.id}`);
    
    // Simulate delay if specified
    if (action.parameters.replyDelay) {
      await new Promise(resolve => setTimeout(resolve, action.parameters.replyDelay * 1000));
    }

    // Here you would integrate with actual messaging service
    return {
      type: 'auto_reply',
      recipient: message.from,
      content: action.parameters.replyTemplate,
      sentAt: new Date()
    };
  }

  private async executeForwardMessage(action: any, message: Message): Promise<any> {
    console.log(`⏩ [ForwardMessage] Forwarding message: ${message.id}`);
    
    return {
      type: 'forward_message',
      recipients: action.parameters.forwardTo,
      originalMessage: message.content,
      note: action.parameters.forwardWithNote,
      forwardedAt: new Date()
    };
  }

  private async executeCreateTicket(action: any, message: Message, tenantId: string): Promise<any> {
    console.log(`🎫 [CreateTicket] Creating ticket for message: ${message.id}`);
    
    // Here you would integrate with ticket creation service
    return {
      type: 'create_ticket',
      ticketId: uuidv4(),
      title: `Auto-generated from message: ${message.id}`,
      description: message.content,
      priority: action.parameters.ticketPriority,
      category: action.parameters.ticketCategory,
      assignedTo: action.parameters.assignToAgent,
      createdAt: new Date()
    };
  }

  private async executeSendNotification(action: any, message: Message, tenantId: string): Promise<any> {
    console.log(`🔔 [SendNotification] Sending notification for message: ${message.id}`);
    
    return {
      type: 'send_notification',
      recipients: action.parameters.notifyUsers,
      message: action.parameters.notificationMessage,
      channel: action.parameters.notificationChannel,
      sentAt: new Date()
    };
  }

  private async executeAddTags(action: any, message: Message): Promise<any> {
    console.log(`🏷️ [AddTags] Adding tags to message: ${message.id}`);
    
    const currentTags = message.tags || [];
    const newTags = [...currentTags, ...(action.parameters.tagsToAdd || [])];
    const finalTags = action.parameters.tagsToRemove 
      ? newTags.filter(tag => !action.parameters.tagsToRemove.includes(tag))
      : newTags;

    // Update message tags in repository
    await this.messageRepository.updateTags(message.id, message.tenantId, finalTags);
    
    return {
      type: 'add_tags',
      previousTags: currentTags,
      newTags: finalTags,
      updatedAt: new Date()
    };
  }

  private async executeAssignAgent(action: any, message: Message): Promise<any> {
    console.log(`👤 [AssignAgent] Assigning agent to message: ${message.id}`);
    
    return {
      type: 'assign_agent',
      agentId: action.parameters.agentId,
      teamId: action.parameters.teamId,
      assignedAt: new Date()
    };
  }

  private async executeMarkPriority(action: any, message: Message): Promise<any> {
    console.log(`⚡ [MarkPriority] Updating priority for message: ${message.id}`);
    
    // Update message priority in repository
    await this.messageRepository.updatePriority(message.id, message.tenantId, action.parameters.newPriority);
    
    return {
      type: 'mark_priority',
      previousPriority: message.priority,
      newPriority: action.parameters.newPriority,
      updatedAt: new Date()
    };
  }

  private async executeArchive(action: any, message: Message): Promise<any> {
    console.log(`🗃️ [Archive] Archiving message: ${message.id}`);
    
    // Update message status to archived
    await this.messageRepository.updateStatus(message.id, message.tenantId, 'archived');
    
    return {
      type: 'archive',
      archivedAt: new Date()
    };
  }

  private async executeWebhookCall(action: any, message: Message): Promise<any> {
    console.log(`🔗 [WebhookCall] Calling webhook for message: ${message.id}`);
    
    try {
      const response = await fetch(action.parameters.webhookUrl, {
        method: action.parameters.webhookMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.parameters.webhookHeaders
        },
        body: JSON.stringify({
          message,
          timestamp: new Date().toISOString(),
          ...action.parameters.webhookPayload
        })
      });

      return {
        type: 'webhook_call',
        url: action.parameters.webhookUrl,
        method: action.parameters.webhookMethod,
        statusCode: response.status,
        response: await response.text(),
        calledAt: new Date()
      };
    } catch (error) {
      throw new Error(`Webhook call failed: ${error.message}`);
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + minutes;
  }

  private async updateRuleStats(rule: AutomationRule, success: boolean, executionTime: number): Promise<void> {
    const stats = rule.executionStats;
    stats.totalExecutions++;
    
    if (success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }
    
    stats.lastExecuted = new Date();
    stats.averageExecutionTime = stats.averageExecutionTime 
      ? (stats.averageExecutionTime + executionTime) / 2 
      : executionTime;

    await this.automationRuleRepository.updateStats(rule.id, rule.tenantId, stats);
  }
}
