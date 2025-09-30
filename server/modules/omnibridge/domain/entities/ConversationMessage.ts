// Domain Entity: ConversationMessage
// Representa uma mensagem individual na conversa

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: number;
  tenantId: string;
  conversationId: number;
  role: MessageRole;
  content: string;
  rawContent?: string;
  timestamp: Date;
  processingTimeMs?: number;
  tokenCount?: number;
  contextWindowSize?: number;
  intentDetected?: string;
  confidence?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateConversationMessageDTO {
  tenantId: string;
  conversationId: number;
  role: MessageRole;
  content: string;
  rawContent?: string;
  processingTimeMs?: number;
  tokenCount?: number;
  contextWindowSize?: number;
  intentDetected?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}
