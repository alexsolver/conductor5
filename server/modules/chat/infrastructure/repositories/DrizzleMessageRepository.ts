/**
 * DRIZZLE MESSAGE REPOSITORY
 * Infrastructure Layer - Drizzle ORM implementation
 */

import { getTenantDb } from '@server/db';
import { chatMessages, messageReactions } from '@shared/schema-chat';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { Message, MessageReaction } from '../../domain/entities/Message';

export class DrizzleMessageRepository implements IMessageRepository {
  // Message operations
  async createMessage(message: Message): Promise<Message> {
    const db = await getTenantDb(message.tenantId);
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created as Message;
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<Message> {
    const tenantId = data.tenantId!;
    const db = await getTenantDb(tenantId);
    const [updated] = await db
      .update(chatMessages)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(chatMessages.id, id), eq(chatMessages.tenantId, tenantId)))
      .returning();
    return updated as Message;
  }

  async findMessageById(id: string, tenantId: string): Promise<Message | null> {
    const db = await getTenantDb(tenantId);
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.id, id), eq(chatMessages.tenantId, tenantId)))
      .limit(1);
    return message as Message || null;
  }

  async findMessagesByChat(
    chatId: string,
    tenantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const db = await getTenantDb(tenantId);
    const messageList = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          eq(chatMessages.tenantId, tenantId)
        )
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
    return messageList as Message[];
  }

  // Reaction operations
  async addReaction(reaction: MessageReaction): Promise<MessageReaction> {
    const db = await getTenantDb(reaction.tenantId);
    const [created] = await db
      .insert(messageReactions)
      .values(reaction)
      .returning();
    return created as MessageReaction;
  }

  async removeReaction(id: string, tenantId: string): Promise<void> {
    const db = await getTenantDb(tenantId);
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.id, id),
          eq(messageReactions.tenantId, tenantId)
        )
      );
  }

  async findReactions(messageId: string, tenantId: string): Promise<MessageReaction[]> {
    const db = await getTenantDb(tenantId);
    const reactions = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.tenantId, tenantId)
        )
      )
      .orderBy(messageReactions.createdAt);
    return reactions as MessageReaction[];
  }

  // Read status operations
  async markAsRead(messageId: string, userId: string, tenantId: string): Promise<Message> {
    const db = await getTenantDb(tenantId);
    
    // Get current message
    const [currentMessage] = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.tenantId, tenantId)))
      .limit(1);

    if (!currentMessage) {
      throw new Error('Message not found');
    }

    // Add userId to readBy array if not already present
    const readBy = (currentMessage.readBy as string[]) || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    // Update message
    const [updated] = await db
      .update(chatMessages)
      .set({
        isRead: true,
        readAt: new Date(),
        readBy: readBy,
        updatedAt: new Date(),
      })
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.tenantId, tenantId)))
      .returning();

    return updated as Message;
  }

  // Search operations
  async searchMessages(chatId: string, query: string, tenantId: string): Promise<Message[]> {
    const db = await getTenantDb(tenantId);
    const searchResults = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          eq(chatMessages.tenantId, tenantId),
          ilike(chatMessages.content, `%${query}%`)
        )
      )
      .orderBy(desc(chatMessages.createdAt));
    return searchResults as Message[];
  }
}
