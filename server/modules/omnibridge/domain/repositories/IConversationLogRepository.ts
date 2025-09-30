// Repository Interface: IConversationLogRepository
// Define o contrato para persistência de logs de conversa

import { ConversationLog, CreateConversationLogDTO, UpdateConversationLogDTO } from '../entities/ConversationLog';

export interface IConversationLogRepository {
  // CRUD básico
  create(data: CreateConversationLogDTO): Promise<ConversationLog>;
  findById(id: number, tenantId: string): Promise<ConversationLog | null>;
  findBySessionId(sessionId: string, tenantId: string): Promise<ConversationLog | null>;
  update(id: number, tenantId: string, data: UpdateConversationLogDTO): Promise<ConversationLog>;
  delete(id: number, tenantId: string): Promise<void>;
  
  // Consultas avançadas
  findByAgentId(agentId: number, tenantId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ conversations: ConversationLog[]; total: number }>;
  
  findByUserId(userId: number, tenantId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: ConversationLog[]; total: number }>;
  
  // Analytics
  getAgentStatistics(agentId: number, tenantId: string, options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalActions: number;
    escalationRate: number;
    avgMessagesPerConversation: number;
    avgActionsPerConversation: number;
  }>;
}
