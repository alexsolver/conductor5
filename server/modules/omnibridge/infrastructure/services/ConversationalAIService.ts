
import { ConversationalAI, ConversationFlow, ConversationSession, ConversationStep } from '../../domain/entities/ConversationalAI';
import { ActionExecutor } from './ActionExecutor';
import { AIAnalysisService } from './AIAnalysisService';

export class ConversationalAIService {
  private sessions: Map<string, ConversationSession> = new Map();
  private flows: Map<string, ConversationFlow> = new Map();

  constructor(
    private actionExecutor: ActionExecutor,
    private aiService: AIAnalysisService
  ) {
    this.initializeDefaultFlows();
  }

  private initializeDefaultFlows(): void {
    // Fluxo para criação de ticket
    const createTicketFlow: ConversationFlow = {
      id: 'create-ticket-flow',
      name: 'Criar Ticket',
      description: 'Fluxo conversacional para criação de tickets',
      tenantId: 'default',
      triggerKeywords: ['criar ticket', 'novo ticket', 'abrir chamado', 'problema', 'suporte'],
      steps: [
        {
          id: 'step-1',
          type: 'menu',
          prompt: 'Olá! Vou te ajudar a criar um ticket. Qual tipo de problema você está enfrentando?',
          options: [
            { id: 'technical', label: 'Problema técnico', value: 'technical', nextStepId: 'step-2' },
            { id: 'billing', label: 'Questão financeira', value: 'billing', nextStepId: 'step-2' },
            { id: 'general', label: 'Dúvida geral', value: 'general', nextStepId: 'step-2' },
            { id: 'urgent', label: 'Problema urgente', value: 'urgent', nextStepId: 'step-2' }
          ]
        },
        {
          id: 'step-2',
          type: 'text_input',
          prompt: 'Descreva detalhadamente o problema ou sua solicitação:',
          inputType: 'text',
          validation: { required: true, minLength: 10, maxLength: 500 },
          nextStepId: 'step-3'
        },
        {
          id: 'step-3',
          type: 'menu',
          prompt: 'Qual é a prioridade deste ticket?',
          options: [
            { id: 'low', label: 'Baixa - Não urgente', value: 'low', nextStepId: 'step-4' },
            { id: 'medium', label: 'Média - Moderada', value: 'medium', nextStepId: 'step-4' },
            { id: 'high', label: 'Alta - Urgente', value: 'high', nextStepId: 'step-4' },
            { id: 'critical', label: 'Crítica - Emergência', value: 'critical', nextStepId: 'step-4' }
          ]
        },
        {
          id: 'step-4',
          type: 'confirmation',
          prompt: 'Confirma a criação do ticket com as informações fornecidas?',
          nextStepId: 'step-5'
        },
        {
          id: 'step-5',
          type: 'action_execution',
          prompt: 'Executando ação...',
          actionConfig: {
            type: 'create_ticket',
            parameters: {}
          }
        }
      ],
      dataSchema: {
        category: 'string',
        description: 'string', 
        priority: 'string',
        confirmed: 'boolean'
      },
      finalActions: [
        {
          type: 'create_ticket',
          parameters: {
            subject: 'Ticket criado via IA Conversacional',
            description: '{{description}}',
            priority: '{{priority}}',
            category: '{{category}}'
          }
        },
        {
          type: 'send_auto_reply',
          parameters: {
            message: 'Ticket criado com sucesso! Você receberá atualizações por email.'
          }
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Fluxo para agendamento
    const scheduleFlow: ConversationFlow = {
      id: 'schedule-flow',
      name: 'Agendar Atendimento',
      description: 'Fluxo para agendamento de atendimento',
      tenantId: 'default',
      triggerKeywords: ['agendar', 'marcar horário', 'agendamento', 'visita técnica'],
      steps: [
        {
          id: 'step-1',
          type: 'menu',
          prompt: 'Vou te ajudar a agendar um atendimento. Que tipo de serviço você precisa?',
          options: [
            { id: 'technical', label: 'Visita técnica', value: 'technical', nextStepId: 'step-2' },
            { id: 'maintenance', label: 'Manutenção preventiva', value: 'maintenance', nextStepId: 'step-2' },
            { id: 'installation', label: 'Instalação', value: 'installation', nextStepId: 'step-2' },
            { id: 'consultation', label: 'Consultoria', value: 'consultation', nextStepId: 'step-2' }
          ]
        },
        {
          id: 'step-2',
          type: 'text_input',
          prompt: 'Qual é o seu endereço completo para o atendimento?',
          inputType: 'text',
          validation: { required: true, minLength: 10 },
          nextStepId: 'step-3'
        },
        {
          id: 'step-3',
          type: 'text_input',
          prompt: 'Digite sua data preferida (formato: DD/MM/AAAA):',
          inputType: 'date',
          validation: { required: true, pattern: '^\\d{2}/\\d{2}/\\d{4}$' },
          nextStepId: 'step-4'
        },
        {
          id: 'step-4',
          type: 'menu',
          prompt: 'Qual período você prefere?',
          options: [
            { id: 'morning', label: 'Manhã (8h às 12h)', value: 'morning', nextStepId: 'step-5' },
            { id: 'afternoon', label: 'Tarde (13h às 17h)', value: 'afternoon', nextStepId: 'step-5' },
            { id: 'evening', label: 'Noite (18h às 20h)', value: 'evening', nextStepId: 'step-5' }
          ]
        },
        {
          id: 'step-5',
          type: 'confirmation',
          prompt: 'Confirma o agendamento com essas informações?',
          nextStepId: 'step-6'
        },
        {
          id: 'step-6',
          type: 'action_execution',
          prompt: 'Processando agendamento...',
          actionConfig: {
            type: 'create_schedule',
            parameters: {}
          }
        }
      ],
      dataSchema: {
        serviceType: 'string',
        address: 'string',
        preferredDate: 'string',
        timeSlot: 'string',
        confirmed: 'boolean'
      },
      finalActions: [
        {
          type: 'create_ticket',
          parameters: {
            subject: 'Agendamento - {{serviceType}}',
            description: 'Solicitação de agendamento:\nServiço: {{serviceType}}\nEndereço: {{address}}\nData: {{preferredDate}}\nPeríodo: {{timeSlot}}',
            priority: 'medium',
            category: 'Agendamento'
          }
        },
        {
          type: 'send_notification',
          parameters: {
            recipients: ['scheduling@empresa.com'],
            message: 'Nova solicitação de agendamento recebida via IA Conversacional'
          }
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.flows.set(createTicketFlow.id, createTicketFlow);
    this.flows.set(scheduleFlow.id, scheduleFlow);
  }

  public async processMessage(messageData: any, tenantId: string): Promise<string> {
    const sessionKey = `${tenantId}-${messageData.sender}-${messageData.channel}`;
    let session = this.sessions.get(sessionKey);

    // Se não há sessão ativa, tenta iniciar uma nova
    if (!session) {
      const flow = this.findFlowForMessage(messageData.content);
      if (!flow) {
        return this.generateHelpMessage();
      }

      session = this.createSession(flow, messageData, tenantId);
      this.sessions.set(sessionKey, session);
    }

    // Processa a entrada do usuário
    return await this.processUserInput(session, messageData.content);
  }

  private findFlowForMessage(message: string): ConversationFlow | null {
    const lowerMessage = message.toLowerCase();
    
    for (const flow of this.flows.values()) {
      if (!flow.enabled) continue;
      
      const hasKeyword = flow.triggerKeywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        return flow;
      }
    }
    
    return null;
  }

  private createSession(flow: ConversationFlow, messageData: any, tenantId: string): ConversationSession {
    return {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      flowId: flow.id,
      tenantId,
      channel: messageData.channel,
      sender: messageData.sender,
      currentStepId: flow.steps[0].id,
      collectedData: {},
      status: 'active',
      startedAt: new Date(),
      lastInteractionAt: new Date()
    };
  }

  private async processUserInput(session: ConversationSession, input: string): Promise<string> {
    const flow = this.flows.get(session.flowId);
    if (!flow) {
      return 'Erro: Fluxo não encontrado.';
    }

    const currentStep = flow.steps.find(step => step.id === session.currentStepId);
    if (!currentStep) {
      return 'Erro: Etapa não encontrada.';
    }

    // Primeira interação - mostra o menu/prompt inicial
    if (Object.keys(session.collectedData).length === 0 && currentStep.type === 'menu') {
      session.lastInteractionAt = new Date();
      return this.generateStepResponse(currentStep);
    }

    // Processa a entrada do usuário
    const processResult = await this.processStepInput(currentStep, input, session);
    
    if (!processResult.valid) {
      return processResult.error + '\n\n' + this.generateStepResponse(currentStep);
    }

    // Avança para próxima etapa
    const nextStepId = this.getNextStepId(currentStep, processResult.value);
    if (!nextStepId) {
      // Fluxo concluído - executa ações finais
      return await this.executeActions(flow, session);
    }

    const nextStep = flow.steps.find(step => step.id === nextStepId);
    if (!nextStep) {
      return 'Erro: Próxima etapa não encontrada.';
    }

    session.currentStepId = nextStepId;
    session.lastInteractionAt = new Date();

    // Se é ação, executa imediatamente
    if (nextStep.type === 'action_execution') {
      return await this.executeActions(flow, session);
    }

    return this.generateStepResponse(nextStep);
  }

  private async processStepInput(step: ConversationStep, input: string, session: ConversationSession): Promise<{ valid: boolean; value?: any; error?: string }> {
    const trimmedInput = input.trim();

    if (step.type === 'menu') {
      const optionIndex = parseInt(trimmedInput) - 1;
      if (isNaN(optionIndex) || !step.options || optionIndex < 0 || optionIndex >= step.options.length) {
        return { valid: false, error: 'Opção inválida. Por favor, digite um número válido.' };
      }
      
      const selectedOption = step.options[optionIndex];
      session.collectedData[step.id] = selectedOption.value;
      return { valid: true, value: selectedOption.value };
    }

    if (step.type === 'text_input') {
      const validation = this.validateInput(step, trimmedInput);
      if (!validation.valid) {
        return { valid: false, error: validation.error };
      }
      
      session.collectedData[step.id] = trimmedInput;
      return { valid: true, value: trimmedInput };
    }

    if (step.type === 'confirmation') {
      const confirmed = trimmedInput === '1' || trimmedInput.toLowerCase() === 'sim';
      const cancelled = trimmedInput === '2' || trimmedInput.toLowerCase() === 'não';
      
      if (!confirmed && !cancelled) {
        return { valid: false, error: 'Resposta inválida. Digite 1 para Sim ou 2 para Não.' };
      }
      
      session.collectedData[step.id] = confirmed;
      return { valid: true, value: confirmed };
    }

    return { valid: true, value: trimmedInput };
  }

  private validateInput(step: ConversationStep, input: string): { valid: boolean; error?: string } {
    if (!step.validation) return { valid: true };

    if (step.validation.required && (!input || input.trim() === '')) {
      return { valid: false, error: 'Este campo é obrigatório.' };
    }

    if (step.validation.minLength && input.length < step.validation.minLength) {
      return { valid: false, error: `Mínimo de ${step.validation.minLength} caracteres.` };
    }

    if (step.validation.maxLength && input.length > step.validation.maxLength) {
      return { valid: false, error: `Máximo de ${step.validation.maxLength} caracteres.` };
    }

    if (step.validation.pattern) {
      const regex = new RegExp(step.validation.pattern);
      if (!regex.test(input)) {
        return { valid: false, error: 'Formato inválido.' };
      }
    }

    return { valid: true };
  }

  private getNextStepId(currentStep: ConversationStep, value: any): string | null {
    if (currentStep.type === 'menu' && currentStep.options) {
      const selectedOption = currentStep.options.find(opt => opt.value === value);
      return selectedOption?.nextStepId || currentStep.nextStepId || null;
    }
    
    return currentStep.nextStepId || null;
  }

  private generateStepResponse(step: ConversationStep): string {
    let response = step.prompt + '\n\n';
    
    if (step.type === 'menu' && step.options) {
      step.options.forEach((option, index) => {
        response += `${index + 1}. ${option.label}\n`;
      });
      response += '\n💬 Digite o número da opção desejada.';
    } else if (step.type === 'text_input') {
      response += '✍️ Por favor, digite sua resposta:';
    } else if (step.type === 'confirmation') {
      response += '1. ✅ Sim\n2. ❌ Não\n\n💬 Digite 1 para confirmar ou 2 para cancelar.';
    }
    
    return response;
  }

  private async executeActions(flow: ConversationFlow, session: ConversationSession): Promise<string> {
    try {
      console.log(`🤖 [ConversationalAI] Executing actions for flow: ${flow.name}`);
      
      const context = {
        tenantId: session.tenantId,
        messageData: {
          sender: session.sender,
          channel: session.channel,
          content: JSON.stringify(session.collectedData),
          timestamp: new Date().toISOString()
        },
        ruleId: `conversational-ai-${flow.id}`,
        ruleName: flow.name
      };

      let executionResults = [];
      
      for (const action of flow.finalActions) {
        const processedAction = this.processActionParameters(action, session.collectedData);
        
        const result = await this.actionExecutor.execute(processedAction as any, context);
        executionResults.push(result);
        
        console.log(`✅ [ConversationalAI] Action ${action.type} executed:`, result.success);
      }
      
      session.status = 'completed';
      session.completedAt = new Date();
      
      // Remove session after completion
      const sessionKey = `${session.tenantId}-${session.sender}-${session.channel}`;
      this.sessions.delete(sessionKey);
      
      return '✅ Processo concluído com sucesso! Todas as ações foram executadas.';
      
    } catch (error) {
      console.error(`❌ [ConversationalAI] Error executing actions:`, error);
      session.status = 'error';
      return '❌ Erro ao executar as ações. Por favor, tente novamente ou entre em contato com o suporte.';
    }
  }

  private processActionParameters(action: any, collectedData: Record<string, any>): any {
    const processedAction = { ...action };
    
    // Replace template variables in parameters
    const paramStr = JSON.stringify(processedAction.parameters);
    const processedParamStr = paramStr.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return collectedData[`step-${this.getStepNumberForData(key)}`] || collectedData[key] || match;
    });
    
    processedAction.parameters = JSON.parse(processedParamStr);
    return processedAction;
  }

  private getStepNumberForData(dataKey: string): number {
    // Map data keys to step numbers based on common patterns
    const keyMap: Record<string, number> = {
      'category': 1,
      'description': 2,
      'priority': 3,
      'serviceType': 1,
      'address': 2,
      'preferredDate': 3,
      'timeSlot': 4
    };
    
    return keyMap[dataKey] || 1;
  }

  private generateHelpMessage(): string {
    const availableFlows = Array.from(this.flows.values()).filter(f => f.enabled);
    
    let help = '🤖 **Assistente Virtual** - Como posso te ajudar?\n\n';
    help += 'Comandos disponíveis:\n\n';
    
    availableFlows.forEach(flow => {
      help += `• **${flow.name}**: ${flow.description}\n`;
      help += `  Palavras-chave: ${flow.triggerKeywords.join(', ')}\n\n`;
    });
    
    help += '💡 Digite uma das palavras-chave para iniciar um processo automatizado!';
    
    return help;
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  public getFlowsCount(): number {
    return this.flows.size;
  }
}
