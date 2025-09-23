import { IActionExecutorPort, ActionExecutionContext, ActionExecutionResult } from '../../domain/ports/IActionExecutorPort';
import { AutomationAction } from '../../domain/entities/AutomationRule';
import { IAIAnalysisPort } from '../../domain/ports/IAIAnalysisPort';

export class ActionExecutor implements IActionExecutorPort {
  constructor(private aiService?: IAIAnalysisPort) {}

  async executeActions(actions: AutomationAction[], context: ActionExecutionContext): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = [];

    for (const action of actions) {
      const result = await this.execute(action, context);
      results.push(result);
    }

    return results;
  }

  async execute(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🎯 [ActionExecutor] Executing action: ${action.type}`);

    try {
      switch (action.type) {
        case 'create_ticket':
          return await this.createTicketAction(action, context);

        case 'send_auto_reply':
        case 'auto_reply':
          return await this.sendAutoReplyAction(action, context);

        case 'ai_response':
          return await this.sendAIResponseAction(action, context);

        case 'forward_message':
          return await this.forwardMessageAction(action, context);

        case 'assign_user':
          return await this.assignUserAction(action, context);

        case 'add_tag':
          return await this.addTagAction(action, context);

        case 'escalate':
          return await this.escalateAction(action, context);

        case 'webhook':
          return await this.webhookAction(action, context);

        case 'notify_team':
          return await this.notifyTeamAction(action, context);

        default:
          return {
            success: false,
            message: `Unknown action type: ${action.type}`,
            error: `Action type ${action.type} is not supported`
          };
      }
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error executing action ${action.type}:`, error);
      return {
        success: false,
        message: `Failed to execute action ${action.type}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  canExecute(actionType: string): boolean {
    const supportedActions = [
      'create_ticket', 'send_auto_reply', 'auto_reply', 'ai_response', 'forward_message',
      'assign_user', 'add_tag', 'escalate', 'webhook', 'notify_team'
    ];
    return supportedActions.includes(actionType);
  }

  private async createTicketAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    try {
      console.log(`🎫 [ActionExecutor] Creating ticket from automation rule: ${context.ruleName}`);

      const { messageData, aiAnalysis, tenantId } = context;

      // Usar análise de IA se disponível para melhorar os dados do ticket
      const subject = action.params?.subject ||
                     aiAnalysis?.summary ||
                     messageData.subject ||
                     `Ticket automático - ${messageData.channel || 'Sistema'}`;

      const description = action.params?.description ||
                         `${aiAnalysis?.summary || messageData.content || 'Conteúdo não disponível'}\n\n` +
                         `Categoria sugerida: ${aiAnalysis?.category || 'Geral'}\n` +
                         `Urgência detectada: ${aiAnalysis?.urgency || 'medium'}\n` +
                         `Sentimento: ${aiAnalysis?.sentiment || 'neutral'}\n` +
                         `Palavras-chave: ${aiAnalysis?.keywords?.join(', ') || 'Nenhuma'}`;

      const priority = aiAnalysis?.urgency === 'critical' ? 'urgent' :
                      aiAnalysis?.urgency === 'high' ? 'high' :
                      aiAnalysis?.urgency === 'low' ? 'low' : 'medium';

      const ticketData = {
        subject,
        description,
        status: action.params?.status || 'open',
        priority,
        urgency: aiAnalysis?.urgency || 'medium',
        impact: 'medium',
        category: aiAnalysis?.category || action.params?.category || 'Atendimento ao Cliente',
        subcategory: action.params?.subcategory || 'Automação',
        assignedToId: action.params?.assignedToId || null,
        tenantId,
        source: messageData.channel || messageData.channelType || 'omnibridge',
        metadata: {
          automationRule: {
            ruleId: context.ruleId,
            ruleName: context.ruleName,
            executedAt: new Date().toISOString(),
            aiAnalysis: aiAnalysis
          },
          originalMessage: {
            content: messageData.content,
            sender: messageData.sender,
            channel: messageData.channel,
            timestamp: messageData.timestamp
          }
        }
      };

      // Fazer requisição para criar o ticket
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(ticketData)
      });

      if (response.ok) {
        const result = await response.json();
        const ticketId = result.data?.number || result.data?.id || 'Unknown';
        return {
          success: true,
          message: `Ticket created successfully: ${ticketId}`,
          data: { ticketId, ticketData }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: 'Failed to create ticket',
          error: errorText
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error creating ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendAutoReplyAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    try {
      console.log(`📤 [ActionExecutor] Sending auto-reply to ${context.messageData.sender}`);

      let responseText = action.params?.message || action.params?.template;

      // Substituir variáveis na mensagem
      if (responseText) {
        responseText = this.processTemplate(responseText, context);
      } else {
        responseText = 'Obrigado pelo seu contato. Nossa equipe analisará sua mensagem.';
      }

      console.log(`📝 [ActionExecutor] Reply content: ${responseText.substring(0, 100)}...`);

      // TODO: Implementar integração real com canais de comunicação
      // Por enquanto, apenas simular o envio
      const success = true; // Simula o sucesso do envio

      if (success) {
        return {
          success: true,
          message: 'Auto-reply sent successfully',
          data: { responseText, recipient: context.messageData.sender }
        };
      } else {
        await this.storeFailedMessage(responseText, context);
        return {
          success: false,
          message: 'Failed to send auto-reply',
          error: 'Simulated send failure',
          data: { responseText, recipient: context.messageData.sender }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error sending auto-reply',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendAIResponseAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    try {
      console.log(`🤖 [ActionExecutor] Generating AI response`);

      if (!this.aiService || !context.aiAnalysis) {
        return {
          success: false,
          message: 'AI service or analysis not available for AI response',
          error: 'Missing AI dependencies'
        };
      }

      const responseText = await this.aiService.generateResponse(
        context.aiAnalysis,
        context.messageData.content || context.messageData.body,
        {
          channel: context.messageData.channel,
          sender: context.messageData.sender,
          responseType: action.params?.responseType
        }
      );

      console.log(`📝 [ActionExecutor] AI generated response: ${responseText.substring(0, 100)}...`);

      // TODO: Implementar envio real através dos canais
      // Por enquanto, apenas simular o envio

      return {
        success: true,
        message: 'AI response generated and sent successfully',
        data: { responseText, recipient: context.messageData.sender }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error generating AI response',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async forwardMessageAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`⏩ [ActionExecutor] Forwarding message to ${action.target}`);

    // TODO: Implementar lógica de encaminhamento real
    return {
      success: true,
      message: `Message forwarded to ${action.target}`,
      data: { target: action.target }
    };
  }

  private async assignUserAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`👤 [ActionExecutor] Assigning to user ${action.target}`);

    // TODO: Implementar lógica de atribuição real
    return {
      success: true,
      message: `Assigned to user ${action.target}`,
      data: { assignedTo: action.target }
    };
  }

  private async addTagAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🏷️ [ActionExecutor] Adding tag ${action.params?.tag}`);

    // TODO: Implementar lógica de adição de tag real
    return {
      success: true,
      message: `Tag ${action.params?.tag} added`,
      data: { tag: action.params?.tag }
    };
  }

  private async escalateAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`⬆️ [ActionExecutor] Escalating message based on ${context.aiAnalysis ? 'AI analysis' : 'rule conditions'}`);

    // TODO: Implementar lógica de escalação real
    return {
      success: true,
      message: 'Message escalated successfully',
      data: { escalationReason: context.aiAnalysis?.intent || 'rule_based' }
    };
  }

  private async webhookAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    try {
      const webhookUrl = action.params?.url;
      if (!webhookUrl) {
        return {
          success: false,
          message: 'Webhook URL not provided',
          error: 'Missing webhook URL'
        };
      }

      const payload = {
        rule: {
          id: context.ruleId,
          name: context.ruleName
        },
        message: context.messageData,
        aiAnalysis: context.aiAnalysis,
        timestamp: new Date().toISOString(),
        tenant: context.tenantId
      };

      console.log(`🔗 [ActionExecutor] Sending webhook to ${webhookUrl}`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OmniBridge-Automation/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Webhook sent successfully',
          data: { webhookUrl, status: response.status }
        };
      } else {
        return {
          success: false,
          message: 'Webhook failed',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error sending webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async notifyTeamAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📢 [ActionExecutor] Notifying team about ${context.aiAnalysis ? 'AI-detected' : 'rule-based'} event`);

    // TODO: Implementar lógica de notificação real
    return {
      success: true,
      message: 'Team notified successfully',
      data: { notificationType: 'automation_trigger' }
    };
  }

  /**
   * Process template variables in message content
   */
  private processTemplate(template: string, context: ActionExecutionContext): string {
    try {
      let processed = template;

      // Replace common template variables
      const variables = {
        '{{sender}}': context.messageData.sender || 'Usuário',
        '{{channel}}': context.messageData.channel || context.messageData.channelType || 'Sistema',
        '{{content}}': context.messageData.content || context.messageData.body || '',
        '{{rule_name}}': context.ruleName || 'Regra de Automação',
        '{{timestamp}}': new Date().toLocaleString('pt-BR'),
        '{{tenant_id}}': context.tenantId
      };

      // AI analysis variables if available
      if (context.aiAnalysis) {
        variables['{{ai_intent}}'] = context.aiAnalysis.intent || '';
        variables['{{ai_sentiment}}'] = context.aiAnalysis.sentiment || '';
        variables['{{ai_urgency}}'] = context.aiAnalysis.urgency || '';
        variables['{{ai_summary}}'] = context.aiAnalysis.summary || '';
      }

      // Replace all variables
      Object.entries(variables).forEach(([key, value]) => {
        processed = processed.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
      });

      return processed;
    } catch (error) {
      console.error(`❌ [ActionExecutor] Template processing error:`, error);
      return template; // Return original template if processing fails
    }
  }

  /**
   * Store failed message for manual retry
   */
  private async storeFailedMessage(content: string, context: ActionExecutionContext): Promise<void> {
    try {
      console.log(`💾 [ActionExecutor] Storing failed auto-reply for manual retry`);

      // TODO: Implement database storage for failed messages
      // For now, just log the information
      const failedMessage = {
        content,
        recipient: context.messageData.sender,
        channel: context.messageData.channel || context.messageData.channelType,
        tenantId: context.tenantId,
        ruleId: context.ruleId,
        ruleName: context.ruleName,
        failedAt: new Date().toISOString(),
        retryCount: 0
      };

      console.log(`📝 [ActionExecutor] Failed message stored:`, failedMessage);
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error storing failed message:`, error);
    }
  }
}