
/**
 * Notification Repository Interface
 * Clean Architecture - Domain Layer Port
 */

import { Notification } from '../entities/Notification';

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: string, tenantId: string): Promise<Notification | null>;
  findByUserId(userId: string, tenantId: string, limit?: number, offset?: number): Promise<Notification[]>;
  findPendingNotifications(tenantId: string): Promise<Notification[]>;
  findOverdueNotifications(tenantId: string): Promise<Notification[]>;
  findByStatus(status: string, tenantId: string): Promise<Notification[]>;
  findByType(type: string, tenantId: string): Promise<Notification[]>;
  findBySeverity(severity: string, tenantId: string): Promise<Notification[]>;
  findByRelatedEntity(entityType: string, entityId: string, tenantId: string): Promise<Notification[]>;
  update(notification: Notification): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
  countByUser(userId: string, tenantId: string): Promise<number>;
  countUnreadByUser(userId: string, tenantId: string): Promise<number>;
  markAsRead(id: string, tenantId: string): Promise<void>;
  markAllAsReadForUser(userId: string, tenantId: string): Promise<void>;
  getNotificationStats(tenantId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }>;
}
