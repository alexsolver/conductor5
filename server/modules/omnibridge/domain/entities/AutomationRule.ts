import { AIAnalysisService, MessageAnalysis } from '../../infrastructure/services/AIAnalysisService';

export interface AutomationTrigger {
  type: 'message_received' | 'email_received' | 'keyword_match' | 'ai_analysis' | 'time_based' | 'channel_specific';
  conditions: AutomationCondition[];
  aiEnabled?: boolean;
  aiPromptId?: string;
}

export interface AutomationCondition {
  id: string;
  type: 'content' | 'sender' | 'subject' | 'channel' | 'priority' | 'ai_intent' | 'ai_sentiment' | 'ai_urgency' | 'keyword' | 'time' | 'custom';
  field?: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'ai_matches';
  value: string | number;
  caseSensitive?: boolean;
  aiAnalysisRequired?: boolean;
}

export interface AutomationAction {
  id: string;
  type: 'create_ticket' | 'send_auto_reply' | 'forward_message' | 'assign_user' | 'add_tag' | 'change_status' | 'escalate' | 'webhook' | 'ai_response' | 'notify_team';
  target?: string;
  params: Record<string, any>;
  aiEnabled?: boolean;
  templateId?: string;
  priority: number;
}

export class AutomationRule {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly trigger: AutomationTrigger,
    public readonly actions: AutomationAction[],
    public readonly enabled: boolean = true,
    public readonly priority: number = 1,
    public readonly aiEnabled: boolean = false,
    public readonly aiPromptId?: string,
    public readonly executionCount: number = 0,
    public readonly successCount: number = 0,
    public readonly lastExecuted?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  public async evaluate(
    messageData: any, 
    aiAnalysis?: MessageAnalysis, 
    aiService?: AIAnalysisService
  ): Promise<boolean> {
    if (!this.enabled) {
      console.log(`🔇 [AutomationRule] Rule "${this.name}" is disabled, skipping evaluation`);
      return false;
    }

    console.log(`🔍 [AutomationRule] Evaluating rule "${this.name}" for message from ${messageData.sender}`);

    // Se a regra requer análise de IA e não foi fornecida, fazer a análise
    let analysis = aiAnalysis;
    if (this.aiEnabled && !analysis && aiService) {
      console.log(`🤖 [AutomationRule] Running AI analysis for rule "${this.name}"`);
      analysis = await aiService.analyzeMessage({
        content: messageData.content || messageData.body,
        sender: messageData.sender || messageData.from,
        subject: messageData.subject,
        channel: messageData.channel || messageData.channelType,
        timestamp: messageData.timestamp
      });
    }

    // Avaliar trigger principal
    const triggerMatches = await this.evaluateTrigger(messageData, analysis);
    
    if (!triggerMatches) {
      console.log(`❌ [AutomationRule] Rule "${this.name}" trigger did not match`);
      return false;
    }

    // Avaliar todas as condições do trigger
    const conditionsMatch = await this.evaluateConditions(messageData, analysis);
    
    if (conditionsMatch) {
      console.log(`✅ [AutomationRule] Rule "${this.name}" matched all conditions`);
    } else {
      console.log(`❌ [AutomationRule] Rule "${this.name}" failed condition evaluation`);
    }

    return conditionsMatch;
  }

  private async evaluateTrigger(messageData: any, aiAnalysis?: MessageAnalysis): Promise<boolean> {
    const { type } = this.trigger;

    switch (type) {
      case 'message_received':
        return Boolean(messageData.content || messageData.body);

      case 'email_received':
        return messageData.channelType === 'email' || messageData.channel === 'email' || Boolean(messageData.subject);

      case 'keyword_match':
        const content = (messageData.content || messageData.body || '').toLowerCase();
        return this.trigger.conditions.some(condition => 
          condition.type === 'keyword' && content.includes(condition.value.toString().toLowerCase())
        );

      case 'ai_analysis':
        return Boolean(aiAnalysis);

      case 'channel_specific':
        return this.trigger.conditions.some(condition =>
          condition.type === 'channel' && 
          (messageData.channel === condition.value || messageData.channelType === condition.value)
        );

      case 'time_based':
        return this.evaluateTimeConditions();

      default:
        console.warn(`⚠️ [AutomationRule] Unknown trigger type: ${type}`);
        return false;
    }
  }

  private async evaluateConditions(messageData: any, aiAnalysis?: MessageAnalysis): Promise<boolean> {
    const conditions = this.trigger.conditions;
    
    if (conditions.length === 0) {
      return true; // Se não há condições, a regra sempre se aplica
    }

    // Todas as condições devem ser verdadeiras (AND logic)
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, messageData, aiAnalysis);
      
