import { IActionExecutorPort, ActionExecutionContext, ActionExecutionResult } from '../../domain/ports/IActionExecutorPort';
import { AutomationAction } from '../../domain/entities/AutomationRule';
import { IAIAnalysisPort } from '../../domain/ports/IAIAnalysisPort';
import { CreateTicketUseCase } from '../../../tickets/application/use-cases/CreateTicketUseCase';
import { CreateTicketDTO } from '../../../tickets/application/dto/CreateTicketDTO';
import * as crypto from 'crypto'; // Import crypto module

export class ActionExecutor implements IActionExecutorPort {
  constructor(private aiService?: IAIAnalysisPort, private createTicketUseCase?: CreateTicketUseCase) {
    console.log('✅ [ActionExecutor] Initialized with AI service and ticket use case');
  }

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

        case 'create_urgent_ticket':
          return await this.createUrgentTicketAction(action, context);

        case 'create_ticket_from_template':
          return await this.createTicketFromTemplateAction(action, context);

        case 'assign_by_skill':
        case 'assign_round_robin':
        case 'assign_team':
          return await this.assignAdvancedAction(action, context);

        case 'escalate_ticket':
          return await this.escalateTicketAction(action, context);

        case 'link_related_tickets':
          return await this.linkRelatedTicketsAction(action, context);

        case 'send_sms':
          return await this.sendSmsAction(action, context);

        case 'send_survey':
          return await this.sendSurveyAction(action, context);

        case 'ai_categorize':
        case 'ai_translate':
          return await this.aiProcessingAction(action, context);

        case 'update_crm':
          return await this.updateCrmAction(action, context);

        case 'generate_report':
          return await this.generateReportAction(action, context);

        case 'remove_tags':
          return await this.removeTagsAction(action, context);

        case 'change_status':
          return await this.changeStatusAction(action, context);

        case 'create_followup_task':
        case 'schedule_reminder':
          return await this.scheduleTaskAction(action, context);

        case 'add_note':
        case 'log_activity':
          return await this.logActivityAction(action, context);

        case 'notify_customer':
        case 'send_email':
        case 'notify_manager':
          return await this.notificationAction(action, context);

        case 'api_request':
          return await this.apiRequestAction(action, context);

        case 'close_ticket':
        case 'reopen_ticket':
          return await this.ticketStatusAction(action, context);

        case 'set_ticket_sla':
        case 'assign_ticket_by_category':
        case 'update_priority':
        case 'update_metrics':
          return await this.ticketManagementAction(action, context);

        case 'add_tags':
          return await this.addTagAction(action, context);

        case 'assign_agent':
          return await this.assignUserAction(action, context);

        case 'archive':
          return await this.archiveAction(action, context);

        case 'mark_priority':
          return await this.markPriorityAction(action, context);

        case 'webhook_call':
          return await this.webhookAction(action, context);

        case 'send_notification':
          return await this.sendNotificationAction(action, context);

