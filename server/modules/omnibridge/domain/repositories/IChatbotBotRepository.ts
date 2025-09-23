import { 
  SelectChatbotBot, 
  InsertChatbotBot, 
  UpdateChatbotBot,
  ChatbotBotWithFlows
} from '../../../../../shared/schema-chatbot';

export interface IChatbotBotRepository {
  // Basic CRUD operations
  create(bot: InsertChatbotBot): Promise<SelectChatbotBot>;
  findById(id: string, tenantId: string): Promise<SelectChatbotBot | null>;
  findByTenant(tenantId: string): Promise<SelectChatbotBot[]>;
  findActiveByTenant(tenantId: string): Promise<SelectChatbotBot[]>;
  update(id: string, tenantId: string, updates: UpdateChatbotBot): Promise<SelectChatbotBot | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Status management
  toggleStatus(id: string, tenantId: string, isEnabled: boolean): Promise<boolean>;
  
  // Channel bindings
  bindToChannel(botId: string, channelId: string, routingRules?: any, priority?: number): Promise<boolean>;
  unbindFromChannel(botId: string, channelId: string): Promise<boolean>;
  findByChannel(channelId: string, tenantId?: string): Promise<SelectChatbotBot[]>;
  
  // Advanced queries
  findWithFlows(id: string, tenantId: string): Promise<ChatbotBotWithFlows | null>;
  findBotsWithActiveFlows(tenantId: string): Promise<ChatbotBotWithFlows[]>;
  
  // Analytics
  updateConversationCount(id: string, increment: number): Promise<void>;
  updateSuccessRate(id: string, successRate: number): Promise<void>;
}