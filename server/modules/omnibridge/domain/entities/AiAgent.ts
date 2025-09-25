export interface AiAgentPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  language: string;
  greeting: string;
  fallbackMessage: string;
}

export interface AiAgentConversationConfig {
  useMenus: boolean;
  maxTurns: number;
  requireConfirmation: boolean;
  escalationKeywords: string[];
}

export interface AiAgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  extractionPrompts: {
    general: string;
    confirmation: string;
  };
}

export interface AiAgentStats {
  conversationsHandled: number;
  actionsExecuted: number;
  successRate: number;
  averageResponseTime: number;
}

export class AiAgent {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public description: string,
    public personality: AiAgentPersonality,
    public channels: string[], // ['email', 'whatsapp', 'telegram']
    public enabledActions: string[], // Lista de ações que pode executar
    public conversationConfig: AiAgentConversationConfig,
    public aiConfig: AiAgentConfig,
    public isActive: boolean = true,
    public priority: number = 1,
    public stats: AiAgentStats = {
      conversationsHandled: 0,
      actionsExecuted: 0,
      successRate: 100,
      averageResponseTime: 0
    },
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public canHandleChannel(channel: string): boolean {
    return this.isActive && this.channels.includes(channel);
  }

  public canExecuteAction(actionType: string): boolean {
    return this.isActive && this.enabledActions.includes(actionType);
  }

  public shouldEscalate(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.conversationConfig.escalationKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }

  public updateStats(conversationCompleted: boolean, actionExecuted: boolean, responseTimeMs: number): void {
    if (conversationCompleted) {
      this.stats.conversationsHandled++;
    }
    
    if (actionExecuted) {
      this.stats.actionsExecuted++;
    }

    // Atualizar tempo médio de resposta
    const currentTotal = this.stats.averageResponseTime * this.stats.conversationsHandled;
    this.stats.averageResponseTime = (currentTotal + responseTimeMs) / (this.stats.conversationsHandled + 1);

    this.updatedAt = new Date();
  }
}