/**
 * DRIZZLE CHAT REPOSITORY
 * Infrastructure Layer - Drizzle ORM implementation
 */

import { getTenantDb } from '@server/db';
import { chats, chatParticipants } from '@shared/schema-chat';
import { eq, and, or, desc } from 'drizzle-orm';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Chat, ChatParticipant } from '../../domain/entities/Chat';

export class DrizzleChatRepository implements IChatRepository {
  // Chat operations
  async createChat(chat: Chat): Promise<Chat> {
    const db = await getTenantDb(chat.tenantId);
    const [created] = await db.insert(chats).values(chat).returning();
    return created as Chat;
  }

  async updateChat(id: string, data: Partial<Chat>): Promise<Chat> {
    const tenantId = data.tenantId!;
    const db = await getTenantDb(tenantId);
    const [updated] = await db
      .update(chats)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(chats.id, id), eq(chats.tenantId, tenantId)))
      .returning();
    return updated as Chat;
  }

  async findChatById(id: string, tenantId: string): Promise<Chat | null> {
    const db = await getTenantDb(tenantId);
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.tenantId, tenantId)))
      .limit(1);
    return chat as Chat || null;
  }

  async findChatsByAgent(
    agentId: string,
    tenantId: string,
    status?: string
  ): Promise<Chat[]> {
    const db = await getTenantDb(tenantId);
    
    const conditions = [
      eq(chats.assignedAgentId, agentId),
      eq(chats.tenantId, tenantId)
    ];

    if (status) {
      conditions.push(eq(chats.status, status));
    }

    const chatList = await db
      .select()
      .from(chats)
      .where(and(...conditions))
      .orderBy(desc(chats.updatedAt));

    return chatList as Chat[];
  }

  async findChatsByCustomer(customerId: string, tenantId: string): Promise<Chat[]> {
    const db = await getTenantDb(tenantId);
    const chatList = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.customerId, customerId),
          eq(chats.tenantId, tenantId)
        )
      )
      .orderBy(desc(chats.createdAt));
    return chatList as Chat[];
  }

  async findChatByConversation(
    conversationId: string,
    tenantId: string
  ): Promise<Chat | null> {
    const db = await getTenantDb(tenantId);
    const [chat] = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.conversationId, conversationId),
          eq(chats.tenantId, tenantId)
        )
      )
      .limit(1);
    return chat as Chat || null;
  }

  async findChats(tenantId: string, filters?: any): Promise<Chat[]> {
    const db = await getTenantDb(tenantId);
    
    const conditions = [eq(chats.tenantId, tenantId)];

    if (filters?.status) {
      conditions.push(eq(chats.status, filters.status));
    }

    if (filters?.type) {
      conditions.push(eq(chats.type, filters.type));
    }

    if (filters?.queueId) {
      conditions.push(eq(chats.queueId, filters.queueId));
    }

    const chatList = await db
      .select()
      .from(chats)
      .where(and(...conditions))
      .orderBy(desc(chats.updatedAt));

    return chatList as Chat[];
  }

  async closeChat(id: string, closedById: string): Promise<Chat> {
    const db = await getTenantDb(closedById);
    const [closed] = await db
      .update(chats)
      .set({
        status: 'closed',
        closedAt: new Date(),
        closedById,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, id))
      .returning();
    return closed as Chat;
  }

  // Participant operations
  async addParticipant(participant: ChatParticipant): Promise<ChatParticipant> {
    const db = await getTenantDb(participant.tenantId);
    const [created] = await db
      .insert(chatParticipants)
      .values(participant)
      .returning();
    return created as ChatParticipant;
  }

  async removeParticipant(id: string, tenantId: string): Promise<void> {
    const db = await getTenantDb(tenantId);
    await db
      .update(chatParticipants)
      .set({
        isActive: false,
        leftAt: new Date(),
      })
      .where(and(eq(chatParticipants.id, id), eq(chatParticipants.tenantId, tenantId)));
  }

  async findParticipants(chatId: string, tenantId: string): Promise<ChatParticipant[]> {
    const db = await getTenantDb(tenantId);
    const participants = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.tenantId, tenantId)
        )
      )
      .orderBy(chatParticipants.joinedAt);
    return participants as ChatParticipant[];
  }

  async getAgentMetrics(tenantId: string, agentId: string): Promise<any> {
    const db = await getTenantDb(tenantId);
    
    // Get counts for different statuses
    const activeChats = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.tenantId, tenantId),
          eq(chats.assignedAgentId, agentId),
          eq(chats.status, 'active')
        )
      );
    
    const totalChats = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.tenantId, tenantId),
          eq(chats.assignedAgentId, agentId)
        )
      );
    
    const completedChats = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.tenantId, tenantId),
          eq(chats.assignedAgentId, agentId),
          eq(chats.status, 'closed')
        )
      );
    
    return {
      activeChats: activeChats.length,
      totalChats: totalChats.length,
      completedChats: completedChats.length,
      avgResponseTime: 0, // TODO: Calculate from messages
      satisfactionScore: 0 // TODO: Calculate from ratings
    };
  }
}
