import { AiAgent } from '../entities/AiAgent';
import { AiConversation } from '../entities/AiConversation';

export interface IAiAgentRepository {
  // Agent management
  create(agent: AiAgent): Promise<AiAgent>;
  findById(id: string, tenantId: string): Promise<AiAgent | null>;
  findByTenantId(tenantId: string): Promise<AiAgent[]>;
  findByChannel(channelType: string, tenantId: string): Promise<AiAgent[]>;
  update(agent: AiAgent): Promise<AiAgent>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Conversation management
  createConversation(conversation: AiConversation): Promise<AiConversation>;
  findConversationById(id: string, tenantId: string): Promise<AiConversation | null>;
  findActiveConversation(userId: string, channelId: string, tenantId: string): Promise<AiConversation | null>;
  findConversationsByAgent(agentId: string, tenantId: string, status?: string): Promise<AiConversation[]>;
  updateConversation(conversation: AiConversation): Promise<AiConversation>;
  deleteConversation(id: string, tenantId: string): Promise<boolean>;
  cleanupExpiredConversations(tenantId: string): Promise<number>;

  // Analytics
  getAgentStats(agentId: string, tenantId: string): Promise<any>;
  getConversationMetrics(tenantId: string, timeframe?: string): Promise<any>;
}