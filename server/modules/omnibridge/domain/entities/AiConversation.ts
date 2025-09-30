export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    menuOptions?: string[];
    selectedOption?: string;
    extractedParams?: Record<string, any>;
  };
}

export interface ConversationContext {
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    previousInteractions?: number;
  };
  currentRequest?: {
    type: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  extractedData?: Record<string, any>;
}

export type ConversationStatus = 'active' | 'waiting_input' | 'waiting_confirmation' | 'completed' | 'escalated' | 'expired';

export class AiConversation {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly agentId: string,
    public readonly userId: string, // Email ou identificador do usuário
    public readonly channelId: string,
    public readonly channelType: string, // 'email', 'whatsapp', 'telegram'
    public status: ConversationStatus = 'active',
    public context: ConversationContext = {},
    public currentStep: string = 'greeting',
    public intendedAction: string | null = null, // Ação que o agente pretende executar
    public actionParams: Record<string, any> = {}, // Parâmetros coletados para a ação
    public conversationHistory: ConversationMessage[] = [],
    public lastMessageAt: Date = new Date(),
    public expiresAt: Date | null = null, // Para limpeza automática de conversas antigas
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    // Configurar expiração padrão para 24 horas
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  public addMessage(role: 'user' | 'agent' | 'system', content: string, metadata?: any): ConversationMessage {
    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      metadata
    };

    this.conversationHistory.push(message);
    this.lastMessageAt = new Date();
    this.updatedAt = new Date();

    return message;
  }

  public updateContext(newContext: Partial<ConversationContext>): void {
    this.context = { ...this.context, ...newContext };
    this.updatedAt = new Date();
  }

  public setIntendedAction(actionType: string, params: Record<string, any> = {}): void {
    this.intendedAction = actionType;
    this.actionParams = { ...this.actionParams, ...params };
    this.updatedAt = new Date();
  }

  public updateStep(step: string): void {
    this.currentStep = step;
    this.updatedAt = new Date();
  }

  public updateStatus(status: ConversationStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  public isExpired(): boolean {
    return this.expiresAt ? this.expiresAt < new Date() : false;
  }

  public getLastUserMessage(): ConversationMessage | undefined {
    return this.conversationHistory
      .slice()
      .reverse()
      .find(msg => msg.role === 'user');
  }

  public getMessageCount(): number {
    return this.conversationHistory.length;
  }

  public getUserMessageCount(): number {
    return this.conversationHistory.filter(msg => msg.role === 'user').length;
  }

  public hasRequiredParams(requiredParams: string[]): boolean {
    return requiredParams.every(param => 
      this.actionParams[param] !== undefined && this.actionParams[param] !== ''
    );
  }

  public getMissingParams(requiredParams: string[]): string[] {
    return requiredParams.filter(param => {
      const value = this.actionParams[param];
      // ✅ ANTI-LOOP: Validação mais robusta para evitar loops
      return value === undefined || 
             value === '' || 
             value === null || 
             (typeof value === 'string' && value.trim() === '');
    });
  }

  public getAttemptCount(): number {
    return this.actionParams._attemptCount || 0;
  }

  public incrementAttemptCount(): void {
    this.actionParams._attemptCount = this.getAttemptCount() + 1;
    this.updatedAt = new Date();
  }

  public resetAttemptCount(): void {
    this.actionParams._attemptCount = 0;
    this.updatedAt = new Date();
  }

  public isStuck(): boolean {
    return this.getAttemptCount() >= 5;
  }

  public getLastMessagesByRole(role: 'user' | 'agent' | 'system', count: number = 3): ConversationMessage[] {
    return this.conversationHistory
      .filter(msg => msg.role === role)
      .slice(-count);
  }

  public extendExpiry(hours: number = 24): void {
    this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    this.updatedAt = new Date();
  }
}