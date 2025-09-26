import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  omnibridgeAiAgents, 
  omnibridgeAiConversations 
} from '../../../../../shared/schema';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AiAgent, AiAgentPersonality, AiAgentConversationConfig, AiAgentConfig, AiAgentStats } from '../../domain/entities/AiAgent';
import { AiConversation, ConversationContext, ConversationMessage, ConversationStatus } from '../../domain/entities/AiConversation';

export class DrizzleAiAgentRepository implements IAiAgentRepository {
  
  // Agent management
  async create(agent: AiAgent): Promise<AiAgent> {
    const result = await db.insert(omnibridgeAiAgents).values({
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      description: agent.description,
      personality: agent.personality,
      channels: agent.channels,
      enabledActions: agent.enabledActions,
      conversationConfig: agent.conversationConfig,
      aiConfig: agent.aiConfig,
      isActive: agent.isActive,
      priority: agent.priority,
      stats: agent.stats,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    }).returning();

    return this.mapToAiAgent(result[0]);
  }

  async findById(id: string, tenantId: string): Promise<AiAgent | null> {
    const result = await db.select()
      .from(omnibridgeAiAgents)
      .where(and(
        eq(omnibridgeAiAgents.id, id),
        eq(omnibridgeAiAgents.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapToAiAgent(result[0]) : null;
  }

  async findByTenantId(tenantId: string): Promise<AiAgent[]> {
    const result = await db.select()
      .from(omnibridgeAiAgents)
      .where(eq(omnibridgeAiAgents.tenantId, tenantId))
      .orderBy(omnibridgeAiAgents.priority, omnibridgeAiAgents.name);

    return result.map(row => this.mapToAiAgent(row));
  }

  async findByChannel(channelType: string, tenantId: string): Promise<AiAgent[]> {
    const result = await db.select()
      .from(omnibridgeAiAgents)
      .where(and(
        eq(omnibridgeAiAgents.tenantId, tenantId),
        eq(omnibridgeAiAgents.isActive, true),
        sql`JSON_CONTAINS(${omnibridgeAiAgents.channels}, JSON_ARRAY(${channelType}))`
      ))
      .orderBy(omnibridgeAiAgents.priority);

    return result.map(row => this.mapToAiAgent(row));
  }

  async update(agent: AiAgent): Promise<AiAgent> {
    agent.updatedAt = new Date();
    
    const result = await db.update(omnibridgeAiAgents)
      .set({
        name: agent.name,
        description: agent.description,
        personality: agent.personality,
        channels: agent.channels,
        enabledActions: agent.enabledActions,
        conversationConfig: agent.conversationConfig,
        aiConfig: agent.aiConfig,
        isActive: agent.isActive,
        priority: agent.priority,
        stats: agent.stats,
        updatedAt: agent.updatedAt
      })
      .where(and(
        eq(omnibridgeAiAgents.id, agent.id),
        eq(omnibridgeAiAgents.tenantId, agent.tenantId)
      ))
      .returning();

    return this.mapToAiAgent(result[0]);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(omnibridgeAiAgents)
      .where(and(
        eq(omnibridgeAiAgents.id, id),
        eq(omnibridgeAiAgents.tenantId, tenantId)
      ));

    return result.rowsAffected > 0;
  }

  // Conversation management
  async createConversation(conversation: AiConversation): Promise<AiConversation> {
    const result = await db.insert(omnibridgeAiConversations).values({
      id: conversation.id,
      tenantId: conversation.tenantId,
      agentId: conversation.agentId,
      userId: conversation.userId,
      channelId: conversation.channelId,
      channelType: conversation.channelType,
      status: conversation.status,
      context: conversation.context,
      currentStep: conversation.currentStep,
      intendedAction: conversation.intendedAction,
      actionParams: conversation.actionParams,
      conversationHistory: conversation.conversationHistory,
      lastMessageAt: conversation.lastMessageAt,
      expiresAt: conversation.expiresAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }).returning();

    return this.mapToAiConversation(result[0]);
  }

  async findConversationById(id: string, tenantId: string): Promise<AiConversation | null> {
    const result = await db.select()
      .from(omnibridgeAiConversations)
      .where(and(
        eq(omnibridgeAiConversations.id, id),
        eq(omnibridgeAiConversations.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapToAiConversation(result[0]) : null;
  }

  async findActiveConversation(userId: string, channelId: string, tenantId: string): Promise<AiConversation | null> {
    const result = await db.select()
      .from(omnibridgeAiConversations)
      .where(and(
        eq(omnibridgeAiConversations.userId, userId),
        eq(omnibridgeAiConversations.channelId, channelId),
        eq(omnibridgeAiConversations.tenantId, tenantId),
        eq(omnibridgeAiConversations.status, 'active'),
        sql`${omnibridgeAiConversations.expiresAt} > NOW()`
      ))
      .orderBy(sql`${omnibridgeAiConversations.lastMessageAt} DESC`)
      .limit(1);

    return result.length > 0 ? this.mapToAiConversation(result[0]) : null;
  }

  async findConversationsByAgent(agentId: string, tenantId: string, status?: string): Promise<AiConversation[]> {
    const conditions = [
      eq(omnibridgeAiConversations.agentId, agentId),
      eq(omnibridgeAiConversations.tenantId, tenantId)
    ];

    if (status) {
      conditions.push(eq(omnibridgeAiConversations.status, status));
    }

    const result = await db.select()
      .from(omnibridgeAiConversations)
      .where(and(...conditions))
      .orderBy(sql`${omnibridgeAiConversations.lastMessageAt} DESC`);

    return result.map(row => this.mapToAiConversation(row));
  }

  async updateConversation(conversation: AiConversation): Promise<AiConversation> {
    conversation.updatedAt = new Date();
    
    const result = await db.update(omnibridgeAiConversations)
      .set({
        status: conversation.status,
        context: conversation.context,
        currentStep: conversation.currentStep,
        intendedAction: conversation.intendedAction,
        actionParams: conversation.actionParams,
        conversationHistory: conversation.conversationHistory,
        lastMessageAt: conversation.lastMessageAt,
        expiresAt: conversation.expiresAt,
        updatedAt: conversation.updatedAt
      })
      .where(and(
        eq(omnibridgeAiConversations.id, conversation.id),
        eq(omnibridgeAiConversations.tenantId, conversation.tenantId)
      ))
      .returning();

    return this.mapToAiConversation(result[0]);
  }

  async deleteConversation(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(omnibridgeAiConversations)
      .where(and(
        eq(omnibridgeAiConversations.id, id),
        eq(omnibridgeAiConversations.tenantId, tenantId)
      ));

    return result.rowsAffected > 0;
  }

  async cleanupExpiredConversations(tenantId: string): Promise<number> {
    const result = await db.delete(omnibridgeAiConversations)
      .where(and(
        eq(omnibridgeAiConversations.tenantId, tenantId),
        sql`${omnibridgeAiConversations.expiresAt} < NOW()`
      ));

    return result.rowsAffected;
  }

  // Analytics
  async getAgentStats(agentId: string, tenantId: string): Promise<any> {
    const conversationStats = await db.select({
      totalConversations: sql<number>`COUNT(*)`,
      activeConversations: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
      completedConversations: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
      escalatedConversations: sql<number>`SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END)`,
      avgMessageCount: sql<number>`AVG(JSON_LENGTH(conversation_history))`
    })
    .from(omnibridgeAiConversations)
    .where(and(
      eq(omnibridgeAiConversations.agentId, agentId),
      eq(omnibridgeAiConversations.tenantId, tenantId)
    ));

    return conversationStats[0] || {};
  }

  async getConversationMetrics(tenantId: string, timeframe?: string): Promise<any> {
    let timeCondition = sql`1=1`;
    
    if (timeframe === '24h') {
      timeCondition = sql`${omnibridgeAiConversations.createdAt} >= NOW() - INTERVAL 24 HOUR`;
    } else if (timeframe === '7d') {
      timeCondition = sql`${omnibridgeAiConversations.createdAt} >= NOW() - INTERVAL 7 DAY`;
    } else if (timeframe === '30d') {
      timeCondition = sql`${omnibridgeAiConversations.createdAt} >= NOW() - INTERVAL 30 DAY`;
    }

    const metrics = await db.select({
      totalConversations: sql<number>`COUNT(*)`,
      byStatus: sql<any>`JSON_OBJECTAGG(status, count_by_status)`,
      byChannel: sql<any>`JSON_OBJECTAGG(channel_type, count_by_channel)`,
      avgDuration: sql<number>`AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at))`
    })
    .from(
      sql`(
        SELECT 
          status,
          channel_type,
          created_at,
          updated_at,
          COUNT(*) OVER (PARTITION BY status) as count_by_status,
          COUNT(*) OVER (PARTITION BY channel_type) as count_by_channel
        FROM ${omnibridgeAiConversations}
        WHERE ${eq(omnibridgeAiConversations.tenantId, tenantId)} 
        AND ${timeCondition}
      ) as metrics`
    );

    return metrics[0] || {};
  }

  // Helper methods
  private mapToAiAgent(row: any): AiAgent {
    return new AiAgent(
      row.id,
      row.tenantId,
      row.name,
      row.description || '',
      row.personality as AiAgentPersonality,
      row.channels as string[],
      row.enabledActions as string[],
      row.conversationConfig as AiAgentConversationConfig,
      row.aiConfig as AiAgentConfig,
      row.isActive,
      row.priority,
      row.stats as AiAgentStats,
      row.createdAt,
      row.updatedAt
    );
  }

  private mapToAiConversation(row: any): AiConversation {
    return new AiConversation(
      row.id,
      row.tenantId,
      row.agentId,
      row.userId,
      row.channelId,
      row.channelType,
      row.status as ConversationStatus,
      row.context as ConversationContext,
      row.currentStep,
      row.intendedAction,
      row.actionParams,
      row.conversationHistory as ConversationMessage[],
      row.lastMessageAt,
      row.expiresAt,
      row.createdAt,
      row.updatedAt
    );
  }
}