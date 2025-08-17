// ✅ 1QA.MD COMPLIANCE: DRIZZLE NOTIFICATION REPOSITORY
// Infrastructure layer - Database implementation using Drizzle ORM

import { db, sql, notifications } from '@shared/schema';
import { eq, and, desc, asc, count, isNull, inArray, gte, lte } from 'drizzle-orm';
import { INotificationRepository, NotificationStats } from '../../domain/repositories/INotificationRepository';
import { Notification, NotificationEntity } from '../../domain/entities/Notification';

export class DrizzleNotificationRepository implements INotificationRepository {
  
  async findById(id: string, tenantId: string): Promise<Notification | null> {
    try {
      const [result] = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.id, id),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true)
        ));

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error('Error finding notification by ID:', error);
      return null;
    }
  }

  async findByUserId(userId: string, tenantId: string, limit = 50, offset = 0): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true)
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding notifications by user ID:', error);
      return [];
    }
  }

  async create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    try {
      const [result] = await db
        .insert(notifications)
        .values({
          ...notification,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return this.mapToEntity(result);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<Notification>): Promise<Notification | null> {
    try {
      const [result] = await db
        .update(notifications)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.id, id),
          eq(notifications.tenantId, tenantId)
        ))
        .returning();

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error('Error updating notification:', error);
      return null;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(notifications)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.id, id),
          eq(notifications.tenantId, tenantId)
        ))
        .returning();

      return !!result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async findPendingNotifications(tenantId: string, limit = 100): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.status, 'pending'),
          eq(notifications.isActive, true)
        ))
        .orderBy(asc(notifications.priority), asc(notifications.createdAt))
        .limit(limit);

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding pending notifications:', error);
      return [];
    }
  }

  async findByStatus(status: string, tenantId: string, limit = 50): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.status, status),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true)
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding notifications by status:', error);
      return [];
    }
  }

  async findByType(type: string, tenantId: string, limit = 50): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.type, type),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true)
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding notifications by type:', error);
      return [];
    }
  }

  async findByChannel(channel: string, tenantId: string, limit = 50): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.channel, channel),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true)
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding notifications by channel:', error);
      return [];
    }
  }

  async findUnreadByUserId(userId: string, tenantId: string): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true),
          isNull(notifications.readAt)
        ))
        .orderBy(desc(notifications.createdAt));

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding unread notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true),
          isNull(notifications.readAt)
        ));

      return result?.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markAsRead(id: string, tenantId: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(notifications)
        .set({
          readAt: new Date(),
          status: 'read',
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.id, id),
          eq(notifications.tenantId, tenantId)
        ))
        .returning();

      return !!result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<number> {
    try {
      const results = await db
        .update(notifications)
        .set({
          readAt: new Date(),
          status: 'read',
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isActive, true),
          isNull(notifications.readAt)
        ))
        .returning();

      return results.length;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  async findScheduledNotifications(tenantId: string, beforeDate?: Date): Promise<Notification[]> {
    try {
      const now = beforeDate || new Date();
      
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.status, 'scheduled'),
          eq(notifications.isActive, true),
          lte(notifications.scheduledAt, now)
        ))
        .orderBy(asc(notifications.scheduledAt));

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding scheduled notifications:', error);
      return [];
    }
  }

  async findRetryableNotifications(tenantId: string): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.status, 'failed'),
          eq(notifications.isActive, true),
          sql`${notifications.retryCount} < ${notifications.maxRetries}`
        ))
        .orderBy(asc(notifications.updatedAt));

      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      console.error('Error finding retryable notifications:', error);
      return [];
    }
  }

  async bulkUpdateStatus(ids: string[], status: string, tenantId: string): Promise<number> {
    try {
      const results = await db
        .update(notifications)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(and(
          inArray(notifications.id, ids),
          eq(notifications.tenantId, tenantId)
        ))
        .returning();

      return results.length;
    } catch (error) {
      console.error('Error bulk updating notification status:', error);
      return 0;
    }
  }

  async bulkDelete(ids: string[], tenantId: string): Promise<number> {
    try {
      const results = await db
        .update(notifications)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          inArray(notifications.id, ids),
          eq(notifications.tenantId, tenantId)
        ))
        .returning();

      return results.length;
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      return 0;
    }
  }

  async getNotificationStats(tenantId: string, fromDate?: Date, toDate?: Date): Promise<NotificationStats> {
    try {
      // Base query conditions
      const conditions = [eq(notifications.tenantId, tenantId)];
      
      if (fromDate) {
        conditions.push(gte(notifications.createdAt, fromDate));
      }
      
      if (toDate) {
        conditions.push(lte(notifications.createdAt, toDate));
      }

      // Get overall stats
      const [totalResult] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(...conditions));

      // This is a simplified version - in production you'd want more complex aggregations
      return {
        total: totalResult?.count || 0,
        byStatus: {},
        byType: {},
        byChannel: {},
        byPriority: {}
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        byStatus: {},
        byType: {},
        byChannel: {},
        byPriority: {}
      };
    }
  }

  async deleteExpiredNotifications(tenantId: string, beforeDate?: Date): Promise<number> {
    try {
      const cutoffDate = beforeDate || new Date();
      
      const results = await db
        .update(notifications)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.tenantId, tenantId),
          lte(notifications.expiresAt, cutoffDate),
          eq(notifications.isActive, true)
        ))
        .returning();

      return results.length;
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
      return 0;
    }
  }

  async deleteOldNotifications(tenantId: string, beforeDate: Date): Promise<number> {
    try {
      const results = await db
        .update(notifications)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.tenantId, tenantId),
          lte(notifications.createdAt, beforeDate),
          eq(notifications.isActive, true)
        ))
        .returning();

      return results.length;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }

  private mapToEntity(dbRecord: any): Notification {
    return new NotificationEntity(
      dbRecord.id,
      dbRecord.tenantId,
      dbRecord.userId,
      dbRecord.type,
      dbRecord.channel,
      dbRecord.title,
      dbRecord.message,
      dbRecord.status,
      dbRecord.priority,
      dbRecord.retryCount || 0,
      dbRecord.maxRetries || 3,
      dbRecord.isActive,
      dbRecord.createdAt,
      dbRecord.updatedAt,
      dbRecord.data,
      dbRecord.scheduledAt,
      dbRecord.sentAt,
      dbRecord.readAt,
      dbRecord.failureReason,
      dbRecord.expiresAt,
      dbRecord.sourceId,
      dbRecord.sourceType,
      dbRecord.createdBy,
      dbRecord.updatedBy
    );
  }
}