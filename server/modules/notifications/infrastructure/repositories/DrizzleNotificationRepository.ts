/**
 * Drizzle Notification Repository
 * Clean Architecture - Infrastructure Layer
 */

import { eq, and, desc, count, sql } from 'drizzle-orm';
import { Notification } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { schemaManager } from '../../../../db';

export class DrizzleNotificationRepository implements INotificationRepository {
  async save(notification: Notification): Promise<void> {
    const { db } = await schemaManager.getTenantDb(notification.getTenantId());
    const { notifications } = await import('@shared/schema');

    await db.insert(notifications).values({
      id: notification.getId(),
      tenantId: notification.getTenantId(),
      userId: notification.getUserId(),
      type: notification.getType(),
      severity: notification.getSeverity(),
      title: notification.getTitle(),
      message: notification.getMessage(),
      metadata: notification.getMetadata(),
      channels: notification.getChannels(),
      status: notification.getStatus(),
      scheduledAt: notification.getScheduledAt(),
      expiresAt: notification.getExpiresAt(),
      sentAt: notification.getSentAt(),
      deliveredAt: notification.getDeliveredAt(),
      failedAt: notification.getFailedAt(),
      relatedEntityType: notification.getRelatedEntityType(),
      relatedEntityId: notification.getRelatedEntityId(),
      readAt: null,
      createdAt: notification.getCreatedAt(),
      updatedAt: notification.getUpdatedAt()
    });
  }

  async findById(id: string, tenantId: string): Promise<Notification | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.tenantId, tenantId)
      ))
      .limit(1);

    if (result.length === 0) return null;

    return Notification.fromPersistence(result[0]);
  }

  async findByUserId(userId: string, tenantId: string, limit = 20, offset = 0): Promise<Notification[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.tenantId, tenantId)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(row => Notification.fromPersistence(row));
  }

  async findPendingNotifications(tenantId: string): Promise<Notification[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.status, 'pending'),
        eq(notifications.tenantId, tenantId),
        sql`${notifications.scheduledAt} <= NOW()`
      ));

    return result.map(row => Notification.fromPersistence(row));
  }

  async findOverdueNotifications(tenantId: string): Promise<Notification[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.status, 'pending'),
        eq(notifications.tenantId, tenantId),
        sql`${notifications.scheduledAt} < NOW() - INTERVAL '15 minutes'`
      ));

    return result.map(row => Notification.fromPersistence(row));
  }

  async findByStatus(status: string, tenantId: string): Promise<Notification[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.status, status),
        eq(notifications.tenantId, tenantId)
      ))
      .orderBy(desc(notifications.createdAt));

    return result.map(row => Notification.fromPersistence(row));
  }

  async findByType(type: string, tenantId: string): Promise<Notification[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.type, type),
        eq(notifications.tenantId, tenantId)
      ))
      .orderBy(desc(notifications.createdAt));

    return result.map(row => Notification.fromPersistence(row));
  }

  async findBySeverity(severity: string, tenantId: string): Promise<Notification[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.severity, severity),
        eq(notifications.tenantId, tenantId)
      ))
      .orderBy(desc(notifications.createdAt));

    return result.map(row => Notification.fromPersistence(row));
  }

  async findByRelatedEntity(entityType: string, entityId: string, tenantId: string): Promise<Notification[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.relatedEntityType, entityType),
        eq(notifications.relatedEntityId, entityId),
        eq(notifications.tenantId, tenantId)
      ))
      .orderBy(desc(notifications.createdAt));

    return result.map(row => Notification.fromPersistence(row));
  }

  async update(notification: Notification): Promise<void> {
    const { db } = await schemaManager.getTenantDb(notification.getTenantId());
    const { notifications } = await import('@shared/schema');

    await db
      .update(notifications)
      .set({
        status: notification.getStatus(),
        sentAt: notification.getSentAt(),
        deliveredAt: notification.getDeliveredAt(),
        failedAt: notification.getFailedAt(),
        metadata: notification.getMetadata(),
        updatedAt: notification.getUpdatedAt()
      })
      .where(and(
        eq(notifications.id, notification.getId()),
        eq(notifications.tenantId, notification.getTenantId())
      ));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.tenantId, tenantId)
      ));
  }

  async countByUser(userId: string, tenantId: string): Promise<number> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.tenantId, tenantId)
      ));

    return result[0]?.count || 0;
  }

  async countUnreadByUser(userId: string, tenantId: string): Promise<number> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.tenantId, tenantId),
        sql`${notifications.readAt} IS NULL`
      ));

    return result[0]?.count || 0;
  }

  async markAsRead(id: string, tenantId: string): Promise<void> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    await db
      .update(notifications)
      .set({
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.tenantId, tenantId)
      ));
  }

  async markAllAsReadForUser(userId: string, tenantId: string): Promise<void> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    await db
      .update(notifications)
      .set({
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.tenantId, tenantId),
        sql`${notifications.readAt} IS NULL`
      ));
  }

  async getNotificationStats(tenantId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const { notifications } = await import('@shared/schema');

    // Get total counts
    const [totalResult, pendingResult, sentResult, failedResult] = await Promise.all([
      db.select({ count: count() }).from(notifications).where(eq(notifications.tenantId, tenantId)),
      db.select({ count: count() }).from(notifications).where(and(eq(notifications.tenantId, tenantId), eq(notifications.status, 'pending'))),
      db.select({ count: count() }).from(notifications).where(and(eq(notifications.tenantId, tenantId), eq(notifications.status, 'sent'))),
      db.select({ count: count() }).from(notifications).where(and(eq(notifications.tenantId, tenantId), eq(notifications.status, 'failed')))
    ]);

    // Get counts by type
    const typeResults = await db
      .select({
        type: notifications.type,
        count: count()
      })
      .from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .groupBy(notifications.type);

    // Get counts by severity
    const severityResults = await db
      .select({
        severity: notifications.severity,
        count: count()
      })
      .from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .groupBy(notifications.severity);

    const byType: Record<string, number> = {};
    typeResults.forEach(result => {
      byType[result.type] = result.count;
    });

    const bySeverity: Record<string, number> = {};
    severityResults.forEach(result => {
      bySeverity[result.severity] = result.count;
    });

    return {
      total: totalResult[0]?.count || 0,
      pending: pendingResult[0]?.count || 0,
      sent: sentResult[0]?.count || 0,
      failed: failedResult[0]?.count || 0,
      byType,
      bySeverity
    };
  }
}