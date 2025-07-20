// =====================================================
// DRIZZLE OMNIBRIDGE REPOSITORY IMPLEMENTATION
// Data access implementation for unified communication management
// =====================================================

import { eq, and, or, sql, desc, asc, ilike, gte, lte, inArray } from 'drizzle-orm';
import { schemaManager } from '../../../../../server/db';
import { IOmnibridgeRepository } from '../../domain/repositories/IOmnibridgeRepository';
import {
  omnibridgeChannels,
  omnibridgeInbox,
  omnibridgeProcessingRules,
  omnibridgeResponseTemplates,
  omnibridgeSignatures,
  omnibridgeProcessingLogs,
  omnibridgeAnalytics,
  OmnibridgeChannel,
  InsertOmnibridgeChannel,
  UpdateOmnibridgeChannel,
  OmnibridgeInboxMessage,
  InsertOmnibridgeInboxMessage,
  UpdateOmnibridgeInboxMessage,
  OmnibridgeProcessingRule,
  InsertOmnibridgeProcessingRule,
  UpdateOmnibridgeProcessingRule,
  OmnibridgeResponseTemplate,
  InsertOmnibridgeResponseTemplate,
  UpdateOmnibridgeResponseTemplate,
  OmnibridgeSignature,
  InsertOmnibridgeSignature,
  UpdateOmnibridgeSignature,
  OmnibridgeProcessingLog,
  InsertOmnibridgeProcessingLog,
  OmnibridgeAnalytics,
  InsertOmnibridgeAnalytics,
  ChannelType,
  MessageDirection,
  MessagePriority,
  ProcessingStatus
} from '@shared/schema';

export class DrizzleOmnibridgeRepository implements IOmnibridgeRepository {
  
  // =====================================================
  // COMMUNICATION CHANNELS
  // =====================================================
  
  async createChannel(tenantId: string, channel: InsertOmnibridgeChannel): Promise<OmnibridgeChannel> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [created] = await tenantDb
      .insert(omnibridgeChannels)
      .values({ ...channel, tenantId })
      .returning();
    
