// Infrastructure: DrizzleConversationLogRepository
// Implementação Drizzle ORM para persistência de logs de conversa

import { eq, and, gte, lte, desc, count, avg, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { conversationLogs } from '../../../../../shared/schema-omnibridge-logging';
import { 
  IConversationLogRepository 
} from '../../domain/repositories/IConversationLogRepository';
import { 
  ConversationLog, 
  CreateConversationLogDTO, 
  UpdateConversationLogDTO 
} from '../../domain/entities/ConversationLog';

export class DrizzleConversationLogRepository implements IConversationLogRepository {
  // 🏢 Validação obrigatória de tenant_id UUID v4
  private validateTenantId(tenantId: string): void {
    const uuidV4Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!tenantId || !uuidV4Regex.test(tenantId)) {
      throw new Error(`Invalid tenant_id format: ${tenantId}. Must be UUID v4.`);
    }
  }

  async create(data: CreateConversationLogDTO): Promise<ConversationLog> {
    this.validateTenantId(data.tenantId);

    const [result] = await db
      .insert(conversationLogs)
      .values({
        ...data,
        startedAt: new Date(),
        totalMessages: 0,
        totalActions: 0,
        escalatedToHuman: false,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async findById(id: number, tenantId: string): Promise<ConversationLog | null> {
    this.validateTenantId(tenantId);

    const [result] = await db
      .select()
      .from(conversationLogs)
      .where(and(eq(conversationLogs.id, id), eq(conversationLogs.tenantId, tenantId)));

    return result ? this.mapToEntity(result) : null;
  }

  async findBySessionId(sessionId: string, tenantId: string): Promise<ConversationLog | null> {
    this.validateTenantId(tenantId);

    const [result] = await db
      .select()
      .from(conversationLogs)
      .where(and(eq(conversationLogs.sessionId, sessionId), eq(conversationLogs.tenantId, tenantId)));

    return result ? this.mapToEntity(result) : null;
  }

  async update(id: number, tenantId: string, data: UpdateConversationLogDTO): Promise<ConversationLog> {
    this.validateTenantId(tenantId);

    const [result] = await db
      .update(conversationLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(conversationLogs.id, id), eq(conversationLogs.tenantId, tenantId)))
      .returning();

    return this.mapToEntity(result);
  }

  async delete(id: number, tenantId: string): Promise<void> {
    this.validateTenantId(tenantId);

    await db
      .delete(conversationLogs)
      .where(and(eq(conversationLogs.id, id), eq(conversationLogs.tenantId, tenantId)));
  }

  async findByAgentId(
    agentId: number, 
    tenantId: string, 
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ conversations: ConversationLog[]; total: number }> {
    this.validateTenantId(tenantId);

    const conditions = [
      eq(conversationLogs.agentId, agentId),
      eq(conversationLogs.tenantId, tenantId)
    ];

    if (options?.startDate) {
      conditions.push(gte(conversationLogs.startedAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(conversationLogs.startedAt, options.endDate));
    }

    const results = await db
      .select()
      .from(conversationLogs)
      .where(and(...conditions))
      .orderBy(desc(conversationLogs.startedAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(conversationLogs)
      .where(and(...conditions));

    return {
      conversations: results.map(this.mapToEntity),
      total: Number(total)
    };
  }

  async findByUserId(
    userId: number, 
    tenantId: string, 
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ conversations: ConversationLog[]; total: number }> {
    this.validateTenantId(tenantId);

    const results = await db
      .select()
      .from(conversationLogs)
      .where(and(eq(conversationLogs.userId, userId), eq(conversationLogs.tenantId, tenantId)))
      .orderBy(desc(conversationLogs.startedAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(conversationLogs)
      .where(and(eq(conversationLogs.userId, userId), eq(conversationLogs.tenantId, tenantId)));

    return {
      conversations: results.map(this.mapToEntity),
      total: Number(total)
    };
  }

  async getAgentStatistics(
    agentId: number, 
    tenantId: string, 
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalActions: number;
    escalationRate: number;
    avgMessagesPerConversation: number;
    avgActionsPerConversation: number;
  }> {
    this.validateTenantId(tenantId);

    const conditions = [
      eq(conversationLogs.agentId, agentId),
      eq(conversationLogs.tenantId, tenantId)
    ];

    if (options?.startDate) {
      conditions.push(gte(conversationLogs.startedAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(conversationLogs.startedAt, options.endDate));
    }

    const [stats] = await db
      .select({
        totalConversations: count(),
        totalMessages: sql<number>`SUM(${conversationLogs.totalMessages})`,
        totalActions: sql<number>`SUM(${conversationLogs.totalActions})`,
        escalatedCount: sql<number>`SUM(CASE WHEN ${conversationLogs.escalatedToHuman} THEN 1 ELSE 0 END)`,
        avgMessages: avg(conversationLogs.totalMessages),
        avgActions: avg(conversationLogs.totalActions),
      })
      .from(conversationLogs)
      .where(and(...conditions));

    const totalConv = Number(stats.totalConversations) || 0;
    const escalated = Number(stats.escalatedCount) || 0;

    return {
      totalConversations: totalConv,
      totalMessages: Number(stats.totalMessages) || 0,
      totalActions: Number(stats.totalActions) || 0,
      escalationRate: totalConv > 0 ? (escalated / totalConv) * 100 : 0,
      avgMessagesPerConversation: Number(stats.avgMessages) || 0,
      avgActionsPerConversation: Number(stats.avgActions) || 0,
    };
  }

  private mapToEntity(row: any): ConversationLog {
    return {
      id: row.id,
      tenantId: row.tenantId,
      agentId: row.agentId,
      sessionId: row.sessionId,
      channelType: row.channelType,
      channelIdentifier: row.channelIdentifier,
      userId: row.userId,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      totalMessages: row.totalMessages,
      totalActions: row.totalActions,
      escalatedToHuman: row.escalatedToHuman,
      escalatedAt: row.escalatedAt,
      escalatedToUserId: row.escalatedToUserId,
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}