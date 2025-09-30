// Domain Entity: ConversationLog
// Representa uma sessão completa de conversa entre usuário e agente de IA

export interface ConversationLog {
  id: number;
  tenantId: string;
  agentId: number;
  sessionId: string;
  channelType?: string;
  channelIdentifier?: string;
  userId?: number;
  startedAt: Date;
  endedAt?: Date;
  totalMessages: number;
  totalActions: number;
  escalatedToHuman: boolean;
  escalatedAt?: Date;
  escalatedToUserId?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationLogDTO {
  tenantId: string;
  agentId: number;
  sessionId: string;
  channelType?: string;
  channelIdentifier?: string;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface UpdateConversationLogDTO {
  endedAt?: Date;
  totalMessages?: number;
  totalActions?: number;
  escalatedToHuman?: boolean;
  escalatedAt?: Date;
  escalatedToUserId?: number;
  metadata?: Record<string, any>;
}
