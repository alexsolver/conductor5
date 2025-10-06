replit_final_file>
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { IActionExecutorPort } from '../../domain/ports/IActionExecutorPort';
import { IAIAnalysisPort } from '../../domain/ports/IAIAnalysisPort';
import { AiAgent } from '../../domain/entities/AiAgent';
import { AiConversation, ConversationMessage } from '../../domain/entities/AiConversation';

export interface ConversationResponse {
  message: string;
  requiresInput?: boolean;
  menuOptions?: MenuOption[];
  actionExecuted?: boolean;
  escalated?: boolean;
  conversationComplete?: boolean;
}

export interface MenuOption {
  id: string;
  text: string;
  value: any;
}

export interface MessageContext {
  tenantId: string;
  userId: string;
  channelId: string;
  channelType: string;
  content: string;
  metadata?: any;
}

export class ConversationalAgentEngine {
  constructor(
    private agentRepository: IAiAgentRepository,
    private actionExecutor: IActionExecutorPort,
    private aiService: IAIAnalysisPort
  ) {}

  async processMessage(context: MessageContext): Promise<ConversationResponse> {
    console.log(`🤖 [ConversationalAgent] Processing message from ${context.userId} on ${context.channelType}`);

    try {
      // Encontrar agente adequado para o canal
      const agent = await this.findBestAgent(context.channelType, context.tenantId);
      if (!agent) {
        console.log(`❌ [ConversationalAgent] No agent available for channel: ${context.channelType}`);
        return {
          message: "Desculpe, não temos agentes disponíveis para este canal no momento.",
          conversationComplete: true
        };
      }

      // Verificar se deve escalar imediatamente
      if (agent.shouldEscalate(context.content)) {
        console.log(`📈 [ConversationalAgent] Escalating conversation due to keywords`);
        return await this.escalateConversation(context, agent);
      }

      // Buscar ou criar conversa
      let conversation = await this.agentRepository.findActiveConversation(
        context.userId, 
        context.channelId, 
        context.tenantId
      );

      if (!conversation) {
        conversation = await this.startNewConversation(context, agent);
      }

      // Adicionar mensagem do usuário
      conversation.addMessage('user', context.content, context.metadata);

      // Processar mensagem baseado no estado atual
      const response = await this.processConversationStep(conversation, agent, context);

      // Salvar conversa atualizada
      await this.agentRepository.updateConversation(conversation);

      return response;

    } catch (error) {
      console.error('❌ [ConversationalAgent] Error processing message:', error);
      return {
        message: "Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.",
        conversationComplete: true
      };
    }
  }

  private async findBestAgent(channelType: string, tenantId: string): Promise<AiAgent | null> {
    const agents = await this.agentRepository.findByChannel(channelType, tenantId);

    if (agents.length === 0) return null;

    // Retornar agente com maior prioridade
    return agents.sort((a, b) => b.priority - a.priority)[0];
  }

  private async startNewConversation(context: MessageContext, agent: AiAgent): Promise<AiConversation> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conversation = new AiConversation(
      conversationId,
      context.tenantId,
      agent.id,
      context.userId,
      context.channelId,
      context.channelType
    );

