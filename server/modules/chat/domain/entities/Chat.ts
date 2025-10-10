/**
 * DOMAIN LAYER - CHAT ENTITY
 * Seguindo Clean Architecture - Multi-tenant Chat
 */

export type ChatType = "direct" | "group" | "support";
export type ChatStatus = "active" | "closed" | "archived";

export interface Chat {
  id: string;
  tenantId: string;
  type: ChatType;
  status: ChatStatus;
  title?: string;
  queueId?: string;
  queueEntryId?: string;
  conversationId?: string;
  customerId?: string;
  customerChannel?: string;
  ticketId?: string;
  assignedAgentId?: string;
  transferHistory?: TransferRecord[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  closedById?: string;
}

export interface ChatParticipant {
  id: string;
  tenantId: string;
  chatId: string;
  userId?: string;
  role: string; // participant, supervisor, observer
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

export interface TransferRecord {
  fromAgentId?: string;
  toAgentId?: string;
  fromQueueId?: string;
  toQueueId?: string;
  reason?: string;
  timestamp: Date;
}

export class ChatDomainService {
  /**
   * Validates chat business rules
   */
  validate(chat: Partial<Chat>): boolean {
    if (!chat.type) {
      throw new Error('Chat type is required');
    }

    const validTypes: ChatType[] = ["direct", "group", "support"];
    if (!validTypes.includes(chat.type)) {
      throw new Error('Invalid chat type');
    }

    if (chat.type === 'support' && !chat.assignedAgentId) {
      throw new Error('Support chat requires an assigned agent');
    }

    return true;
  }

  /**
   * Check if chat is active
   */
  isActive(chat: Chat): boolean {
    return chat.status === 'active';
  }

  /**
   * Check if agent can participate in chat
   */
  canParticipate(chat: Chat, userId: string): boolean {
    if (chat.status !== 'active') {
      return false;
    }

    if (chat.type === 'support' && chat.assignedAgentId === userId) {
      return true;
    }

    if (chat.type === 'direct' || chat.type === 'group') {
      return true;
    }

    return false;
  }

  /**
   * Add transfer to history
   */
  addTransfer(chat: Chat, transfer: TransferRecord): Chat {
    return {
      ...chat,
      transferHistory: [...(chat.transferHistory || []), transfer],
      updatedAt: new Date()
    };
  }
}
