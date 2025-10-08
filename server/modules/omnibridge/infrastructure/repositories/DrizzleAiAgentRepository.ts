import { eq, and, sql as drizzleSql } from 'drizzle-orm';
import { db, sql, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { 
  omnibridgeAiAgents, 
  omnibridgeAiConversations 
} from '../../../../../shared/schema';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { AiAgent, AiAgentPersonality, AiAgentConversationConfig, AiAgentConfig, AiAgentStats } from '../../domain/entities/AiAgent';
import { AiConversation, ConversationContext, ConversationMessage, ConversationStatus } from '../../domain/entities/AiConversation';

export class DrizzleAiAgentRepository implements IAiAgentRepository {
  
  // Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }
  
  // Agent management
  async create(agent: AiAgent): Promise<AiAgent> {
    const tenantDb = await this.getTenantDb(agent.tenantId);
    const result = await tenantDb.insert(schema.omnibridgeAiAgents).values({
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
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiAgents)
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapToAiAgent(result[0]) : null;
  }

  async findByTenantId(tenantId: string): Promise<AiAgent[]> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiAgents)
      .where(eq(schema.omnibridgeAiAgents.tenantId, tenantId))
      .orderBy(schema.omnibridgeAiAgents.priority, schema.omnibridgeAiAgents.name);

    return result.map(row => this.mapToAiAgent(row));
  }

  async findByChannel(channelType: string, tenantId: string): Promise<AiAgent[]> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiAgents)
      .where(and(
        eq(schema.omnibridgeAiAgents.tenantId, tenantId),
        eq(schema.omnibridgeAiAgents.isActive, true),
        drizzleSql`JSON_CONTAINS(${schema.omnibridgeAiAgents.channels}, JSON_ARRAY(${channelType}))`
      ))
      .orderBy(schema.omnibridgeAiAgents.priority);

    return result.map(row => this.mapToAiAgent(row));
  }

  async update(agent: AiAgent): Promise<AiAgent> {
    agent.updatedAt = new Date();
    
    const tenantDb = await this.getTenantDb(agent.tenantId);
    const result = await tenantDb.update(schema.omnibridgeAiAgents)
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
        eq(schema.omnibridgeAiAgents.id, agent.id),
        eq(schema.omnibridgeAiAgents.tenantId, agent.tenantId)
      ))
      .returning();

    return this.mapToAiAgent(result[0]);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.delete(schema.omnibridgeAiAgents)
      .where(and(
        eq(schema.omnibridgeAiAgents.id, id),
        eq(schema.omnibridgeAiAgents.tenantId, tenantId)
      ));

    return result.rowsAffected > 0;
  }

  // Conversation management
  async createConversation(conversation: AiConversation): Promise<AiConversation> {
    const tenantDb = await this.getTenantDb(conversation.tenantId);
    const result = await tenantDb.insert(schema.omnibridgeAiConversations).values({
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
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiConversations)
      .where(and(
        eq(schema.omnibridgeAiConversations.id, id),
        eq(schema.omnibridgeAiConversations.tenantId, tenantId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapToAiConversation(result[0]) : null;
  }

  async findActiveConversation(userId: string, channelId: string, tenantId: string): Promise<AiConversation | null> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiConversations)
      .where(and(
        eq(schema.omnibridgeAiConversations.userId, userId),
        eq(schema.omnibridgeAiConversations.channelId, channelId),
        eq(schema.omnibridgeAiConversations.tenantId, tenantId),
        eq(schema.omnibridgeAiConversations.status, 'active'),
        drizzleSql`${schema.omnibridgeAiConversations.expiresAt} > NOW()`
      ))
      .orderBy(drizzleSql`${schema.omnibridgeAiConversations.lastMessageAt} DESC`)
      .limit(1);

    return result.length > 0 ? this.mapToAiConversation(result[0]) : null;
  }

  async findConversationsByAgent(agentId: string, tenantId: string, status?: string): Promise<AiConversation[]> {
    const conditions = [
      eq(schema.omnibridgeAiConversations.agentId, agentId),
      eq(schema.omnibridgeAiConversations.tenantId, tenantId)
    ];

    if (status) {
      conditions.push(eq(schema.omnibridgeAiConversations.status, status));
    }

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select()
      .from(schema.omnibridgeAiConversations)
      .where(and(...conditions))
      .orderBy(drizzleSql`${schema.omnibridgeAiConversations.lastMessageAt} DESC`);

    return result.map(row => this.mapToAiConversation(row));
  }

  async updateConversation(conversation: AiConversation): Promise<AiConversation> {
    conversation.updatedAt = new Date();
    
    const tenantDb = await this.getTenantDb(conversation.tenantId);
    const result = await tenantDb.update(schema.omnibridgeAiConversations)
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
        eq(schema.omnibridgeAiConversations.id, conversation.id),
        eq(schema.omnibridgeAiConversations.tenantId, conversation.tenantId)
      ))
      .returning();

    return this.mapToAiConversation(result[0]);
  }

  async deleteConversation(id: string, tenantId: string): Promise<boolean> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.delete(schema.omnibridgeAiConversations)
      .where(and(
        eq(schema.omnibridgeAiConversations.id, id),
        eq(schema.omnibridgeAiConversations.tenantId, tenantId)
      ));

    return result.rowsAffected > 0;
  }

  async cleanupExpiredConversations(tenantId: string): Promise<number> {
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.delete(schema.omnibridgeAiConversations)
      .where(and(
        eq(schema.omnibridgeAiConversations.tenantId, tenantId),
        drizzleSql`${schema.omnibridgeAiConversations.expiresAt} < NOW()`
      ));

    return result.rowsAffected;
  }

  // Analytics
  async getAgentStats(agentId: string, tenantId: string): Promise<any> {
    const tenantDb = await this.getTenantDb(tenantId);
    const conversationStats = await tenantDb.select({
      totalConversations: drizzleSql<number>`COUNT(*)`,
      activeConversations: drizzleSql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
      completedConversations: drizzleSql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
      escalatedConversations: drizzleSql<number>`SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END)`,
      avgMessageCount: drizzleSql<number>`AVG(JSON_LENGTH(conversation_history))`
    })
    .from(schema.omnibridgeAiConversations)
    .where(and(
      eq(schema.omnibridgeAiConversations.agentId, agentId),
      eq(schema.omnibridgeAiConversations.tenantId, tenantId)
    ));

    return conversationStats[0] || {};
  }

  async getConversationMetrics(tenantId: string, timeframe?: string): Promise<any> {
    let timeCondition = drizzleSql`1=1`;
    
    if (timeframe === '24h') {
      timeCondition = drizzleSql`${schema.omnibridgeAiConversations.createdAt} >= NOW() - INTERVAL 24 HOUR`;
    } else if (timeframe === '7d') {
      timeCondition = drizzleSql`${schema.omnibridgeAiConversations.createdAt} >= NOW() - INTERVAL 7 DAY`;
    } else if (timeframe === '30d') {
      timeCondition = drizzleSql`${schema.omnibridgeAiConversations.createdAt} >= NOW() - INTERVAL 30 DAY`;
    }

    const tenantDb = await this.getTenantDb(tenantId);
    const metrics = await tenantDb.select({
      totalConversations: drizzleSql<number>`COUNT(*)`,
      byStatus: drizzleSql<any>`JSON_OBJECTAGG(status, count_by_status)`,
      byChannel: drizzleSql<any>`JSON_OBJECTAGG(channel_type, count_by_channel)`,
      avgDuration: drizzleSql<number>`AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at))`
    })
    .from(
      drizzleSql`(
        SELECT 
          status,
          channel_type,
          created_at,
          updated_at,
          COUNT(*) OVER (PARTITION BY status) as count_by_status,
          COUNT(*) OVER (PARTITION BY channel_type) as count_by_channel
        FROM ${schema.omnibridgeAiConversations}
        WHERE ${eq(schema.omnibridgeAiConversations.tenantId, tenantId)} 
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