    return await this.agentRepository.createConversation(conversation);
  }

  private async processConversationStep(
    conversation: AiConversation, 
    agent: AiAgent, 
    context: MessageContext
  ): Promise<ConversationResponse> {

    const currentStep = conversation.currentStep;
    console.log(`🔄 [ConversationalAgent] Processing step: ${currentStep}`);

    switch (currentStep) {
      case 'greeting':
        return await this.handleGreeting(conversation, agent, context);

      case 'understanding_intent':
        return await this.handleIntentUnderstanding(conversation, agent, context);

      case 'collecting_parameters':
        return await this.handleParameterCollection(conversation, agent, context);

      case 'confirmation':
        return await this.handleConfirmation(conversation, agent, context);

      case 'executing_action':
        return await this.handleActionExecution(conversation, agent, context);

      default:
        console.warn(`⚠️ [ConversationalAgent] Unknown step: ${currentStep}`);
        return await this.handleFallback(conversation, agent, context);
    }
  }

  private async handleGreeting(
    conversation: AiConversation, 
    agent: AiAgent, 
    context: MessageContext
  ): Promise<ConversationResponse> {

    // Analisar intenção da mensagem
    const analysis = await this.aiService.analyzeMessage({
      content: context.content,
      sender: context.userId,
      channel: context.channelType,
      timestamp: new Date()
    });

    // Determinar se conseguimos identificar uma intenção clara
    if (analysis.intent && this.isActionableIntent(analysis.intent, agent)) {
      conversation.setIntendedAction(analysis.intent);
      conversation.updateStep('collecting_parameters');

      // Gerar resposta baseada na intenção identificada
      const response = await this.generateIntentResponse(analysis.intent, agent);
      conversation.addMessage('assistant', response.message);

      return response;
    } else {
      // Apresentar menu de opções disponíveis
      conversation.updateStep('understanding_intent');
      const menuOptions = this.generateActionMenu(agent);

      const message = `${agent.personality.greeting}\\n\\nComo posso ajudar você hoje?`;
      conversation.addMessage('assistant', message);

      return {
        message,
        requiresInput: true,
        menuOptions
      };
    }
  }

  private async handleIntentUnderstanding(
    conversation: AiConversation, 
    agent: AiAgent, 
    context: MessageContext
  ): Promise<ConversationResponse> {

    const userMessage = context.content.toLowerCase().trim();

    // Verificar se é uma seleção de menu numérica
    if (/^\d+$/.test(userMessage)) {
      const optionIndex = parseInt(userMessage) - 1;
      const availableActions = agent.enabledActions;

      if (optionIndex >= 0 && optionIndex < availableActions.length) {
        const selectedAction = availableActions[optionIndex];
        conversation.setIntendedAction(selectedAction);
        conversation.updateStep('collecting_parameters');

        const response = await this.generateIntentResponse(selectedAction, agent);
        conversation.addMessage('assistant', response.message);

        return response;
      }
    }

    // Tentar entender a intenção por IA
    const analysis = await this.aiService.analyzeMessage({
      content: context.content,
      sender: context.userId,
      channel: context.channelType,
      timestamp: new Date()
    });

    if (analysis.intent && this.isActionableIntent(analysis.intent, agent)) {
      conversation.setIntendedAction(analysis.intent);
      conversation.updateStep('collecting_parameters');

      const response = await this.generateIntentResponse(analysis.intent, agent);
      conversation.addMessage('assistant', response.message);

      return response;
    }

    // Fallback - reapresentar menu
    const menuOptions = this.generateActionMenu(agent);
    const message = `${agent.personality.fallbackMessage}\\n\\nEscolha uma das opções abaixo ou descreva como posso ajudar:`;
    conversation.addMessage('assistant', message);

    return {
      message,
      requiresInput: true,
      menuOptions
    };
  }

  private async handleParameterCollection(
    conversation: AiConversation, 
    agent: AiAgent, 
    context: MessageContext
  ): Promise<ConversationResponse> {

    if (!conversation.intendedAction) {
      conversation.updateStep('understanding_intent');
      return await this.handleIntentUnderstanding(conversation, agent, context);
    }

    // Extrair parâmetros da mensagem usando IA
    const extractedParams = await this.extractParameters(
      context.content, 
      conversation.intendedAction, 
      agent
    );

    // Atualizar parâmetros da conversa
    conversation.setIntendedAction(conversation.intendedAction, {
      ...conversation.actionParams,
      ...extractedParams
    });

    // Verificar se todos parâmetros necessários foram coletados
    const requiredParams = this.getRequiredParameters(conversation.intendedAction);
    const missingParams = conversation.getMissingParams(requiredParams);

    if (missingParams.length > 0) {
      // Solicitar parâmetros faltantes
      const question = this.generateParameterQuestion(missingParams[0], agent);
      conversation.addMessage('assistant', question);

      return {
        message: question,
        requiresInput: true
      };
    } else {
      // Todos parâmetros coletados, ir para confirmação
      conversation.updateStep('confirmation');
      const confirmationMessage = this.generateConfirmationMessage(conversation, agent);
      conversation.addMessage('assistant', confirmationMessage);

      return {
        message: confirmationMessage,
        requiresInput: true,
        menuOptions: [
          { id: 'confirm', text: 'Sim, confirmar', value: 'confirm' },
          { id: 'cancel', text: 'Não, cancelar', value: 'cancel' },
          { id: 'edit', text: 'Alterar informações', value: 'edit' }
        ]
      };
    }
  }

  private async handleConfirmation(
    conversation: AiConversation, 
    agent: AiAgent, 
    context: MessageContext
  ): Promise<ConversationResponse> {

    const userResponse = context.content.toLowerCase().trim();

    if (userResponse.includes('sim') || userResponse.includes('confirmar') || userResponse === '1') {
      conversation.updateStep('executing_action');
      return await this.handleActionExecution(conversation, agent, context);
    } else if (userResponse.includes('não') || userResponse.includes('cancelar') || userResponse === '2') {
      conversation.updateStatus('completed');
      const message = "Operação cancelada. Posso ajudar com mais alguma coisa?";
      conversation.addMessage('assistant', message);

      return {
        message,
        conversationComplete: true
      };
    } else if (userResponse.includes('alterar') || userResponse.includes('editar') || userResponse === '3') {
      conversation.updateStep('collecting_parameters');
      conversation.setIntendedAction(conversation.intendedAction!, {}); // Limpar parâmetros

      const message = "Vamos recomeçar. Qual informação você gostaria de fornecer?";
      conversation.addMessage('assistant', message);

      return {
        message,
        requiresInput: true
      };
    }

    // Resposta não reconhecida
    const message = "Por favor, confirme com 'Sim' ou 'Não', ou escolha uma das opções:";
    conversation.addMessage('assistant', message);

    return {
      message,
      requiresInput: true,
      menuOptions: [
        { id: 'confirm', text: 'Sim, confirmar', value: 'confirm' },
        { id: 'cancel', text: 'Não, cancelar', value: 'cancel' },
        { id: 'edit', text: 'Alterar informações', value: 'edit' }
      ]
    };
  }

  private async handleActionExecution(
    conversation: AiConversation, 
    agent: AiAgent, 
    context: MessageContext
  ): Promise<ConversationResponse> {

    if (!conversation.intendedAction) {
      throw new Error('No intended action found for execution');
    }

    try {
      const ticketId = context.metadata?.ticketId;
      console.log(`🚀 [ConversationalAgent] Executing action: ${conversation.intendedAction}`);
      console.log(`🎫 [ConversationalAgent] TicketId from context:`, ticketId);
      console.log(`📦 [ConversationalAgent] Full context.metadata:`, JSON.stringify(context.metadata));

      // Executar ação através do ActionExecutor existente
      const actionResult = await this.actionExecutor.execute(
        {
          id: `action_${Date.now()}`,
          type: conversation.intendedAction as any,
          params: conversation.actionParams,
          config: {
            ...conversation.actionParams,
            ticketId: ticketId
          },
          priority: 1
        },
        {
          tenantId: conversation.tenantId,
          messageData: {
            content: context.content,
            sender: context.userId,
            channel: context.channelType,
            timestamp: new Date(),
            metadata: context.metadata
          },
          ruleId: agent.id,
          ruleName: agent.name
        }
      );

      // Atualizar estatísticas do agente
      agent.updateStats(true, actionResult.success, Date.now() - conversation.lastMessageAt.getTime());
      await this.agentRepository.update(agent);

      conversation.updateStatus('completed');

      let responseMessage: string;
      if (actionResult.success) {
        responseMessage = actionResult.message || "Ação executada com sucesso! Posso ajudar com mais alguma coisa?";
      } else {
        responseMessage = `Ocorreu um erro ao executar a ação: ${actionResult.error || 'Erro desconhecido'}. Posso tentar novamente?`;
      }

      conversation.addMessage('assistant', responseMessage);

      return {
        message: responseMessage,
        actionExecuted: actionResult.success,
        conversationComplete: true
      };

    } catch (error) {
      console.error('❌ [ConversationalAgent] Error executing action:', error);

      const errorMessage = "Desculpe, ocorreu um erro ao executar a ação. Posso ajudar com outra coisa?";
      conversation.addMessage('assistant', errorMessage);
      conversation.updateStatus('completed');

      return {
        message: errorMessage,
        actionExecuted: false,
        conversationComplete: true
      };
    }
  }

  private async handleFallback(
    conversation: AiConversation, 
    agent: AiAgent, 
    context: MessageContext
  ): Promise<ConversationResponse> {

    const message = `${agent.personality.fallbackMessage}\\n\\nVamos começar novamente. Como posso ajudar você?`;
    conversation.addMessage('assistant', message);
    conversation.updateStep('understanding_intent');

    const menuOptions = this.generateActionMenu(agent);

    return {
      message,
      requiresInput: true,
      menuOptions
    };
  }

  private async escalateConversation(context: MessageContext, agent: AiAgent): Promise<ConversationResponse> {
    // TODO: Implementar lógica de escalação para humanos
    const message = "Entendo que você precisa falar com um atendente humano. Vou transferir sua solicitação para nossa equipe de suporte.";

    return {
      message,
      escalated: true,
      conversationComplete: true
    };
  }

  // Helper methods
  private isActionableIntent(intent: string, agent: AiAgent): boolean {
    return agent.enabledActions.some(action => 
      intent.toLowerCase().includes(action.toLowerCase()) ||
      action.toLowerCase().includes(intent.toLowerCase())
    );
  }

  private generateActionMenu(agent: AiAgent): MenuOption[] {
    return agent.enabledActions.map((action, index) => ({
      id: action,
      text: `${index + 1}. ${this.getActionDisplayName(action)}`,
      value: action
    }));
  }

  private getActionDisplayName(actionType: string): string {
    const displayNames: Record<string, string> = {
      'send_notification': 'Enviar notificação',
      'create_ticket': 'Criar ticket',
      'send_auto_reply': 'Resposta automática',
      'forward_message': 'Encaminhar mensagem',
      'assign_agent': 'Atribuir agente',
      'add_tags': 'Adicionar tags',
      'escalate': 'Escalar atendimento'
    };

    return displayNames[actionType] || actionType.replace('_', ' ');
  }

  private async generateIntentResponse(actionType: string, agent: AiAgent): Promise<ConversationResponse> {
    const actionName = this.getActionDisplayName(actionType);
    const message = `Perfeito! Vou ajudar você com: ${actionName}. Preciso de algumas informações para prosseguir.`;

    return { message, requiresInput: true };
  }

  private async extractParameters(
    content: string, 
    actionType: string, 
    agent: AiAgent
  ): Promise<Record<string, any>> {
    console.log(`🔍 [ConversationalAgent] Extracting parameters for action: ${actionType} from: "${content}"`);

    const params: Record<string, any> = {};
    const lowerContent = content.toLowerCase();

    // ✅ ANTI-LOOP: Extrair informações baseadas no tipo de ação com validação mais robusta
    switch (actionType) {
      case 'create_ticket':
        // Extrair descrição do problema
        if (lowerContent.includes('problema') || lowerContent.includes('erro') || lowerContent.includes('defeito')) {
          params.description = content;
        }
        // Extrair prioridade
        if (lowerContent.includes('urgente') || lowerContent.includes('crítico')) {
          params.priority = 'high';
        } else if (lowerContent.includes('baixa') || lowerContent.includes('simples')) {
          params.priority = 'low';
        } else {
          params.priority = 'medium';
        }
        // Extrair categoria se mencionada
        if (lowerContent.includes('técnico') || lowerContent.includes('sistema')) {
          params.category = 'technical';
        }
        break;

      case 'send_notification':
        // Extrair email com regex mais robusta
        const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          params.email = emailMatch[0];
        }
        // Extrair assunto se mencionado
        if (lowerContent.includes('assunto:') || lowerContent.includes('sobre:')) {
          const subjectMatch = content.match(/(?:assunto:|sobre:)\s*(.+)/i);
          if (subjectMatch) {
            params.subject = subjectMatch[1].trim();
          }
        }
        break;

      case 'schedule_meeting':
        // Extrair data/hora
        const dateMatch = content.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (dateMatch) {
          params.date = dateMatch[1];
        }
        // Extrair horário
        const timeMatch = content.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          params.time = `${timeMatch[1]}:${timeMatch[2]}`;
        }
        break;

      default:
        console.log(`⚠️ [ConversationalAgent] Unknown action type for parameter extraction: ${actionType}`);
        // Para ações desconhecidas, tentar extrair informações básicas
        if (content.trim().length > 5) {
          params.content = content.trim();
        }
        break;
    }

    console.log(`🔍 [ConversationalAgent] Extracted parameters:`, params);
    return params;
  }

  // ✅ ANTI-LOOP: Melhorar geração de perguntas com contexto do que já foi coletado
  private generateParameterQuestion(missingParam: string, agent: AiAgent): string {
    const questionMap: Record<string, string> = {
      'email': 'Por favor, informe seu endereço de e-mail para que eu possa prosseguir.',
      'title': 'Qual seria o título ou assunto para esta solicitação?',
      'description': 'Poderia descrever melhor sua solicitação ou problema?',
      'priority': 'Qual a prioridade desta solicitação? (alta, média ou baixa)',
      'category': 'Em qual categoria esta solicitação se encaixa?',
      'name': 'Por favor, informe seu nome completo.',
      'phone': 'Poderia informar seu número de telefone?',
      'subject': 'Qual seria o assunto desta notificação?',
      'message': 'Qual a mensagem que gostaria de enviar?',
      'recipient': 'Para quem gostaria de enviar esta mensagem?'
    };

    return questionMap[missingParam] || `Por favor, informe o valor para ${missingParam}.`;
  }

  // ✅ ANTI-LOOP: Melhorar geração de mensagem de confirmação
  private generateConfirmationMessage(conversation: AiConversation, agent: AiAgent): string {
    const action = conversation.intendedAction;
    const params = conversation.actionParams;

    let message = "Vou confirmar os dados coletados:\n\n";

    switch (action) {
      case 'send_notification':
        message += `📧 Enviar notificação para: ${params.email}\n`;
        if (params.subject) message += `📋 Assunto: ${params.subject}\n`;
        if (params.message) message += `💬 Mensagem: ${params.message}\n`;
        break;

      case 'create_ticket':
        if (params.title) message += `🎫 Título: ${params.title}\n`;
        if (params.description) message += `📝 Descrição: ${params.description}\n`;
        if (params.priority) message += `⚡ Prioridade: ${params.priority}\n`;
        break;

      default:
        message += `Ação: ${action}\n`;
        Object.entries(params).forEach(([key, value]) => {
          if (key !== '_attemptCount' && value) {
            message += `${key}: ${value}\n`;
          }
        });
        break;
    }

    message += "\nEstá correto? Posso prosseguir?";
    return message;
  }
}
</replit_final_file>