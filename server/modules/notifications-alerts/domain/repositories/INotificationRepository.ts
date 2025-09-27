// DOMAIN REPOSITORY INTERFACE - Clean Architecture
// Domain layer - Repository contract (interface only)

import { NotificationEntity } from '../entities/Notification';
import { NotificationType, NotificationSeverity, NotificationStatus } from '@shared/schema-notifications';

export interface NotificationFilters {
  status?: NotificationStatus[];
  type?: NotificationType[];
  severity?: NotificationSeverity[];
  userId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledBefore?: Date;
  scheduledAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
  isExpired?: boolean;
  channels?: string[];
}

export interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  expired: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byChannel: Record<string, number>;
  recentActivity: {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
  };
}

export interface INotificationRepository {
  // Basic CRUD operations
  create(notification: NotificationEntity, tenantId: string): Promise<NotificationEntity>;
  findById(id: string, tenantId: string): Promise<NotificationEntity | null>;
  update(notification: NotificationEntity, tenantId: string): Promise<NotificationEntity>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Query operations
  findMany(filters: NotificationFilters, tenantId: string, limit?: number, offset?: number): Promise<NotificationEntity[]>;
  count(filters: NotificationFilters, tenantId: string): Promise<number>;
  findByUserId(userId: string, tenantId: string, limit?: number, offset?: number): Promise<NotificationEntity[]>;
  
  // Business-specific queries
  findPendingForProcessing(tenantId: string, limit?: number): Promise<NotificationEntity[]>;
  findExpiredNotifications(tenantId: string): Promise<NotificationEntity[]>;
  findNotificationsRequiringEscalation(tenantId: string): Promise<NotificationEntity[]>;
  findFailedNotificationsForRetry(tenantId: string): Promise<NotificationEntity[]>;
  
  // Related entity queries
  findByRelatedEntity(entityType: string, entityId: string, tenantId: string): Promise<NotificationEntity[]>;
  findSystemAlerts(tenantId: string, severity?: NotificationSeverity): Promise<NotificationEntity[]>;
  findTicketNotifications(ticketId: string, tenantId: string): Promise<NotificationEntity[]>;
  findUserNotifications(userId: string, tenantId: string, unreadOnly?: boolean): Promise<NotificationEntity[]>;
  
  // Analytics and reporting
  getNotificationStats(tenantId: string, dateRange?: { from: Date; to: Date }): Promise<NotificationStats>;
  getDeliveryRates(tenantId: string, channel?: string): Promise<{ channel: string; deliveryRate: number; totalSent: number }[]>;
  getEngagementStats(tenantId: string): Promise<{ openRate: number; clickRate: number; avgDeliveryTime: number }>;
  
  // Bulk operations
  markMultipleAsRead(notificationIds: string[], tenantId: string): Promise<number>;
  bulkUpdateStatus(notificationIds: string[], status: NotificationStatus, tenantId: string): Promise<number>;
  cleanupExpiredNotifications(tenantId: string, olderThan: Date): Promise<number>;
  
  // Channel-specific queries
  findByChannel(channel: string, tenantId: string, status?: NotificationStatus): Promise<NotificationEntity[]>;
  getChannelHealthStats(tenantId: string): Promise<{ channel: string; successRate: number; lastUsed: Date | null }[]>;
}