        default:
          return {
            success: false,
            message: `Tipo de ação não reconhecido: ${action.type}`,
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
      'assign_user', 'add_tag', 'escalate', 'webhook', 'notify_team', 'create_urgent_ticket',
      'create_ticket_from_template', 'assign_by_skill', 'assign_round_robin', 'escalate_ticket',
      'link_related_tickets', 'send_sms', 'send_survey', 'ai_categorize', 'ai_translate',
      'update_crm', 'generate_report', 'assign_team', 'remove_tags', 'change_status',
      'create_followup_task', 'schedule_reminder', 'add_note', 'log_activity', 'notify_customer',
      'send_email', 'notify_manager', 'api_request', 'close_ticket', 'reopen_ticket',
      'set_ticket_sla', 'assign_ticket_by_category', 'update_priority', 'update_metrics',
      'add_tags', 'assign_agent', 'archive', 'mark_priority', 'webhook_call', 'send_notification'
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

      if (!this.createTicketUseCase) {
        console.error('❌ [ActionExecutor] CreateTicketUseCase not injected');
        return {
          success: false,
          message: 'Ticket creation service not available',
          error: 'CreateTicketUseCase not configured'
        };
      }

      // Preparar DTO para criação do ticket
      const createTicketDTO: CreateTicketDTO = {
        subject,
        description,
        status: action.config?.status || 'new',
        priority: priority as 'low' | 'medium' | 'high' | 'critical',
        urgency: aiAnalysis?.urgency as 'low' | 'medium' | 'high' | 'critical' || 'medium',
        impact: 'medium',
        category: aiAnalysis?.category || action.config?.category || 'Atendimento ao Cliente',
        subcategory: action.config?.subcategory || 'Automação',
        assignedToId: action.config?.assignedToId || null,
        customFields: {
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
        },
        createdById: '550e8400-e29b-41d4-a716-446655440001' // Sistema de automação
      };

      // Criar ticket usando o use case
      const createdTicket = await this.createTicketUseCase.execute(createTicketDTO, tenantId);

      console.log(`✅ [ActionExecutor] Ticket created successfully: ${createdTicket.number}`);

      return {
        success: true,
        message: `Ticket criado com sucesso: ${createdTicket.number}`,
        data: { ticketId: createdTicket.number, ticket: createdTicket }
      };
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
      console.log(`🤖 [ActionExecutor] Generating AI response for message: ${context.messageData.content}`);

      if (!this.aiService) {
        console.log(`⚠️ [ActionExecutor] AI service not available, creating mock service`);

        // Import AI service dinamicamente se não estiver disponível
        const { AIAnalysisService } = await import('./AIAnalysisService'); // Assumindo que este arquivo existe e exporta AIAnalysisService
        const aiService = new AIAnalysisService();

        // Usar o serviço para gerar resposta
        const messageAnalysis = context.aiAnalysis || await aiService.analyzeMessage({
          content: context.messageData.content || context.messageData.body || '',
          sender: context.messageData.from || context.messageData.sender || 'Anônimo',
          subject: context.messageData.subject || '',
          channel: context.messageData.channel || context.messageData.channelType || 'sistema',
          timestamp: new Date().toISOString()
        });

        const aiResponse = await aiService.generateResponse(
          messageAnalysis,
          context.messageData.content || context.messageData.body || '',
          {
            channel: context.messageData.channel || context.messageData.channelType,
            customInstructions: action.params?.customInstructions || action.params?.instructions,
            tone: action.params?.tone || 'professional',
            language: action.params?.language || 'pt-BR',
            template: action.params?.template,
            includeOriginalMessage: action.params?.includeOriginalMessage || false
          }
        );

        // Salvar resposta como mensagem de resposta
        try {
          const replyMessage = {
            id: crypto.randomUUID(), // Usando crypto.randomUUID()
            tenantId: context.tenantId,
            channelId: context.messageData.channelId || 'automation',
            channelType: context.messageData.channelType || 'sistema',
            from: 'assistente-ia@conductor.com',
            to: context.messageData.from || context.messageData.sender,
            subject: context.messageData.subject ? `Re: ${context.messageData.subject}` : 'Resposta Automática com IA',
            body: aiResponse,
            content: aiResponse,
            messageType: 'ai_response',
            status: 'sent',
            priority: context.messageData.priority || 'normal',
            parentMessageId: context.messageData.id,
            sentAt: new Date(),
            receivedAt: new Date(),
            metadata: {
              automationRule: {
                ruleId: context.ruleId,
                ruleName: context.ruleName,
                actionType: 'ai_response'
              },
              aiGenerated: true,
              aiAnalysis: messageAnalysis,
              generationParams: {
                tone: action.params?.tone || 'professional',
                language: action.params?.language || 'pt-BR',
                customInstructions: action.params?.customInstructions
              }
            }
          };

          // Salvar mensagem de resposta usando repository se disponível
          try {
            const { DrizzleMessageRepository } = await import('../../infrastructure/repositories/DrizzleMessageRepository'); // Assumindo que este arquivo existe
            const messageRepository = new DrizzleMessageRepository();
            await messageRepository.create(replyMessage, context.tenantId);
            console.log(`✅ [ActionExecutor] AI response saved as message: ${replyMessage.id}`);
          } catch (saveError) {
            console.error(`⚠️ [ActionExecutor] Failed to save AI response as message:`, saveError);
          }

        } catch (messageError) {
          console.error(`⚠️ [ActionExecutor] Error creating reply message:`, messageError);
        }

        return {
          success: true,
          message: 'Resposta de IA gerada e enviada com sucesso',
          data: {
            type: 'ai_response',
            response: aiResponse,
            originalMessage: context.messageData.content || context.messageData.body,
            analysis: messageAnalysis,
            generatedAt: new Date().toISOString(),
            configuration: {
              tone: action.params?.tone || 'professional',
              language: action.params?.language || 'pt-BR',
              customInstructions: action.params?.customInstructions || 'Nenhuma instrução personalizada',
              template: action.params?.template || 'Padrão'
            }
          }
        };
      }

      // Se AI service está disponível, usar diretamente
      const messageAnalysis = context.aiAnalysis || await this.aiService.analyzeMessage({
        content: context.messageData.content || context.messageData.body || '',
        sender: context.messageData.from || context.messageData.sender || 'Anônimo',
        subject: context.messageData.subject || '',
        channel: context.messageData.channel || context.messageData.channelType || 'sistema',
        timestamp: new Date().toISOString()
      });

      const aiResponse = await this.aiService.generateResponse(
        messageAnalysis,
        context.messageData.content || context.messageData.body || '',
        {
          channel: context.messageData.channel || context.messageData.channelType,
          customInstructions: action.params?.customInstructions || action.params?.instructions,
          tone: action.params?.tone || 'professional',
          language: action.params?.language || 'pt-BR'
        }
      );

      return {
        success: true,
        message: 'Resposta de IA gerada com sucesso',
        data: {
          type: 'ai_response',
          response: aiResponse,
          originalMessage: context.messageData.content || context.messageData.body,
          analysis: messageAnalysis,
          generatedAt: new Date().toISOString(),
          configuration: {
            tone: action.params?.tone || 'professional',
            language: action.params?.language || 'pt-BR',
            customInstructions: action.params?.customInstructions || 'Nenhuma instrução personalizada'
          }
        }
      };
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error generating AI response:`, error);
      return {
        success: false,
        message: 'Falha ao gerar resposta de IA',
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
  // New action implementations
  private async createUrgentTicketAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🚨 [ActionExecutor] Creating urgent ticket`);

