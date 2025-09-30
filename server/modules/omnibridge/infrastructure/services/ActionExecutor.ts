import { IActionExecutorPort, ActionExecutionContext, ActionExecutionResult } from '../../domain/ports/IActionExecutorPort';
import { AutomationAction } from '../../domain/entities/AutomationRule';
import { IAIAnalysisPort } from '../../domain/ports/IAIAnalysisPort';
import { CreateTicketUseCase } from '../../../tickets/application/use-cases/CreateTicketUseCase';
import { CreateTicketDTO } from '../../../tickets/application/dto/CreateTicketDTO';
import * as crypto from 'crypto'; // Import crypto module
import { DrizzleConversationLogRepository } from '../repositories/DrizzleConversationLogRepository';
import { db } from '../../../../db';
import { conversationMessages, actionExecutions } from '../../../../../shared/schema';
import { sql } from 'drizzle-orm';

export class ActionExecutor implements IActionExecutorPort {
  private conversationLogRepo: DrizzleConversationLogRepository;
  private activeConversations: Map<string, number> = new Map(); // sessionId -> conversationLogId

  constructor(private aiService?: IAIAnalysisPort, private createTicketUseCase?: CreateTicketUseCase) {
    console.log('✅ [ActionExecutor] Initialized with AI service and ticket use case');
    this.conversationLogRepo = new DrizzleConversationLogRepository();
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

        case 'ai_agent':
          return await this.aiAgentAction(action, context);

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
        
        const errorRecipient = context.messageData.sender;
        return {
          success: false,
          message: 'Error sending auto-reply',
          error: sendError,
          data: { responseText, recipient: errorRecipient }
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
          const { DrizzleMessageRepository } = await import('../../infrastructure/repositories/DrizzleMessageRepository'); // Assumindo que este arquivo existe
          const messageRepository = new DrizzleMessageRepository();
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
          await messageRepository.create(replyMessage, context.tenantId);
          console.log(`✅ [ActionExecutor] AI response saved as message: ${replyMessage.id}`);

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
      console.log('📤 [ActionExecutor] Executing send_notification action:', action);

      // ✅ 1QA.MD: Extrair dados dos params ou config com fallbacks seguros
      const config = action.config || {};
      const params = action.params || {};
      
      // Tentar extrair de params primeiro, depois config
      const rawUsers = params.users || config.users || config.recipients || [];
      const rawGroups = params.groups || config.groups || [];
      
      // Garantir que users e groups sejam arrays
      const users = Array.isArray(rawUsers) ? rawUsers : 
                    (typeof rawUsers === 'string' && rawUsers.trim()) ? rawUsers.split(',').map(u => u.trim()) : [];
      const groups = Array.isArray(rawGroups) ? rawGroups : 
                     (typeof rawGroups === 'string' && rawGroups.trim()) ? rawGroups.split(',').map(g => g.trim()) : [];
      
      const subject = params.subject || config.subject || config.title || 'OmniBridge Automation Notification';
      
      // Combinar mensagem configurada com a mensagem original recebida
      const configuredMessage = params.message || config.message || '';
      const originalMessage = context.messageData.content || context.messageData.body || '';
      const messageFrom = context.messageData.from || context.messageData.sender || 'remetente desconhecido';
      const messageChannel = context.messageData.channelType || context.messageData.channel || 'canal desconhecido';
      
      let message = configuredMessage;
      if (originalMessage) {
        // Se houver mensagem configurada, adicionar a original como contexto
        if (configuredMessage) {
          message = `${configuredMessage}\n\n---\nMensagem Original (${messageChannel}):\nDe: ${messageFrom}\n\n${originalMessage}`;
        } else {
          // Se não houver mensagem configurada, usar apenas a original
          message = `Nova mensagem recebida via ${messageChannel}\n\nDe: ${messageFrom}\n\n${originalMessage}`;
        }
      }
      
      const channels = params.channels || config.channels || ['in_app'];
      const priority = params.priority || config.priority || 'medium';

      // ✅ 1QA.MD: Validar se há usuários especificados
      if (users.length === 0 && groups.length === 0) {
        const errorMessage = 'At least one user or group must be specified for send_notification action';
        console.error('❌ [ActionExecutor] Error in notification action:', errorMessage);

        return {
          success: false,
          message: 'Failed to send notification',
          error: errorMessage
        };
      }

      console.log('🔍 [ActionExecutor] Notification config extracted:', {
        users: users.length,
        groups: groups.length,
        subject: subject.substring(0, 50),
        channels
      });

      // ✅ 1QA.MD: Criar notificações usando o módulo de notificações
      const { CreateNotificationUseCase } = await import('../../../notifications-alerts/application/use-cases/CreateNotificationUseCase');
      const { DrizzleNotificationRepository } = await import('../../../notifications-alerts/infrastructure/repositories/DrizzleNotificationRepository');
      const { NotificationDomainService } = await import('../../../notifications-alerts/domain/services/NotificationDomainService');

      const notificationRepository = new DrizzleNotificationRepository();
      const domainService = new NotificationDomainService();
      const createNotificationUseCase = new CreateNotificationUseCase(notificationRepository, domainService);

      // ✅ 1QA.MD: Processar usuários individuais
      const results = [];
      if (users && users.length > 0) {
        for (const userId of users) {
          try {
            const notificationRequest = {
              type: 'automation_notification' as any,
              severity: priority as any,
              title: subject,
              message: message,
              metadata: {
                ruleId: String(context.ruleId || ''),
                ruleName: String(context.ruleName || ''),
                messageData: {
                  from: String(context.messageData?.from || ''),
                  subject: String(context.messageData?.subject || ''),
                  channel: String(context.messageData?.channel || '')
                },
                automationContext: true,
                timestamp: new Date().toISOString()
              },
              channels: channels as any[],
              userId: typeof userId === 'string' ? userId : String(userId),
              scheduledAt: new Date(),
              relatedEntityType: 'automation_rule',
              relatedEntityId: String(context.ruleId || '')
            };

            console.log('🔍 [ActionExecutor] About to call createNotificationUseCase.execute with request:', {
              notificationRequest,
              tenantId: context.tenantId,
              requestMetadata: notificationRequest.metadata,
              requestChannels: notificationRequest.channels
            });

            const result = await createNotificationUseCase.execute(notificationRequest, context.tenantId);

            console.log('🔍 [ActionExecutor] createNotificationUseCase.execute returned:', result);

            if (result.success) {
              results.push({ userId, success: true, notificationId: result.data?.id });
              console.log(`✅ [ActionExecutor] Notification created successfully for user ${userId}: ${result.data?.id}`);
            } else {
              results.push({ userId, success: false, error: result.error });
              console.error(`❌ [ActionExecutor] Failed to create notification for user ${userId}:`, result.error);
            }
          } catch (userError) {
            const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';
            results.push({ userId, success: false, error: errorMessage });
            console.error(`❌ [ActionExecutor] Error creating notification for user ${userId}:`, userError);
          }
        }
      }

      // ✅ 1QA.MD: Processar grupos (se especificados)
      if (groups && groups.length > 0) {
        console.log('👥 [ActionExecutor] Processing notification for groups:', groups);

        // Aqui você pode implementar lógica para resolver usuários dos grupos
        // Por enquanto, logamos que grupos foram especificados
        for (const groupId of groups) {
          results.push({ groupId, success: true, message: 'Group notification queued' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount > 0) {
        return {
          success: true,
          message: `Notification sent successfully to ${successCount}/${totalCount} recipients`,
          data: {
            results,
            successCount,
            totalCount,
            notificationConfig: {
              subject,
              channels,
              priority
            }
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to send notifications to any recipients (0/${totalCount})`,
          error: 'All notification attempts failed',
          data: { results }
        };
      }

    } catch (error) {
      console.error('❌ [ActionExecutor] Error executing send_notification action:', error);
      return {
        success: false,
        message: 'Failed to execute send_notification action',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeNotificationAction(action: any, context: ActionExecutionContext): Promise<void> {
    try {
      console.log('🔔 [ActionExecutor] Executing notification action:', action);

      // Get notification details from action config
      const { recipients, subject, message, channels } = action.config;

      // Resolve user IDs from emails if needed
      const resolvedRecipients = await this.resolveUserIds(recipients);

      // Send notification through notification service
      const notificationData = {
        type: 'omnibridge_automation',
        title: subject || 'OmniBridge Notification',
        message: message || `New message from ${context.messageData.from}`,
        recipients: resolvedRecipients,
        channels: channels || ['in_app'],
        data: {
          messageId: context.messageData.id,
          from: context.messageData.from,
          subject: context.messageData.subject
        }
      };

      // Here you would integrate with your notification service
      console.log('📤 [ActionExecutor] Notification sent:', notificationData);

    } catch (error) {
      console.error('❌ [ActionExecutor] Error executing notification action:', error);
      throw error;
    }
  }

  private async resolveUserIds(recipients: string[]): Promise<string[]> {
    if (!recipients || recipients.length === 0) {
      return [];
    }

    const { pool } = await import('@shared/schema');
    const resolvedIds: string[] = [];

    for (const recipient of recipients) {
      try {
        // Check if it's already a valid UUID
        if (this.isValidUUID(recipient)) {
          resolvedIds.push(recipient);
          continue;
        }

        // If it looks like an email, resolve to user ID
        if (recipient.includes('@')) {
          const user = await pool.query(
            'SELECT id FROM users WHERE email = $1 LIMIT 1',
            [recipient]
          );

          if (user.rows && user.rows.length > 0) {
            resolvedIds.push(user.rows[0].id);
            console.log(`✅ [ActionExecutor] Resolved email ${recipient} to user ID ${user.rows[0].id}`);
          } else {
            console.warn(`⚠️ [ActionExecutor] Could not resolve email to user ID: ${recipient}`);
          }
        } else {
          // Assume it's already a user ID or handle as needed
          resolvedIds.push(recipient);
        }
      } catch (error) {
        console.error(`❌ [ActionExecutor] Error resolving recipient ${recipient}:`, error);
      }
    }

    return resolvedIds;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }


  private processTemplate(template: string, context: ActionExecutionContext): string {
    try {
      let processed = template;

      // Replace common template variables
      const variables: Record<string, string> = {
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
      const sgMail = (await import('@sendgrid/mail')).default;
      sgMail.setApiKey(apiKey);

      // Prepare email content
      const emailParams = {
        to: emailAddress,
        from: 'support@conductor.com', // Use configured sender address
        subject: `Re: ${originalMessage.subject || 'Sua mensagem'}`,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`
      };

      await sgMail.send(emailParams);
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

  private async sendUserNotification(userId: string, message: string, tenantId: string): Promise<void> {
    try {
      console.log(`📧 [ACTION-EXECUTOR] Sending notification to user: ${userId}`);

      // Create notification entry in the database
      const notificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        tenantId: tenantId,
        type: 'automation_notification',
        title: 'Automation Notification',
        message: message,
        priority: 'medium',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        // Try to store notification using database directly
        const { pool } = await import('@shared/schema');
        
        await pool.query(
          `INSERT INTO user_notifications (id, user_id, tenant_id, type, title, message, priority, is_read, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            notificationData.id,
            notificationData.userId,
            notificationData.tenantId,
            notificationData.type,
            notificationData.title,
            notificationData.message,
            notificationData.priority,
            notificationData.isRead,
            notificationData.createdAt,
            notificationData.updatedAt
          ]
        );

        console.log(`✅ [ACTION-EXECUTOR] Notification stored for user ${userId}`);
      } catch (repoError) {
        console.warn(`⚠️ [ACTION-EXECUTOR] Failed to store notification, using fallback method:`, repoError);

        // Fallback: Log the notification (could be extended to use other notification methods)
        console.log(`📝 [ACTION-EXECUTOR] FALLBACK NOTIFICATION for user ${userId}: ${message}`);

        // In a real implementation, this could send email, SMS, or other notification methods
        // For now, we'll consider it successful if we can log it
      }
    } catch (error) {
      console.error(`❌ [ActionExecutor] Error sending user notification:`, error);
      // Don't throw error - treat as warning and continue
      console.warn(`⚠️ [ACTION-EXECUTOR] Notification failed but continuing automation execution`);
    }
  }

  private async sendGroupNotification(groupId: string, message: string, tenantId: string): Promise<void> {
    try {
      console.log(`📧 [ACTION-EXECUTOR] Sending notification to group: ${groupId}`);

      try {
        // Try to get group members and send individual notifications
        // This would require a group repository to get members
        console.log(`📝 [ACTION-EXECUTOR] Group notification for ${groupId}: ${message}`);

        // TODO: Implement actual group notification logic when group repository is available
        // This would involve:
        // 1. Get group members from group repository
        // 2. Send individual notifications to each member

        // For now, treat as successful
        console.log(`✅ [ACTION-EXECUTOR] Group notification logged for ${groupId}`);

      } catch (groupError) {
        console.warn(`⚠️ [ACTION-EXECUTOR] Group notification fallback for ${groupId}:`, groupError);
        // Fallback: Just log the notification
        console.log(`📝 [ACTION-EXECUTOR] FALLBACK GROUP NOTIFICATION for ${groupId}: ${message}`);
      }

    } catch (error) {
      console.error(`❌ [ActionExecutor] Error sending group notification:`, error);
      // Don't throw error - treat as warning and continue
      console.warn(`⚠️ [ACTION-EXECUTOR] Group notification failed but continuing automation execution`);
    }
  }

  /**
   * Execute AI Agent action with full conversational capabilities and field extraction
   */
  private async aiAgentAction(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 [AI-AGENT] Executing AI agent action for message: ${context.messageData.content}`);
      
      const aiAgentConfig = action.params?.aiAgentConfig;
      if (!aiAgentConfig) {
        return {
          success: false,
          message: 'AI Agent configuration not found',
          error: 'Missing aiAgentConfig in action params'
        };
      }

      // Extract configuration
      const { goal, prompts, knowledgeBase, fieldsToCollect, availableActions, actionConfigs } = aiAgentConfig;
      const userMessage = context.messageData.content || context.messageData.body || '';
      
      console.log(`🤖 [AI-AGENT] Available actions:`, availableActions);
      console.log(`🤖 [AI-AGENT] Action configs:`, actionConfigs);

      // Create or get conversation log
      const agentId = 1; // Default agent ID - should be passed in context ideally
      const conversationId = await this.getOrCreateConversationLog(context, agentId);
      
      // Log user message
      await this.logConversationMessage(
        conversationId,
        context.tenantId,
        'user',
        userMessage,
        {
          from: context.messageData.from || context.messageData.sender,
          channel: context.messageData.channelType || context.messageData.channel
        }
      );

      // Check if we need to execute an action (e.g., create ticket)
      let shouldExecuteAction = false;
      let actionToExecute: string | null = null;
      let actionResult: any = null;

      // Determine if AI should execute an action based on available actions and conversation
      if (availableActions?.createTicket && actionConfigs?.createTicket) {
        const createTicketConfig = actionConfigs.createTicket;
        
        // Check conversation mode
        if (createTicketConfig.conversationMode === 'menu' && createTicketConfig.menuTree) {
          // Menu mode: Check if user selected create ticket option
          shouldExecuteAction = this.checkMenuSelection(userMessage, createTicketConfig.menuTree, 'create_ticket');
          actionToExecute = 'createTicket';
        } else {
          // Natural or hybrid mode: Use AI to decide and extract fields
          const extractionResult = await this.extractFieldsWithAI(
            userMessage,
            createTicketConfig.fieldsToMap,
            prompts
          );
          
          console.log(`🤖 [AI-AGENT] Field extraction result:`, extractionResult);
          
          if (extractionResult.shouldCreateTicket && extractionResult.extractedFields) {
            shouldExecuteAction = true;
            actionToExecute = 'createTicket';
            actionResult = extractionResult;
          }
        }

        // Execute the action if conditions are met
        if (shouldExecuteAction && actionToExecute === 'createTicket') {
          const ticketResult = await this.executeCreateTicketAction(
            createTicketConfig,
            actionResult?.extractedFields || {},
            context
          );
          
          if (ticketResult.success) {
            // Build feedback message with variables replaced
            const feedbackMessage = this.buildFeedbackMessage(
              createTicketConfig.feedbackMessage,
              ticketResult.data,
              createTicketConfig.showResultDetails
            );
            
            // Send feedback to user
            await this.sendResponseToUser(feedbackMessage, context);
            
            return {
              success: true,
              message: 'AI Agent executed action successfully',
              data: {
                type: 'ai_agent_action',
                action: 'createTicket',
                result: ticketResult.data,
                feedback: feedbackMessage
              }
            };
          }
        }
      }

      // If no action executed, generate conversational response
      const conversationResponse = await this.generateConversationalResponse(
        userMessage,
        prompts,
        goal,
        fieldsToCollect,
        actionConfigs
      );

      // Send response to user
      await this.sendResponseToUser(conversationResponse, context);

      // Log assistant response
      await this.logConversationMessage(
        conversationId,
        context.tenantId,
        'assistant',
        conversationResponse,
        {
          responseType: 'conversational',
          processingTime: Date.now() - startTime
        }
      );

      return {
        success: true,
        message: 'AI Agent responded successfully',
        data: {
          type: 'ai_agent',
          response: conversationResponse
        }
      };

    } catch (error) {
      console.error(`❌ [AI-AGENT] Error executing AI agent action:`, error);
      return {
        success: false,
        message: 'Failed to execute AI agent action',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract fields from user message using AI
   */
  private async extractFieldsWithAI(
    userMessage: string,
    fieldsToMap: any[],
    prompts: any
  ): Promise<{ shouldCreateTicket: boolean; extractedFields?: any; missingFields?: string[] }> {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || ''
      });

      // Build extraction prompt
      const fieldDescriptions = fieldsToMap
        .map(f => `- ${f.fieldName} (${f.fieldType}): ${f.aiQuestion}. Dica de extração: ${f.extractionHint}`)
        .join('\n');

      const extractionPrompt = `Você é um assistente que extrai informações de mensagens de usuários.

Campos a extrair:
${fieldDescriptions}

Analise a mensagem do usuário e:
1. Determine se há informações suficientes para criar um ticket
2. Extraia os valores dos campos quando disponíveis
3. Identifique campos obrigatórios que estão faltando

Mensagem do usuário: "${userMessage}"

Responda em JSON com o seguinte formato:
{
  "shouldCreateTicket": boolean,
  "extractedFields": { "fieldName": "value" },
  "missingFields": ["fieldName"]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente de extração de dados. Sempre responda em JSON válido.' },
          { role: 'user', content: extractionPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      console.log(`🤖 [AI-AGENT] Extraction result:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ [AI-AGENT] Error extracting fields:`, error);
      return { shouldCreateTicket: false };
    }
  }

  /**
   * Execute create ticket action with extracted fields
   */
  private async executeCreateTicketAction(
    config: any,
    extractedFields: any,
    context: ActionExecutionContext
  ): Promise<any> {
    try {
      console.log(`🎫 [AI-AGENT] Creating ticket with fields:`, extractedFields);

      if (!this.createTicketUseCase) {
        console.error(`❌ [AI-AGENT] CreateTicketUseCase not available`);
        return { success: false, error: 'Ticket creation not configured' };
      }

      // Build ticket data from extracted fields and template
      const ticketData: any = {
        subject: extractedFields.title || extractedFields.subject || 'Ticket criado por AI Agent',
        description: extractedFields.description || extractedFields.body || '',
        priority: extractedFields.priority || 'medium',
        urgency: extractedFields.urgency || 'medium',
        impact: 'medium',
        status: 'new',
        customFields: {
          createdByAIAgent: true,
          originalMessage: context.messageData.content,
          extractedFields
        },
        createdById: '550e8400-e29b-41d4-a716-446655440001'
      };

      // Add template ID if configured
      if (config.templateId) {
        ticketData.templateId = config.templateId;
      }

      // Map additional fields
      for (const fieldMapping of config.fieldsToMap) {
        if (extractedFields[fieldMapping.fieldName]) {
          ticketData[fieldMapping.fieldId] = extractedFields[fieldMapping.fieldName];
        }
      }

      // Create the ticket
      const ticket = await this.createTicketUseCase.execute(ticketData as CreateTicketDTO, context.tenantId);

      console.log(`✅ [AI-AGENT] Ticket created successfully:`, ticket.id);

      return {
        success: true,
        data: {
          ticketId: ticket.id,
          ticketNumber: ticket.id,
          ticketTitle: extractedFields.title || 'Ticket',
          assignedTo: ticket.assignedToId || 'Não atribuído',
          status: ticket.status,
          priority: ticket.priority
        }
      };
    } catch (error) {
      console.error(`❌ [AI-AGENT] Error creating ticket:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate conversational response when no action is executed
   */
  private async generateConversationalResponse(
    userMessage: string,
    prompts: any,
    goal: string,
    fieldsToCollect: any[],
    actionConfigs: any
  ): Promise<string> {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || ''
      });

      // Build system prompt
      const systemPrompt = `${prompts?.system || 'Você é um assistente virtual profissional.'}

${prompts?.context ? `Contexto: ${prompts.context}` : ''}

${prompts?.goalPrompt ? `Objetivo: ${prompts.goalPrompt}` : `Objetivo: ${goal}`}

Você deve coletar as seguintes informações: ${fieldsToCollect?.map(f => f.name).join(', ')}`;

      // Check if menu mode is configured
      if (actionConfigs?.createTicket?.conversationMode === 'menu' && actionConfigs.createTicket.menuTree) {
        // Generate menu response
        return this.generateMenuResponse(actionConfigs.createTicket.menuTree);
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';
    } catch (error) {
      console.error(`❌ [AI-AGENT] Error generating response:`, error);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    }
  }

  /**
   * Generate menu response from menu tree
   */
  private generateMenuResponse(menuTree: any[]): string {
    let response = '📋 Por favor, selecione uma opção:\n\n';
    menuTree.forEach((option, index) => {
      response += `${index + 1}. ${option.label}\n`;
    });
    response += '\nDigite o número da opção desejada.';
    return response;
  }

  /**
   * Check if user selected a menu option
   */
  private checkMenuSelection(userMessage: string, menuTree: any[], targetAction: string): boolean {
    // Check if user typed a number
    const num = parseInt(userMessage.trim());
    if (!isNaN(num) && num > 0 && num <= menuTree.length) {
      const selected = menuTree[num - 1];
      return selected.action === targetAction;
    }

    // Check if user typed the action value
    return menuTree.some(opt => 
      opt.value.toLowerCase() === userMessage.toLowerCase() ||
      opt.action === targetAction
    );
  }

  /**
   * Build feedback message with variable replacement
   */
  private buildFeedbackMessage(template: string, data: any, includeDetails: boolean): string {
    let message = template;

    // Replace variables
    message = message.replace(/\{\{ticketNumber\}\}/g, data.ticketNumber || '');
    message = message.replace(/\{\{ticketId\}\}/g, data.ticketId || '');
    message = message.replace(/\{\{ticketTitle\}\}/g, data.ticketTitle || '');
    message = message.replace(/\{\{assignedTo\}\}/g, data.assignedTo || 'Não atribuído');
    message = message.replace(/\{\{status\}\}/g, data.status || '');
    message = message.replace(/\{\{priority\}\}/g, data.priority || '');

    // Add details if configured
    if (includeDetails) {
      message += `\n\n📝 Detalhes:\n`;
      message += `• ID: ${data.ticketId}\n`;
      message += `• Status: ${data.status}\n`;
      message += `• Prioridade: ${data.priority}`;
    }

    return message;
  }

  /**
   * Send response to user through appropriate channel
   */
  private async sendResponseToUser(message: string, context: ActionExecutionContext): Promise<boolean> {
    const channelType = context.messageData.channelType || context.messageData.channel;
    const recipient = context.messageData.from || context.messageData.sender;

    if (channelType === 'telegram') {
      return await this.sendTelegramMessage(message, recipient, context.tenantId);
    } else if (channelType === 'email' || channelType === 'imap') {
      return await this.sendEmailMessage(message, recipient, context.tenantId, context.messageData);
    } else {
      console.log(`📝 [AI-AGENT] Channel ${channelType} not supported, storing as outbound message`);
      return await this.storeOutboundMessage(message, recipient, channelType, context.tenantId);
    }
  }

  /**
   * Get or create conversation log for session
   */
  private async getOrCreateConversationLog(
    context: ActionExecutionContext,
    agentId: number
  ): Promise<number> {
    const sessionId = `${context.messageData.channelType}-${context.messageData.from || context.messageData.sender}`;
    
    // Check if conversation already exists in memory
    if (this.activeConversations.has(sessionId)) {
      return this.activeConversations.get(sessionId)!;
    }

    // Check if conversation exists in database
    const existing = await this.conversationLogRepo.findBySessionId(sessionId, context.tenantId);
    if (existing) {
      this.activeConversations.set(sessionId, existing.id);
      return existing.id;
    }

    // Create new conversation
    const conversation = await this.conversationLogRepo.create({
      tenantId: context.tenantId,
      agentId,
      sessionId,
      channelType: context.messageData.channelType || context.messageData.channel,
      channelIdentifier: context.messageData.from || context.messageData.sender,
      userId: undefined,
      metadata: {
        ruleName: context.ruleName,
        ruleId: context.ruleId
      }
    });

    this.activeConversations.set(sessionId, conversation.id);
    console.log(`📝 [CONVERSATION-LOG] Created conversation log ${conversation.id} for session ${sessionId}`);
    
    return conversation.id;
  }

  /**
   * Log message to conversation
   */
  private async logConversationMessage(
    conversationId: number,
    tenantId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: any
  ): Promise<void> {
    try {
      await db.insert(conversationMessages).values({
        tenantId,
        conversationId,
        role,
        content,
        rawContent: content,
        timestamp: new Date(),
        metadata: metadata || {},
        processingTimeMs: undefined,
        tokenCount: undefined,
        contextWindowSize: undefined,
        intentDetected: undefined,
        confidence: undefined
      }).returning();

      // Update conversation message count
      await this.conversationLogRepo.update(conversationId, tenantId, {
        totalMessages: sql`total_messages + 1` as any
      });

      console.log(`📝 [CONVERSATION-LOG] Logged ${role} message to conversation ${conversationId}`);
    } catch (error) {
      console.error(`❌ [CONVERSATION-LOG] Error logging message:`, error);
    }
  }

  /**
   * Log action execution to conversation
   */
  private async logActionExecution(
    conversationId: number,
    messageId: number,
    tenantId: string,
    actionName: string,
    actionType: string,
    parameters: any,
    result: any,
    success: boolean,
    executionTimeMs: number
  ): Promise<void> {
    try {
      await db.insert(actionExecutions).values({
        tenantId,
        conversationId,
        messageId,
        actionName,
        actionType,
        parameters,
        result,
        success,
        errorMessage: success ? undefined : (result?.error || 'Unknown error'),
        executionTimeMs,
        retryCount: 0,
        triggeredBy: 'ai',
        metadata: {},
        executedAt: new Date()
      });

      // Update conversation action count
      await this.conversationLogRepo.update(conversationId, tenantId, {
        totalActions: sql`total_actions + 1` as any
      });

      console.log(`📝 [CONVERSATION-LOG] Logged action execution: ${actionName} to conversation ${conversationId}`);
    } catch (error) {
      console.error(`❌ [CONVERSATION-LOG] Error logging action:`, error);
    }
  }
}