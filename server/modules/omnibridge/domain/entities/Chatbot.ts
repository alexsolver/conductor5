
export interface ChatbotWorkflowStep {
  id: string;
  type: 'message' | 'condition' | 'action' | 'ai_agent' | 'human_handoff';
  config: Record<string, any>;
  nextStep?: string;
  conditions?: { field: string; operator: string; value: string }[];
}

export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  channels: string[];
  workflow: ChatbotWorkflowStep[];
  isActive: boolean;
  aiConfig?: {
    model: string;
    instructions: string;
    temperature: number;
    maxTokens: number;
  };
  fallbackToHuman: boolean;
  tenantId: string;
  conversationCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatbotEntity implements Chatbot {
  constructor(
    public id: string,
    public name: string,
    public channels: string[],
    public workflow: ChatbotWorkflowStep[],
    public tenantId: string,
    public description?: string,
    public isActive: boolean = true,
    public aiConfig?: {
      model: string;
      instructions: string;
      temperature: number;
      maxTokens: number;
    },
    public fallbackToHuman: boolean = true,
    public conversationCount: number = 0,
    public successRate: number = 0,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public addChannel(channelId: string): void {
    if (!this.channels.includes(channelId)) {
      this.channels.push(channelId);
      this.updatedAt = new Date();
    }
  }

  public removeChannel(channelId: string): void {
    this.channels = this.channels.filter(id => id !== channelId);
    this.updatedAt = new Date();
  }

  public updateAIConfig(config: {
    model: string;
    instructions: string;
    temperature: number;
    maxTokens: number;
  }): void {
    this.aiConfig = config;
    this.updatedAt = new Date();
  }
}