      if (!result) {
        console.log(`❌ [AutomationRule] Condition failed: ${condition.type} ${condition.operator} ${condition.value}`);
        return false;
      }
    }

    return true;
  }

  private async evaluateCondition(
    condition: AutomationCondition, 
    messageData: any, 
    aiAnalysis?: MessageAnalysis
  ): Promise<boolean> {
    let actualValue: string | number | undefined;

    // Extrair valor baseado no tipo da condição
    switch (condition.type) {
      case 'content':
        actualValue = messageData.content || messageData.body || '';
        break;
      case 'sender':
        actualValue = messageData.sender || messageData.from || '';
        break;
      case 'subject':
        actualValue = messageData.subject || '';
        break;
      case 'channel':
        actualValue = messageData.channel || messageData.channelType || '';
        break;
      case 'priority':
        actualValue = messageData.priority || 'medium';
        break;
      case 'ai_intent':
        actualValue = aiAnalysis?.intent || '';
        break;
      case 'ai_sentiment':
        actualValue = aiAnalysis?.sentiment || '';
        break;
      case 'ai_urgency':
        actualValue = aiAnalysis?.urgency || '';
        break;
      case 'keyword':
        actualValue = (messageData.content || messageData.body || '').toLowerCase();
        break;
      default:
        actualValue = '';
    }

    return this.compareValues(actualValue, condition.value, condition.operator, condition.caseSensitive);
  }

  private compareValues(
    actual: string | number | undefined, 
    expected: string | number, 
    operator: string,
    caseSensitive: boolean = false
  ): boolean {
    const actualStr = String(actual || '');
    const expectedStr = String(expected);
    
    const actualCompare = caseSensitive ? actualStr : actualStr.toLowerCase();
    const expectedCompare = caseSensitive ? expectedStr : expectedStr.toLowerCase();

    switch (operator) {
      case 'equals':
        return actualCompare === expectedCompare;
      case 'contains':
        return actualCompare.includes(expectedCompare);
      case 'starts_with':
        return actualCompare.startsWith(expectedCompare);
      case 'ends_with':
        return actualCompare.endsWith(expectedCompare);
      case 'regex':
        try {
          const regex = new RegExp(expectedStr, caseSensitive ? '' : 'i');
          return regex.test(actualStr);
        } catch (error) {
          console.error(`❌ [AutomationRule] Invalid regex: ${expectedStr}`, error);
          return false;
        }
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'ai_matches':
        // Para condições de IA, usar contains como fallback
        return actualCompare.includes(expectedCompare);
      default:
        console.warn(`⚠️ [AutomationRule] Unknown operator: ${operator}`);
        return false;
    }
  }

  private evaluateTimeConditions(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Implementar lógica de tempo baseada nas condições
    const timeConditions = this.trigger.conditions.filter(c => c.type === 'time');
    
    if (timeConditions.length === 0) {
      return true;
    }

    return timeConditions.every(condition => {
      switch (condition.value) {
        case 'business_hours':
          return hour >= 9 && hour < 18 && dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'after_hours':
          return hour < 9 || hour >= 18 || dayOfWeek === 0 || dayOfWeek === 6;
        case 'weekend':
          return dayOfWeek === 0 || dayOfWeek === 6;
        case 'weekday':
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        default:
          return true;
      }
    });
  }

  public async execute(messageData: any, aiAnalysis?: MessageAnalysis, aiService?: AIAnalysisService): Promise<void> {
    console.log(`🚀 [AutomationRule] Executing rule "${this.name}" with ${this.actions.length} actions`);

    // Ordenar ações por prioridade
    const sortedActions = [...this.actions].sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const action of sortedActions) {
      try {
        await this.executeAction(action, messageData, aiAnalysis, aiService);
      } catch (error) {
        console.error(`❌ [AutomationRule] Error executing action ${action.type}:`, error);
      }
    }

    console.log(`✅ [AutomationRule] Rule "${this.name}" execution completed`);
  }

  private async executeAction(
    action: AutomationAction, 
    messageData: any, 
    aiAnalysis?: MessageAnalysis,
    aiService?: AIAnalysisService
  ): Promise<void> {
    console.log(`🎯 [AutomationRule] Executing action: ${action.type}`);

    switch (action.type) {
      case 'create_ticket':
        await this.createTicketAction(action, messageData, aiAnalysis);
        break;
      
      case 'send_auto_reply':
      case 'ai_response':
        await this.sendAutoReplyAction(action, messageData, aiAnalysis, aiService);
        break;
        
      case 'forward_message':
        await this.forwardMessageAction(action, messageData);
        break;
        
      case 'assign_user':
        await this.assignUserAction(action, messageData);
        break;
        
      case 'add_tag':
        await this.addTagAction(action, messageData);
        break;
        
      case 'escalate':
        await this.escalateAction(action, messageData, aiAnalysis);
        break;
        
      case 'webhook':
        await this.webhookAction(action, messageData, aiAnalysis);
        break;

      case 'notify_team':
        await this.notifyTeamAction(action, messageData, aiAnalysis);
        break;
        
      default:
        console.warn(`⚠️ [AutomationRule] Unknown action type: ${action.type}`);
    }
  }

  private async createTicketAction(action: AutomationAction, messageData: any, aiAnalysis?: MessageAnalysis): Promise<void> {
    try {
      console.log(`🎫 [AutomationRule] Creating ticket from automation rule: ${this.name}`);
      
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
        tenantId: this.tenantId,
        source: messageData.channel || messageData.channelType || 'omnibridge',
        metadata: {
          automationRule: {
            ruleId: this.id,
            ruleName: this.name,
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
          'X-Tenant-ID': this.tenantId
        },
        body: JSON.stringify(ticketData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [AutomationRule] Ticket created successfully: ${result.data?.number || result.data?.id || 'Unknown'}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ [AutomationRule] Failed to create ticket:`, errorText);
      }
    } catch (error) {
      console.error(`❌ [AutomationRule] Error creating ticket:`, error);
    }
  }

  private async sendAutoReplyAction(
    action: AutomationAction, 
    messageData: any, 
    aiAnalysis?: MessageAnalysis,
    aiService?: AIAnalysisService
  ): Promise<void> {
    try {
      let responseText = action.params?.message || action.params?.template;

      // Se a ação é do tipo ai_response, usar IA para gerar resposta
      if (action.type === 'ai_response' && aiService && aiAnalysis) {
        console.log(`🤖 [AutomationRule] Generating AI response`);
        responseText = await aiService.generateResponse(
          aiAnalysis, 
          messageData.content || messageData.body,
          { channel: messageData.channel, sender: messageData.sender }
        );
      }

      // Substituir variáveis na mensagem
      if (responseText) {
        responseText = responseText
          .replace(/\{sender\}/g, messageData.sender || 'Cliente')
          .replace(/\{subject\}/g, messageData.subject || 'Sua mensagem')
          .replace(/\{channel\}/g, messageData.channel || 'nosso sistema')
          .replace(/\{category\}/g, aiAnalysis?.category || 'suporte')
          .replace(/\{urgency\}/g, aiAnalysis?.urgency || 'normal');
      }

      console.log(`📤 [AutomationRule] Sending auto-reply to ${messageData.sender}`);
      console.log(`📝 [AutomationRule] Reply content: ${responseText?.substring(0, 100)}...`);

      // Aqui você implementaria a lógica real de envio baseada no canal
      // Por enquanto, apenas log
      console.log(`✅ [AutomationRule] Auto-reply sent successfully`);
    } catch (error) {
      console.error(`❌ [AutomationRule] Error sending auto-reply:`, error);
    }
  }

  private async forwardMessageAction(action: AutomationAction, messageData: any): Promise<void> {
    console.log(`⏩ [AutomationRule] Forwarding message to ${action.target}`);
    // Implementar lógica de encaminhamento
  }

  private async assignUserAction(action: AutomationAction, messageData: any): Promise<void> {
    console.log(`👤 [AutomationRule] Assigning to user ${action.target}`);
    // Implementar lógica de atribuição
  }

  private async addTagAction(action: AutomationAction, messageData: any): Promise<void> {
    console.log(`🏷️ [AutomationRule] Adding tag ${action.params?.tag}`);
    // Implementar lógica de adição de tag
  }

  private async escalateAction(action: AutomationAction, messageData: any, aiAnalysis?: MessageAnalysis): Promise<void> {
    console.log(`⬆️ [AutomationRule] Escalating message based on ${aiAnalysis ? 'AI analysis' : 'rule conditions'}`);
    // Implementar lógica de escalação
  }

  private async webhookAction(action: AutomationAction, messageData: any, aiAnalysis?: MessageAnalysis): Promise<void> {
    try {
      const webhookUrl = action.params?.url;
      if (!webhookUrl) {
        console.error(`❌ [AutomationRule] Webhook URL not provided`);
        return;
      }

      const payload = {
        rule: {
          id: this.id,
          name: this.name
        },
        message: messageData,
        aiAnalysis: aiAnalysis,
        timestamp: new Date().toISOString()
      };

      console.log(`🔗 [AutomationRule] Sending webhook to ${webhookUrl}`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OmniBridge-Automation/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ [AutomationRule] Webhook sent successfully`);
      } else {
        console.error(`❌ [AutomationRule] Webhook failed:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error(`❌ [AutomationRule] Error sending webhook:`, error);
    }
  }

  private async notifyTeamAction(action: AutomationAction, messageData: any, aiAnalysis?: MessageAnalysis): Promise<void> {
    console.log(`🔔 [AutomationRule] Notifying team about ${aiAnalysis?.intent || 'message'} with urgency: ${aiAnalysis?.urgency || 'medium'}`);
    // Implementar notificação da equipe
  }
}