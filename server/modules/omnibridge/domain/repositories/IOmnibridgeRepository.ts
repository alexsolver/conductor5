// =====================================================
// OMNIBRIDGE REPOSITORY INTERFACE
// Data access abstraction for unified communication management
// =====================================================

import {
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

export interface IOmnibridgeRepository {
  // =====================================================
  // COMMUNICATION CHANNELS
  // =====================================================
  
  // Create and manage communication channels
  createChannel(tenantId: string, channel: InsertOmnibridgeChannel): Promise<OmnibridgeChannel>;
  getChannels(tenantId: string, options?: {
    channelType?: ChannelType;
    isActive?: boolean;
    isMonitoring?: boolean;
    healthStatus?: string;
  }): Promise<OmnibridgeChannel[]>;
  getChannelById(tenantId: string, channelId: string): Promise<OmnibridgeChannel | null>;
  updateChannel(tenantId: string, channelId: string, updates: UpdateOmnibridgeChannel): Promise<OmnibridgeChannel | null>;
  deleteChannel(tenantId: string, channelId: string): Promise<boolean>;
  
  // Channel health and monitoring
  updateChannelHealth(tenantId: string, channelId: string, healthData: {
    healthStatus: string;
    lastHealthCheck: Date;
    errorCount?: number;
    lastError?: string;
  }): Promise<void>;
  getChannelsByType(tenantId: string, channelType: ChannelType): Promise<OmnibridgeChannel[]>;
  getActiveChannels(tenantId: string): Promise<OmnibridgeChannel[]>;
  
  // =====================================================
  // INBOX MESSAGES
  // =====================================================
  
  // Message management
  saveInboxMessage(tenantId: string, message: InsertOmnibridgeInboxMessage): Promise<OmnibridgeInboxMessage>;
  getInboxMessages(tenantId: string, options?: {
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
  }): Promise<OmnibridgeInboxMessage[]>;
  getInboxMessageById(tenantId: string, messageId: string): Promise<OmnibridgeInboxMessage | null>;
  updateInboxMessage(tenantId: string, messageId: string, updates: UpdateOmnibridgeInboxMessage): Promise<OmnibridgeInboxMessage | null>;
  deleteInboxMessage(tenantId: string, messageId: string): Promise<boolean>;
  
  // Message status updates
  markMessageAsRead(tenantId: string, messageId: string): Promise<void>;
  markMessageAsProcessed(tenantId: string, messageId: string, processingData: {
    processingRuleId?: string;
    ticketId?: string;
    processedAt: Date;
  }): Promise<void>;
  archiveMessage(tenantId: string, messageId: string): Promise<void>;
  
  // Message search and filtering
  searchMessages(tenantId: string, query: string, filters?: {
    channelType?: ChannelType;
    dateRange?: { from: Date; to: Date };
  }): Promise<OmnibridgeInboxMessage[]>;
  getMessagesByThread(tenantId: string, threadId: string): Promise<OmnibridgeInboxMessage[]>;
  getUnreadMessagesCount(tenantId: string, channelId?: string): Promise<number>;
  
  // =====================================================
  // PROCESSING RULES
  // =====================================================
  
  // Rule management
  createProcessingRule(tenantId: string, rule: InsertOmnibridgeProcessingRule): Promise<OmnibridgeProcessingRule>;
  getProcessingRules(tenantId: string, options?: {
    isActive?: boolean;
    channelType?: ChannelType;
    actionType?: string;
    priority?: number;
  }): Promise<OmnibridgeProcessingRule[]>;
  getProcessingRuleById(tenantId: string, ruleId: string): Promise<OmnibridgeProcessingRule | null>;
  updateProcessingRule(tenantId: string, ruleId: string, updates: UpdateOmnibridgeProcessingRule): Promise<OmnibridgeProcessingRule | null>;
  deleteProcessingRule(tenantId: string, ruleId: string): Promise<boolean>;
  
  // Rule execution tracking
  incrementRuleExecution(tenantId: string, ruleId: string, executionTimeMs: number): Promise<void>;
  getRulesByChannel(tenantId: string, channelType: ChannelType): Promise<OmnibridgeProcessingRule[]>;
  getMatchingRules(tenantId: string, message: OmnibridgeInboxMessage): Promise<OmnibridgeProcessingRule[]>;
  
  // =====================================================
  // RESPONSE TEMPLATES
  // =====================================================
  
  // Template management
  createResponseTemplate(tenantId: string, template: InsertOmnibridgeResponseTemplate): Promise<OmnibridgeResponseTemplate>;
  getResponseTemplates(tenantId: string, options?: {
    templateType?: string;
    category?: string;
    channelType?: ChannelType;
    isActive?: boolean;
    languageCode?: string;
  }): Promise<OmnibridgeResponseTemplate[]>;
  getResponseTemplateById(tenantId: string, templateId: string): Promise<OmnibridgeResponseTemplate | null>;
  updateResponseTemplate(tenantId: string, templateId: string, updates: UpdateOmnibridgeResponseTemplate): Promise<OmnibridgeResponseTemplate | null>;
  deleteResponseTemplate(tenantId: string, templateId: string): Promise<boolean>;
  
  // Template usage tracking
  incrementTemplateUsage(tenantId: string, templateId: string): Promise<void>;
  getTemplatesByChannel(tenantId: string, channelType: ChannelType): Promise<OmnibridgeResponseTemplate[]>;
  
  // =====================================================
  // TEAM SIGNATURES
  // =====================================================
  
  // Signature management
  createSignature(tenantId: string, signature: InsertOmnibridgeSignature): Promise<OmnibridgeSignature>;
  getSignatures(tenantId: string, options?: {
    supportGroup?: string;
    isActive?: boolean;
    isDefault?: boolean;
  }): Promise<OmnibridgeSignature[]>;
  getSignatureById(tenantId: string, signatureId: string): Promise<OmnibridgeSignature | null>;
  updateSignature(tenantId: string, signatureId: string, updates: UpdateOmnibridgeSignature): Promise<OmnibridgeSignature | null>;
  deleteSignature(tenantId: string, signatureId: string): Promise<boolean>;
  
  // Signature utilities
  getDefaultSignature(tenantId: string, supportGroup: string): Promise<OmnibridgeSignature | null>;
  getSignaturesByGroup(tenantId: string, supportGroup: string): Promise<OmnibridgeSignature[]>;
  
  // =====================================================
  // PROCESSING LOGS
  // =====================================================
  
  // Log management
  logProcessing(tenantId: string, log: InsertOmnibridgeProcessingLog): Promise<OmnibridgeProcessingLog>;
  getProcessingLogs(tenantId: string, options?: {
    channelId?: string;
    channelType?: ChannelType;
    processingStatus?: ProcessingStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<OmnibridgeProcessingLog[]>;
  getProcessingLogById(tenantId: string, logId: string): Promise<OmnibridgeProcessingLog | null>;
  
  // Log analytics
  getProcessingStats(tenantId: string, timeRange: {
    from: Date;
    to: Date;
  }): Promise<{
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    errorCount: number;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
  
  // =====================================================
  // ANALYTICS
  // =====================================================
  
  // Analytics data management
  saveAnalytics(tenantId: string, analytics: InsertOmnibridgeAnalytics): Promise<OmnibridgeAnalytics>;
  getAnalytics(tenantId: string, options: {
    from: Date;
    to: Date;
    channelId?: string;
    channelType?: ChannelType;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<OmnibridgeAnalytics[]>;
  
  // Dashboard metrics
  getDashboardMetrics(tenantId: string, timeRange: {
    from: Date;
    to: Date;
  }): Promise<{
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    activeChannels: number;
    averageResponseTime: number;
    ticketsCreated: number;
    escalationsTriggered: number;
    topChannels: Array<{ channelType: string; messageCount: number }>;
    performanceMetrics: Array<{ date: string; metrics: any }>;
  }>;
  
  // Channel performance metrics
  getChannelPerformance(tenantId: string, channelId: string, timeRange: {
    from: Date;
    to: Date;
  }): Promise<{
    messageVolume: Array<{ date: string; inbound: number; outbound: number }>;
    responseTime: Array<{ date: string; averageMinutes: number }>;
    errorRate: Array<{ date: string; percentage: number }>;
    uptime: Array<{ date: string; percentage: number }>;
  }>;
  
  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  // Health checks and monitoring
  performHealthCheck(tenantId: string): Promise<{
    overallHealth: string;
    channels: Array<{
      id: string;
      name: string;
      type: ChannelType;
      status: string;
      lastCheck: Date;
    }>;
    systemMetrics: {
      messageProcessingRate: number;
      averageResponseTime: number;
      errorRate: number;
    };
  }>;
  
  // Cleanup and maintenance
  cleanupOldLogs(tenantId: string, olderThan: Date): Promise<number>;
  archiveOldMessages(tenantId: string, olderThan: Date): Promise<number>;
  optimizeAnalytics(tenantId: string): Promise<void>;
}