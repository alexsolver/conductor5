// ✅ 1QA.MD COMPLIANCE: NOTIFICATION REPOSITORY INTERFACE
// Domain layer - Repository contracts for notification operations

import { Notification } from '../entities/Notification';

export interface INotificationRepository {
  // Basic CRUD operations
  findById(id: string, tenantId: string): Promise<Notification | null>;
  findByUserId(userId: string, tenantId: string, limit?: number, offset?: number): Promise<Notification[]>;
  create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
  update(id: string, tenantId: string, updates: Partial<Notification>): Promise<Notification | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Query operations for notifications
  findPendingNotifications(tenantId: string, limit?: number): Promise<Notification[]>;
  findByStatus(status: string, tenantId: string, limit?: number): Promise<Notification[]>;
  findByType(type: string, tenantId: string, limit?: number): Promise<Notification[]>;
  findByChannel(channel: string, tenantId: string, limit?: number): Promise<Notification[]>;
  
  // User-specific queries
  findUnreadByUserId(userId: string, tenantId: string): Promise<Notification[]>;
  getUnreadCount(userId: string, tenantId: string): Promise<number>;
  markAsRead(id: string, tenantId: string): Promise<boolean>;
  markAllAsRead(userId: string, tenantId: string): Promise<number>;

  // Scheduled notifications
  findScheduledNotifications(tenantId: string, beforeDate?: Date): Promise<Notification[]>;
  findRetryableNotifications(tenantId: string): Promise<Notification[]>;
  
  // Bulk operations
  bulkUpdateStatus(ids: string[], status: string, tenantId: string): Promise<number>;
  bulkDelete(ids: string[], tenantId: string): Promise<number>;
  
  // Analytics and cleanup
  getNotificationStats(tenantId: string, fromDate?: Date, toDate?: Date): Promise<NotificationStats>;
  deleteExpiredNotifications(tenantId: string, beforeDate?: Date): Promise<number>;
  deleteOldNotifications(tenantId: string, beforeDate: Date): Promise<number>;
}

export interface NotificationStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
  avgDeliveryTime?: number;
  successRate?: number;
}