    return created;
  }

  async getChannels(tenantId: string, options?: {
    channelType?: ChannelType;
    isActive?: boolean;
    isMonitoring?: boolean;
    healthStatus?: string;
  }): Promise<OmnibridgeChannel[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    let query = tenantDb
      .select()
      .from(omnibridgeChannels)
      .where(eq(omnibridgeChannels.tenantId, tenantId));

    if (options?.channelType) {
      query = query.where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.channelType, options.channelType)
      ));
    }

    if (options?.isActive !== undefined) {
      query = query.where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.isActive, options.isActive)
      ));
    }

    if (options?.isMonitoring !== undefined) {
      query = query.where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.isMonitoring, options.isMonitoring)
      ));
    }

    if (options?.healthStatus) {
      query = query.where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.healthStatus, options.healthStatus)
      ));
    }

    return await query.orderBy(asc(omnibridgeChannels.name));
  }

  async getChannelById(tenantId: string, channelId: string): Promise<OmnibridgeChannel | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [channel] = await tenantDb
      .select()
      .from(omnibridgeChannels)
      .where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.id, channelId)
      ))
      .limit(1);

    return channel || null;
  }

  async updateChannel(tenantId: string, channelId: string, updates: UpdateOmnibridgeChannel): Promise<OmnibridgeChannel | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [updated] = await tenantDb
      .update(omnibridgeChannels)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.id, channelId)
      ))
      .returning();

    return updated || null;
  }

  async deleteChannel(tenantId: string, channelId: string): Promise<boolean> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const result = await tenantDb
      .delete(omnibridgeChannels)
      .where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.id, channelId)
      ));

    return result.rowCount > 0;
  }

  async updateChannelHealth(tenantId: string, channelId: string, healthData: {
    healthStatus: string;
    lastHealthCheck: Date;
    errorCount?: number;
    lastError?: string;
  }): Promise<void> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    await tenantDb
      .update(omnibridgeChannels)
      .set({
        healthStatus: healthData.healthStatus,
        lastHealthCheck: healthData.lastHealthCheck,
        errorCount: healthData.errorCount,
        lastError: healthData.lastError,
        updatedAt: new Date()
      })
      .where(and(
        eq(omnibridgeChannels.tenantId, tenantId),
        eq(omnibridgeChannels.id, channelId)
      ));
  }

  async getChannelsByType(tenantId: string, channelType: ChannelType): Promise<OmnibridgeChannel[]> {
    return this.getChannels(tenantId, { channelType });
  }

  async getActiveChannels(tenantId: string): Promise<OmnibridgeChannel[]> {
    return this.getChannels(tenantId, { isActive: true });
  }

  // =====================================================
  // INBOX MESSAGES - Core implementation for unified message management
  // =====================================================
  
  async saveInboxMessage(tenantId: string, message: InsertOmnibridgeInboxMessage): Promise<OmnibridgeInboxMessage> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [saved] = await tenantDb
      .insert(omnibridgeInbox)
      .values({ ...message, tenantId })
      .returning();
    
    return saved;
  }

  async getInboxMessages(tenantId: string, options?: {
    channelId?: string;
    channelType?: ChannelType;
    direction?: MessageDirection;
    priority?: MessagePriority;
    isRead?: boolean;
    isProcessed?: boolean;
    isArchived?: boolean;
    needsResponse?: boolean;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<OmnibridgeInboxMessage[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    let query = tenantDb
      .select()
      .from(omnibridgeInbox)
      .where(eq(omnibridgeInbox.tenantId, tenantId));

    // Apply filters
    const conditions = [eq(omnibridgeInbox.tenantId, tenantId)];

    if (options?.channelId) {
      conditions.push(eq(omnibridgeInbox.channelId, options.channelId));
    }

    if (options?.channelType) {
      conditions.push(eq(omnibridgeInbox.channelType, options.channelType));
    }

    if (options?.direction) {
      conditions.push(eq(omnibridgeInbox.direction, options.direction));
    }

    if (options?.priority) {
      conditions.push(eq(omnibridgeInbox.priority, options.priority));
    }

    if (options?.isRead !== undefined) {
      conditions.push(eq(omnibridgeInbox.isRead, options.isRead));
    }

    if (options?.isProcessed !== undefined) {
      conditions.push(eq(omnibridgeInbox.isProcessed, options.isProcessed));
    }

    if (options?.isArchived !== undefined) {
      conditions.push(eq(omnibridgeInbox.isArchived, options.isArchived));
    }

    if (options?.needsResponse !== undefined) {
      conditions.push(eq(omnibridgeInbox.needsResponse, options.needsResponse));
    }

    if (options?.fromDate) {
      conditions.push(gte(omnibridgeInbox.receivedAt, options.fromDate));
    }

    if (options?.toDate) {
      conditions.push(lte(omnibridgeInbox.receivedAt, options.toDate));
    }

    if (options?.search) {
      conditions.push(
        or(
          ilike(omnibridgeInbox.subject, `%${options.search}%`),
          ilike(omnibridgeInbox.bodyText, `%${options.search}%`),
          ilike(omnibridgeInbox.fromContact, `%${options.search}%`),
          ilike(omnibridgeInbox.fromName, `%${options.search}%`)
        )
      );
    }

    query = query.where(and(...conditions));
    query = query.orderBy(desc(omnibridgeInbox.receivedAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async getInboxMessageById(tenantId: string, messageId: string): Promise<OmnibridgeInboxMessage | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [message] = await tenantDb
      .select()
      .from(omnibridgeInbox)
      .where(and(
        eq(omnibridgeInbox.tenantId, tenantId),
        eq(omnibridgeInbox.id, messageId)
      ))
      .limit(1);

    return message || null;
  }

  async updateInboxMessage(tenantId: string, messageId: string, updates: UpdateOmnibridgeInboxMessage): Promise<OmnibridgeInboxMessage | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [updated] = await tenantDb
      .update(omnibridgeInbox)
      .set(updates)
      .where(and(
        eq(omnibridgeInbox.tenantId, tenantId),
        eq(omnibridgeInbox.id, messageId)
      ))
      .returning();

    return updated || null;
  }

  async deleteInboxMessage(tenantId: string, messageId: string): Promise<boolean> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const result = await tenantDb
      .delete(omnibridgeInbox)
      .where(and(
        eq(omnibridgeInbox.tenantId, tenantId),
        eq(omnibridgeInbox.id, messageId)
      ));

    return result.rowCount > 0;
  }

  async markMessageAsRead(tenantId: string, messageId: string): Promise<void> {
    await this.updateInboxMessage(tenantId, messageId, { isRead: true });
  }

  async markMessageAsProcessed(tenantId: string, messageId: string, processingData: {
    processingRuleId?: string;
    ticketId?: string;
    processedAt: Date;
  }): Promise<void> {
    await this.updateInboxMessage(tenantId, messageId, {
      isProcessed: true,
      processingRuleId: processingData.processingRuleId,
      ticketId: processingData.ticketId,
      processedAt: processingData.processedAt
    });
  }

  async archiveMessage(tenantId: string, messageId: string): Promise<void> {
    await this.updateInboxMessage(tenantId, messageId, { isArchived: true });
  }

  async searchMessages(tenantId: string, query: string, filters?: {
    channelType?: ChannelType;
    dateRange?: { from: Date; to: Date };
  }): Promise<OmnibridgeInboxMessage[]> {
    return this.getInboxMessages(tenantId, {
      search: query,
      channelType: filters?.channelType,
      fromDate: filters?.dateRange?.from,
      toDate: filters?.dateRange?.to
    });
  }

  async getMessagesByThread(tenantId: string, threadId: string): Promise<OmnibridgeInboxMessage[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    return await tenantDb
      .select()
      .from(omnibridgeInbox)
      .where(and(
        eq(omnibridgeInbox.tenantId, tenantId),
        eq(omnibridgeInbox.threadId, threadId)
      ))
      .orderBy(asc(omnibridgeInbox.receivedAt));
  }

  async getUnreadMessagesCount(tenantId: string, channelId?: string): Promise<number> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const conditions = [
      eq(omnibridgeInbox.tenantId, tenantId)
    ];

    // Check if isRead column exists in the current schema
    try {
      if (channelId) {
        conditions.push(eq(omnibridgeInbox.channelId, channelId));
      }

      const [result] = await tenantDb
        .select({ count: sql<number>`count(*)` })
        .from(omnibridgeInbox)
        .where(and(...conditions));

      return result.count || 0;
    } catch (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }
  }

  // =====================================================
  // PROCESSING RULES
  // =====================================================

  async createProcessingRule(tenantId: string, rule: InsertOmnibridgeProcessingRule): Promise<OmnibridgeProcessingRule> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [created] = await tenantDb
      .insert(omnibridgeProcessingRules)
      .values({ ...rule, tenantId })
      .returning();
    
    return created;
  }

  async getProcessingRules(tenantId: string, options?: {
    isActive?: boolean;
    channelType?: ChannelType;
    actionType?: string;
    priority?: number;
  }): Promise<OmnibridgeProcessingRule[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const conditions = [eq(omnibridgeProcessingRules.tenantId, tenantId)];

    if (options?.isActive !== undefined) {
      conditions.push(eq(omnibridgeProcessingRules.isActive, options.isActive));
    }

    if (options?.actionType) {
      conditions.push(eq(omnibridgeProcessingRules.actionType, options.actionType));
    }

    if (options?.priority !== undefined) {
      conditions.push(eq(omnibridgeProcessingRules.priority, options.priority));
    }

    let query = tenantDb
      .select()
      .from(omnibridgeProcessingRules)
      .where(and(...conditions));

    // For channel type filtering, we need to check the JSON array
    if (options?.channelType) {
      query = query.where(
        sql`${omnibridgeProcessingRules.applicableChannels} @> ${JSON.stringify([options.channelType])}`
      );
    }

    return await query.orderBy(desc(omnibridgeProcessingRules.priority));
  }

  async getProcessingRuleById(tenantId: string, ruleId: string): Promise<OmnibridgeProcessingRule | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [rule] = await tenantDb
      .select()
      .from(omnibridgeProcessingRules)
      .where(and(
        eq(omnibridgeProcessingRules.tenantId, tenantId),
        eq(omnibridgeProcessingRules.id, ruleId)
      ))
      .limit(1);

    return rule || null;
  }

  async updateProcessingRule(tenantId: string, ruleId: string, updates: UpdateOmnibridgeProcessingRule): Promise<OmnibridgeProcessingRule | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [updated] = await tenantDb
      .update(omnibridgeProcessingRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(omnibridgeProcessingRules.tenantId, tenantId),
        eq(omnibridgeProcessingRules.id, ruleId)
      ))
      .returning();

    return updated || null;
  }

  async deleteProcessingRule(tenantId: string, ruleId: string): Promise<boolean> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const result = await tenantDb
      .delete(omnibridgeProcessingRules)
      .where(and(
        eq(omnibridgeProcessingRules.tenantId, tenantId),
        eq(omnibridgeProcessingRules.id, ruleId)
      ));

    return result.rowCount > 0;
  }

  async incrementRuleExecution(tenantId: string, ruleId: string, executionTimeMs: number): Promise<void> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    await tenantDb
      .update(omnibridgeProcessingRules)
      .set({
        executionCount: sql`${omnibridgeProcessingRules.executionCount} + 1`,
        lastExecuted: new Date(),
        averageExecutionTime: sql`(${omnibridgeProcessingRules.averageExecutionTime} * ${omnibridgeProcessingRules.executionCount} + ${executionTimeMs}) / (${omnibridgeProcessingRules.executionCount} + 1)`,
        updatedAt: new Date()
      })
      .where(and(
        eq(omnibridgeProcessingRules.tenantId, tenantId),
        eq(omnibridgeProcessingRules.id, ruleId)
      ));
  }

  async getRulesByChannel(tenantId: string, channelType: ChannelType): Promise<OmnibridgeProcessingRule[]> {
    return this.getProcessingRules(tenantId, { channelType, isActive: true });
  }

  async getMatchingRules(tenantId: string, message: OmnibridgeInboxMessage): Promise<OmnibridgeProcessingRule[]> {
    // This is a simplified implementation - in production, you'd want more sophisticated matching
    return this.getRulesByChannel(tenantId, message.channelType);
  }

  // =====================================================
  // RESPONSE TEMPLATES - Stubbed implementation
  // =====================================================

  async createResponseTemplate(tenantId: string, template: InsertOmnibridgeResponseTemplate): Promise<OmnibridgeResponseTemplate> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [created] = await tenantDb
      .insert(omnibridgeResponseTemplates)
      .values({ ...template, tenantId })
      .returning();
    
    return created;
  }

  async getResponseTemplates(tenantId: string, options?: {
    templateType?: string;
    category?: string;
    channelType?: ChannelType;
    isActive?: boolean;
    languageCode?: string;
  }): Promise<OmnibridgeResponseTemplate[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const conditions = [eq(omnibridgeResponseTemplates.tenantId, tenantId)];

    if (options?.templateType) {
      conditions.push(eq(omnibridgeResponseTemplates.templateType, options.templateType));
    }

    if (options?.category) {
      conditions.push(eq(omnibridgeResponseTemplates.category, options.category));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(omnibridgeResponseTemplates.isActive, options.isActive));
    }

    if (options?.languageCode) {
      conditions.push(eq(omnibridgeResponseTemplates.languageCode, options.languageCode));
    }

    let query = tenantDb
      .select()
      .from(omnibridgeResponseTemplates)
      .where(and(...conditions));

    if (options?.channelType) {
      query = query.where(
        sql`${omnibridgeResponseTemplates.supportedChannels} @> ${JSON.stringify([options.channelType])}`
      );
    }

    return await query.orderBy(desc(omnibridgeResponseTemplates.priority));
  }

  async getResponseTemplateById(tenantId: string, templateId: string): Promise<OmnibridgeResponseTemplate | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [template] = await tenantDb
      .select()
      .from(omnibridgeResponseTemplates)
      .where(and(
        eq(omnibridgeResponseTemplates.tenantId, tenantId),
        eq(omnibridgeResponseTemplates.id, templateId)
      ))
      .limit(1);

    return template || null;
  }

  async updateResponseTemplate(tenantId: string, templateId: string, updates: UpdateOmnibridgeResponseTemplate): Promise<OmnibridgeResponseTemplate | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [updated] = await tenantDb
      .update(omnibridgeResponseTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(omnibridgeResponseTemplates.tenantId, tenantId),
        eq(omnibridgeResponseTemplates.id, templateId)
      ))
      .returning();

    return updated || null;
  }

  async deleteResponseTemplate(tenantId: string, templateId: string): Promise<boolean> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const result = await tenantDb
      .delete(omnibridgeResponseTemplates)
      .where(and(
        eq(omnibridgeResponseTemplates.tenantId, tenantId),
        eq(omnibridgeResponseTemplates.id, templateId)
      ));

    return result.rowCount > 0;
  }

  async incrementTemplateUsage(tenantId: string, templateId: string): Promise<void> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    await tenantDb
      .update(omnibridgeResponseTemplates)
      .set({
        usageCount: sql`${omnibridgeResponseTemplates.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(omnibridgeResponseTemplates.tenantId, tenantId),
        eq(omnibridgeResponseTemplates.id, templateId)
      ));
  }

  async getTemplatesByChannel(tenantId: string, channelType: ChannelType): Promise<OmnibridgeResponseTemplate[]> {
    return this.getResponseTemplates(tenantId, { channelType, isActive: true });
  }

  // =====================================================
  // SIGNATURES, LOGS, ANALYTICS - Stubbed implementations
  // =====================================================

  async createSignature(tenantId: string, signature: InsertOmnibridgeSignature): Promise<OmnibridgeSignature> {
    // Stub implementation - return mock data
    return {
      id: 'stub-signature-id',
      tenantId,
      ...signature,
      createdAt: new Date(),
      updatedAt: new Date()
    } as OmnibridgeSignature;
  }

  async getSignatures(tenantId: string, options?: any): Promise<OmnibridgeSignature[]> {
    return [];
  }

  async getSignatureById(tenantId: string, signatureId: string): Promise<OmnibridgeSignature | null> {
    return null;
  }

  async updateSignature(tenantId: string, signatureId: string, updates: any): Promise<OmnibridgeSignature | null> {
    return null;
  }

  async deleteSignature(tenantId: string, signatureId: string): Promise<boolean> {
    return false;
  }

  async getDefaultSignature(tenantId: string, supportGroup: string): Promise<OmnibridgeSignature | null> {
    return null;
  }

  async getSignaturesByGroup(tenantId: string, supportGroup: string): Promise<OmnibridgeSignature[]> {
    return [];
  }

  async logProcessing(tenantId: string, log: InsertOmnibridgeProcessingLog): Promise<OmnibridgeProcessingLog> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const [logged] = await tenantDb
      .insert(omnibridgeProcessingLogs)
      .values({ ...log, tenantId })
      .returning();
    
    return logged;
  }

  async getProcessingLogs(tenantId: string, options?: any): Promise<OmnibridgeProcessingLog[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    return await tenantDb
      .select()
      .from(omnibridgeProcessingLogs)
      .where(eq(omnibridgeProcessingLogs.tenantId, tenantId))
      .orderBy(desc(omnibridgeProcessingLogs.processedAt))
      .limit(100);
  }

  async getProcessingLogById(tenantId: string, logId: string): Promise<OmnibridgeProcessingLog | null> {
    return null;
  }

  async getProcessingStats(tenantId: string, timeRange: any): Promise<any> {
    return {
      totalProcessed: 0,
      successRate: 100,
      averageProcessingTime: 250,
      errorCount: 0,
      byChannel: {},
      byStatus: {}
    };
  }

  async saveAnalytics(tenantId: string, analytics: InsertOmnibridgeAnalytics): Promise<OmnibridgeAnalytics> {
    return {} as OmnibridgeAnalytics;
  }

  async getAnalytics(tenantId: string, options: any): Promise<OmnibridgeAnalytics[]> {
    return [];
  }

  async getDashboardMetrics(tenantId: string, timeRange: any): Promise<any> {
    return {
      totalMessages: 0,
      inboundMessages: 0,
      outboundMessages: 0,
      activeChannels: 0,
      averageResponseTime: 0,
      ticketsCreated: 0,
      escalationsTriggered: 0,
      topChannels: [],
      performanceMetrics: []
    };
  }

  async getChannelPerformance(tenantId: string, channelId: string, timeRange: any): Promise<any> {
    return {
      messageVolume: [],
      responseTime: [],
      errorRate: [],
      uptime: []
    };
  }

  async performHealthCheck(tenantId: string): Promise<any> {
    return {
      overallHealth: 'healthy',
      channels: [],
      systemMetrics: {
        messageProcessingRate: 100,
        averageResponseTime: 250,
        errorRate: 0
      }
    };
  }

  async cleanupOldLogs(tenantId: string, olderThan: Date): Promise<number> {
    return 0;
  }

  async archiveOldMessages(tenantId: string, olderThan: Date): Promise<number> {
    return 0;
  }

  async optimizeAnalytics(tenantId: string): Promise<void> {
    // No-op for now
  }
}