/**
 * CHAT REPOSITORY INTERFACE
 * Clean Architecture - Domain Layer
 */

import { Chat, ChatParticipant } from '../entities/Chat';

export interface IChatRepository {
  // Chat operations
  createChat(chat: Chat): Promise<Chat>;
  updateChat(id: string, data: Partial<Chat>): Promise<Chat>;
  findChatById(id: string, tenantId: string): Promise<Chat | null>;
  findChatsByAgent(agentId: string, tenantId: string, status?: string): Promise<Chat[]>;
  findChatsByCustomer(customerId: string, tenantId: string): Promise<Chat[]>;
  findChatByConversation(conversationId: string, tenantId: string): Promise<Chat | null>;
  findChats(tenantId: string, filters?: any): Promise<Chat[]>;
  closeChat(id: string, closedById: string): Promise<Chat>;

  // Participant operations
  addParticipant(participant: ChatParticipant): Promise<ChatParticipant>;
  removeParticipant(id: string, tenantId: string): Promise<void>;
  findParticipants(chatId: string, tenantId: string): Promise<ChatParticipant[]>;
}
