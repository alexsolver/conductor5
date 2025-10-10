/**
 * MESSAGE REPOSITORY INTERFACE
 * Clean Architecture - Domain Layer
 */

import { Message, MessageReaction } from '../entities/Message';

export interface IMessageRepository {
  // Message operations
  createMessage(message: Message): Promise<Message>;
  updateMessage(id: string, data: Partial<Message>): Promise<Message>;
  findMessageById(id: string, tenantId: string): Promise<Message | null>;
  findMessagesByChat(chatId: string, tenantId: string, limit?: number, offset?: number): Promise<Message[]>;

  // Reaction operations
  addReaction(reaction: MessageReaction): Promise<MessageReaction>;
  removeReaction(id: string, tenantId: string): Promise<void>;
  findReactions(messageId: string, tenantId: string): Promise<MessageReaction[]>;

  // Read status operations
  markAsRead(messageId: string, userId: string, tenantId: string): Promise<Message>;

  // Search operations
  searchMessages(chatId: string, query: string, tenantId: string): Promise<Message[]>;
}