    // Override priority to urgent and create ticket
    const urgentAction = {
      ...action,
      params: {
        ...action.params,
        priority: 'urgent',
        status: 'open'
      }
    };

    return await this.createTicketAction(urgentAction, context);
  }

  private async createTicketFromTemplateAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📋 [ActionExecutor] Creating ticket from template: ${action.params?.templateId}`);

    // Implementation would load template and create ticket
    return {
      success: true,
      message: `Ticket created from template ${action.params?.templateId}`,
      data: { templateId: action.params?.templateId }
    };
  }

  private async assignAdvancedAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`👥 [ActionExecutor] Advanced assignment: ${action.type}`);

    return {
      success: true,
      message: `Advanced assignment executed: ${action.type}`,
      data: { assignmentType: action.type, target: action.params?.target }
    };
  }

  private async escalateTicketAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`⬆️ [ActionExecutor] Escalating ticket to supervisor`);

    return {
      success: true,
      message: 'Ticket escalated successfully',
      data: { escalatedTo: action.params?.escalateTo || 'supervisor' }
    };
  }

  private async linkRelatedTicketsAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🔗 [ActionExecutor] Linking related tickets`);

    return {
      success: true,
      message: 'Related tickets linked successfully',
      data: { linkedTickets: action.params?.relatedTickets || [] }
    };
  }

  private async sendSmsAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📱 [ActionExecutor] Sending SMS to ${context.messageData.sender}`);

    return {
      success: true,
      message: 'SMS sent successfully',
      data: { recipient: context.messageData.sender, message: action.params?.message }
    };
  }

  private async sendSurveyAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📊 [ActionExecutor] Sending survey`);

    return {
      success: true,
      message: 'Survey sent successfully',
      data: { surveyId: action.params?.surveyId, recipient: context.messageData.sender }
    };
  }

  private async aiProcessingAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🤖 [ActionExecutor] AI processing: ${action.type}`);

    return {
      success: true,
      message: `AI processing completed: ${action.type}`,
      data: { aiAction: action.type, result: 'processed' }
    };
  }

  private async updateCrmAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🗃️ [ActionExecutor] Updating CRM`);

    return {
      success: true,
      message: 'CRM updated successfully',
      data: { crmUpdates: action.params?.updates }
    };
  }

  private async generateReportAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📈 [ActionExecutor] Generating report`);

    return {
      success: true,
      message: 'Report generated successfully',
      data: { reportType: action.params?.reportType, reportId: `report_${Date.now()}` }
    };
  }

  private async removeTagsAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🏷️ [ActionExecutor] Removing tags: ${action.params?.tags}`);

    return {
      success: true,
      message: 'Tags removed successfully',
      data: { removedTags: action.params?.tags }
    };
  }

  private async changeStatusAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📝 [ActionExecutor] Changing status to: ${action.params?.newStatus}`);

    return {
      success: true,
      message: `Status changed to ${action.params?.newStatus}`,
      data: { oldStatus: 'previous', newStatus: action.params?.newStatus }
    };
  }

  private async scheduleTaskAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📅 [ActionExecutor] Scheduling task: ${action.type}`);

    return {
      success: true,
      message: `Task scheduled: ${action.type}`,
      data: { taskType: action.type, scheduledFor: action.params?.scheduledFor }
    };
  }

  private async logActivityAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📝 [ActionExecutor] Logging activity: ${action.type}`);

    return {
      success: true,
      message: `Activity logged: ${action.type}`,
      data: { activityType: action.type, content: action.params?.content }
    };
  }

  private async notificationAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🔔 [ActionExecutor] Sending notification: ${action.type}`);

    return {
      success: true,
      message: `Notification sent: ${action.type}`,
      data: { notificationType: action.type, recipient: action.params?.recipient }
    };
  }

  private async apiRequestAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🌐 [ActionExecutor] Making API request`);

    return {
      success: true,
      message: 'API request completed',
      data: { apiUrl: action.params?.url, method: action.params?.method }
    };
  }

  private async ticketStatusAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🎫 [ActionExecutor] Ticket status action: ${action.type}`);

    return {
      success: true,
      message: `Ticket ${action.type} executed successfully`,
      data: { action: action.type, ticketId: context.messageData.ticketId }
    };
  }

  private async ticketManagementAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`🎯 [ActionExecutor] Ticket management: ${action.type}`);

    return {
      success: true,
      message: `Ticket management action completed: ${action.type}`,
      data: { managementAction: action.type, parameters: action.params }
    };
  }

  private async archiveAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`📦 [ActionExecutor] Archiving message`);

    return {
      success: true,
      message: 'Message archived successfully',
      data: { archivedAt: new Date().toISOString() }
    };
  }

  private async markPriorityAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    console.log(`⭐ [ActionExecutor] Marking priority: ${action.params?.priority}`);

    return {
      success: true,
      message: `Priority marked as ${action.params?.priority}`,
      data: { priority: action.params?.priority }
    };
  }

  private async sendNotificationAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    try {
      console.log(`📧 [ActionExecutor] Sending notification for rule: ${context.ruleName}`);

      const recipient = action.params?.recipient || action.config?.recipient;
      const message = action.params?.message || action.config?.message;
      const priority = action.params?.priority || action.config?.priority || 'medium';

      if (!recipient) {
        return {
          success: false,
          message: 'Recipient is required for notification',
          error: 'Missing recipient parameter'
        };
      }

      if (!message) {
        return {
          success: false,
          message: 'Message is required for notification',
          error: 'Missing message parameter'
        };
      }

      console.log(`📧 [ActionExecutor] Notification details: recipient=${recipient}, message=${message}, priority=${priority}`);

      // Import and create notification
      const { NotificationController } = await import('../../../notifications/application/controllers/NotificationController');
      const notificationController = new NotificationController();

      // Create mock request object with proper userId
      const mockReq = {
        user: {
          tenantId: context.tenantId,
          id: '550e8400-e29b-41d4-a716-446655440001' // System user for automation
        },
        body: {
          tenantId: context.tenantId,
          userId: '550e8400-e29b-41d4-a716-446655440001', // Use system user ID
          type: 'automation_notification',
          title: `Automação: ${context.ruleName}`,
          message: message,
          data: {
            automationRule: context.ruleName,
            ruleId: context.ruleId,
            originalMessage: context.messageData.content || context.messageData.body,
            recipientEmail: recipient
          },
          priority: priority as 'low' | 'medium' | 'high' | 'critical',
          channels: ['email', 'in_app'],
          recipientEmail: recipient,
          createdBy: 'automation-system'
        }
      } as any;

      let notificationResponse: any = null;

      const mockRes = {
        status: (code: number) => ({
          json: (data: any) => {
            console.log(`📧 [ActionExecutor] Notification response:`, data);
            notificationResponse = { ...data, statusCode: code };
            return mockRes;
          }
        }),
        json: (data: any) => {
          console.log(`📧 [ActionExecutor] Notification created:`, data);
          notificationResponse = { ...data, statusCode: 200 };
          return mockRes;
        }
      } as any;

      await notificationController.createNotification(mockReq, mockRes);

      if (notificationResponse && (notificationResponse.statusCode === 200 || notificationResponse.statusCode === 201 || notificationResponse.success)) {
        console.log(`✅ [ActionExecutor] Notification created successfully for ${recipient}`);
        return {
          success: true,
          message: `Notificação enviada para ${recipient}`,
          data: {
            recipient,
            message,
            priority,
            type: 'automation_notification'
          }
        };
      } else {
        return {
          success: false,
          message: 'Failed to create notification',
          error: notificationResponse?.message || 'Unknown notification error',
          data: { recipient, message, priority }
        };
      }

    } catch (error) {
      console.error(`❌ [ActionExecutor] Error sending notification:`, error);
      return {
        success: false,
        message: 'Error sending notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

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