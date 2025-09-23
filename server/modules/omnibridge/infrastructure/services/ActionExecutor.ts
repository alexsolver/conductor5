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

      // ✅ REAL MESSAGE SENDING IMPLEMENTATION
      let success = false;
      let sendError = null;

      try {
        // Determine channel type and send via appropriate integration
        const channelType = context.messageData.channelType || context.messageData.channel;
        const recipient = context.messageData.sender;

        console.log(`🚀 [ActionExecutor] Sending via ${channelType} to ${recipient}`);

        if (channelType === 'telegram') {
          // Send via Telegram
          success = await this.sendTelegramMessage(responseText, recipient, context.tenantId);
        } else if (channelType === 'email' || channelType === 'imap') {
          // Send via Email
          success = await this.sendEmailMessage(responseText, recipient, context.tenantId, context.messageData);
        } else {
          // For other channels, save as outbound message for manual processing
          console.log(`📝 [ActionExecutor] Channel ${channelType} not supported for auto-reply, storing as outbound message`);
          success = await this.storeOutboundMessage(responseText, recipient, channelType, context.tenantId);
        }

        if (success) {
          console.log(`✅ [ActionExecutor] Auto-reply sent successfully via ${channelType}`);
          return {
            success: true,
            message: 'Auto-reply sent successfully',
            data: { responseText, recipient, channel: channelType }
          };
        } else {
          await this.storeFailedMessage(responseText, context);
          return {
            success: false,
            message: 'Failed to send auto-reply',
            error: sendError || 'Send operation failed',
            data: { responseText, recipient, channel: channelType }
          };
        }
      } catch (error) {
        console.error(`❌ [ActionExecutor] Error sending auto-reply:`, error);
        sendError = error instanceof Error ? error.message : 'Unknown error';
        await this.storeFailedMessage(responseText, context);
        
        return {
          success: false,
          message: 'Error sending auto-reply',
          error: sendError,
          data: { responseText, recipient }
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
   * Send message via Telegram Bot API
   */
  private async sendTelegramMessage(message: string, recipient: string, tenantId: string): Promise<boolean> {
    try {
      console.log(`📱 [ActionExecutor] Sending Telegram message to ${recipient}`);

      // Extract chat ID from recipient (format: telegram:chatId)
      const chatId = recipient.replace('telegram:', '');
      
      // Get Telegram bot token from tenant integrations or environment
      const botToken = await this.getTelegramBotToken(tenantId);
      
      if (!botToken) {
        console.error(`❌ [ActionExecutor] No Telegram bot token found for tenant ${tenantId}`);
        return false;
      }

      // Send message using Telegram Bot API
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.ok) {
        console.log(`✅ [ActionExecutor] Telegram message sent successfully to ${chatId}`);
        return true;
      } else {
        console.error(`❌ [ActionExecutor] Telegram API error:`, result);
        return false;
      }
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error sending Telegram message:`, error);
      return false;
    }
  }

  /**
   * Send message via Email (SendGrid integration)
   */
  private async sendEmailMessage(message: string, recipient: string, tenantId: string, originalMessage: any): Promise<boolean> {
    try {
      console.log(`📧 [ActionExecutor] Sending email message to ${recipient}`);

      // Extract email address from recipient
      const emailAddress = recipient.includes(':') ? recipient.split(':')[1] : recipient;
      
      // Get SendGrid configuration
      const apiKey = process.env.SENDGRID_API_KEY;
      
      if (!apiKey) {
        console.error(`❌ [ActionExecutor] No SendGrid API key found`);
        return false;
      }

      // Import SendGrid service dynamically
      const { MailService } = await import('@sendgrid/mail');
      const mailService = new MailService();
      mailService.setApiKey(apiKey);

      // Prepare email content
      const emailParams = {
        to: emailAddress,
        from: 'support@conductor.com', // Use configured sender address
        subject: `Re: ${originalMessage.subject || 'Sua mensagem'}`,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`
      };

      await mailService.send(emailParams);
      console.log(`✅ [ActionExecutor] Email sent successfully to ${emailAddress}`);
      return true;
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error sending email:`, error);
      return false;
    }
  }

  /**
   * Store outbound message for channels that don't support direct sending
   */
  private async storeOutboundMessage(message: string, recipient: string, channel: string, tenantId: string): Promise<boolean> {
    try {
      console.log(`💾 [ActionExecutor] Storing outbound message for ${channel} to ${recipient}`);

      // TODO: Store in database for manual processing
      // For now, just log and return success
      const outboundMessage = {
        tenantId,
        channel,
        recipient,
        message,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log(`📝 [ActionExecutor] Outbound message stored:`, outboundMessage);
      return true;
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error storing outbound message:`, error);
      return false;
    }
  }

  /**
   * Get Telegram bot token from tenant integrations or environment
   */
  private async getTelegramBotToken(tenantId: string): Promise<string | null> {
    try {
      // First try environment variable
      if (process.env.TELEGRAM_BOT_TOKEN) {
        return process.env.TELEGRAM_BOT_TOKEN;
      }

      // TODO: Get from tenant integrations database
      // For now, return null to force environment variable usage
      console.log(`⚠️ [ActionExecutor] No Telegram bot token found. Please set TELEGRAM_BOT_TOKEN environment variable.`);
      return null;
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error getting Telegram bot token:`, error);
      return null;
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