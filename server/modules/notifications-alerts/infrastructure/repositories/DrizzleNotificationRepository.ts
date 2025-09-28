// INFRASTRUCTURE REPOSITORY - Clean Architecture
// Infrastructure layer - Database implementation using Drizzle ORM

import { db } from '../../../../db';
import { 
  notifications,
  type NotificationTypeEnum,
  type NotificationPriorityEnum,
  type NotificationChannelEnum,
  type NotificationStatusEnum
} from '@shared/schema-tenant';
import { eq, and, inArray, desc, asc, gte, lte, count, sql } from 'drizzle-orm';
import { NotificationEntity } from '../../domain/entities/Notification';
import { 
  INotificationRepository, 
  NotificationFilters, 
  NotificationStats 
} from '../../domain/repositories/INotificationRepository';

export class DrizzleNotificationRepository implements INotificationRepository {
  
  async create(notification: NotificationEntity, tenantId: string): Promise<NotificationEntity> {
    try {
      // Map to the correct structure for the existing table
      const primaryChannel = notification.getChannels()[0] || 'in_app'; // Use first channel or default
      const notificationType = notification.getType() === 'automation_notification' ? 'info' : notification.getType();
      
      // Map severity to valid enum values
      let priority = notification.getSeverity();
      if (priority === 'medium' || priority === 'critical' || priority === 'emergency') {
        priority = 'normal'; // Map unsupported values to 'normal'
      }

      const insertValues = {
        id: notification.getId(),
        tenant_id: tenantId,
        user_id: notification.getUserId() || '', // Make sure it's not null
        title: notification.getTitle(),
        message: notification.getMessage(),
        type: notificationType, // Use enum value
        severity: priority, // Use severity instead of priority (matches public table structure)
        channels: [primaryChannel], // Use array format for channels
        status: notification.getStatus(),
        scheduled_at: notification.getScheduledAt(),
        metadata: notification.getMetadata(),
        created_at: notification.getCreatedAt()
      };

      console.log('🔍 [DrizzleNotificationRepository] Creating notification with mapped values:', {
        id: insertValues.id,
        type: insertValues.type,
        severity: insertValues.severity,
        channels: insertValues.channels,
        user_id: insertValues.user_id,
        metadata: insertValues.metadata,
        metadataStringified: JSON.stringify(insertValues.metadata)
      });

      // Use raw SQL to bypass Drizzle schema conflicts
      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier('tenant_' + tenantId.replace(/-/g, '_'))}.notifications 
        (id, tenant_id, user_id, title, message, type, severity, channels, status, scheduled_for, metadata, created_at)
        VALUES (
          ${insertValues.id},
          ${insertValues.tenant_id},
          ${insertValues.user_id || null},
          ${insertValues.title},
          ${insertValues.message || null},
          ${insertValues.type},
          ${insertValues.severity},
          ${JSON.stringify(insertValues.channels)},
          ${insertValues.status},
          ${insertValues.scheduled_at || null},
          ${JSON.stringify(insertValues.metadata)},
          ${insertValues.created_at || sql`NOW()`}
        )
        RETURNING *
      `);

      console.log('✅ [DrizzleNotificationRepository] SQL insert successful:', { 
        resultType: typeof result,
        hasRows: !!result.rows,
        rowCount: result.rows?.length 
      });

      // Return mock entity since the insert was successful
      return new NotificationEntity(
        insertValues.id,
        insertValues.type,
        insertValues.severity,
        insertValues.title,
        insertValues.message || '',
        insertValues.channels,
        insertValues.status,
        insertValues.user_id,
        insertValues.metadata,
        insertValues.scheduled_at,
        insertValues.created_at
      );
    } catch (error) {
      console.error('❌ [DrizzleNotificationRepository] Database insert error:', {
        error: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorDetail: (error as any)?.detail,
        errorHint: (error as any)?.hint,
        position: (error as any)?.position,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<NotificationEntity | null> {
    const [result] = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.tenantId, tenantId),
        eq(notifications.isActive, true)
      ));

    return result ? this.mapToEntity(result) : null;
  }

  async update(notification: NotificationEntity, tenantId: string): Promise<NotificationEntity> {
    const [updated] = await db
      .update(notifications)
      .set({
        severity: notification.getSeverity(),
        status: notification.getStatus(),
        sentAt: notification.getSentAt(),
        deliveredAt: notification.getDeliveredAt(),
        failedAt: notification.getFailedAt(),
        retryCount: notification.getRetryCount(),
        metadata: notification.getMetadata(),
        updatedAt: new Date()
      })
      .where(and(
        eq(notifications.id, notification.getId()),
        eq(notifications.tenantId, tenantId)
      ))
      .returning();

    return this.mapToEntity(updated);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.tenantId, tenantId)
      ))
      .returning({ id: notifications.id });

    return result.length > 0;
  }

  async findMany(
    filters: NotificationFilters, 
    tenantId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<NotificationEntity[]> {
    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.isActive, true)
    ];

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(notifications.status, filters.status));
    }

    if (filters.type && filters.type.length > 0) {
      conditions.push(inArray(notifications.type, filters.type));
    }

    if (filters.severity && filters.severity.length > 0) {
      conditions.push(inArray(notifications.severity, filters.severity));
    }

    if (filters.userId) {
      conditions.push(eq(notifications.userId, filters.userId));
    }

    if (filters.relatedEntityType) {
      conditions.push(eq(notifications.relatedEntityType, filters.relatedEntityType));
    }

    if (filters.relatedEntityId) {
      conditions.push(eq(notifications.relatedEntityId, filters.relatedEntityId));
    }

    if (filters.scheduledBefore) {
      conditions.push(lte(notifications.scheduledAt, filters.scheduledBefore));
    }

    if (filters.scheduledAfter) {
      conditions.push(gte(notifications.scheduledAt, filters.scheduledAfter));
    }

    if (filters.createdBefore) {
      conditions.push(lte(notifications.createdAt, filters.createdBefore));
    }

    if (filters.createdAfter) {
      conditions.push(gte(notifications.createdAt, filters.createdAfter));
    }

    // Handle expired filter
    if (filters.isExpired !== undefined) {
      const now = new Date();
      if (filters.isExpired) {
        conditions.push(lte(notifications.expiresAt, now));
      } else {
        // Not expired (null expires_at OR expires_at > now)
        conditions.push(
          sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > ${now})`
        );
      }
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => this.mapToEntity(result));
  }

  async count(filters: NotificationFilters, tenantId: string): Promise<number> {
    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.isActive, true)
    ];

    // Apply same filters as findMany (code reuse pattern)
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(notifications.status, filters.status));
    }
    // ... other filters would be applied here

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(...conditions));

    return result.count;
  }

  async findPendingForProcessing(tenantId: string, limit: number = 100): Promise<NotificationEntity[]> {
    const now = new Date();
    
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.isActive, true),
        inArray(notifications.status, ['pending', 'scheduled']),
        lte(notifications.scheduledAt, now),
        // Not expired
        sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > ${now})`
      ))
      .orderBy(
        desc(notifications.severity), // Critical first
        asc(notifications.scheduledAt)  // Older first
      )
      .limit(limit);

    return results.map(result => this.mapToEntity(result));
  }

  async findExpiredNotifications(tenantId: string): Promise<NotificationEntity[]> {
    const now = new Date();
    
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.isActive, true),
        lte(notifications.expiresAt, now),
        inArray(notifications.status, ['pending', 'scheduled', 'sent'])
      ));

    return results.map(result => this.mapToEntity(result));
  }

  async findNotificationsRequiringEscalation(tenantId: string): Promise<NotificationEntity[]> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.isActive, true),
        eq(notifications.severity, 'critical'),
        eq(notifications.status, 'pending'),
        lte(notifications.scheduledAt, fifteenMinutesAgo)
      ));

    return results.map(result => this.mapToEntity(result));
  }

  async findFailedNotificationsForRetry(tenantId: string): Promise<NotificationEntity[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.isActive, true),
        eq(notifications.status, 'failed'),
        gte(notifications.failedAt, oneHourAgo),
        sql`${notifications.retryCount} < ${notifications.maxRetries}`
      ))
      .orderBy(desc(notifications.severity));

    return results.map(result => this.mapToEntity(result));
  }

  async findByUserId(
    userId: string, 
    tenantId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<NotificationEntity[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        eq(notifications.isActive, true)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => this.mapToEntity(result));
  }

  async findByRelatedEntity(
    entityType: string, 
    entityId: string, 
    tenantId: string
  ): Promise<NotificationEntity[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.relatedEntityType, entityType),
        eq(notifications.relatedEntityId, entityId),
        eq(notifications.isActive, true)
      ))
      .orderBy(desc(notifications.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findSystemAlerts(
    tenantId: string, 
    severity?: NotificationSeverity
  ): Promise<NotificationEntity[]> {
    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.isActive, true),
      sql`${notifications.type} LIKE 'system_%'`
    ];

    if (severity) {
      conditions.push(eq(notifications.severity, severity));
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return results.map(result => this.mapToEntity(result));
  }

  async findTicketNotifications(ticketId: string, tenantId: string): Promise<NotificationEntity[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.relatedEntityType, 'ticket'),
        eq(notifications.relatedEntityId, ticketId),
        eq(notifications.isActive, true)
      ))
      .orderBy(desc(notifications.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async findUserNotifications(
    userId: string, 
    tenantId: string, 
    unreadOnly: boolean = false
  ): Promise<NotificationEntity[]> {
    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.userId, userId),
      eq(notifications.isActive, true)
    ];

    if (unreadOnly) {
      conditions.push(sql`${notifications.readAt} IS NULL`);
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return results.map(result => this.mapToEntity(result));
  }

  async getNotificationStats(
    tenantId: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<NotificationStats> {
    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.isActive, true)
    ];

    if (dateRange) {
      conditions.push(
        gte(notifications.createdAt, dateRange.from),
        lte(notifications.createdAt, dateRange.to)
      );
    }

    // Get basic counts
    const [totalResult] = await db
      .select({ total: count() })
      .from(notifications)
      .where(and(...conditions));

    const [statusCounts] = await db
      .select({
        pending: count(sql`CASE WHEN ${notifications.status} = 'pending' THEN 1 END`),
        sent: count(sql`CASE WHEN ${notifications.status} = 'sent' THEN 1 END`),
        delivered: count(sql`CASE WHEN ${notifications.status} = 'delivered' THEN 1 END`),
        failed: count(sql`CASE WHEN ${notifications.status} = 'failed' THEN 1 END`),
        expired: count(sql`CASE WHEN ${notifications.status} = 'expired' THEN 1 END`)
      })
      .from(notifications)
      .where(and(...conditions));

    // Get type and severity distribution
    const typeDistribution = await db
      .select({
        type: notifications.type,
        count: count()
      })
      .from(notifications)
      .where(and(...conditions))
      .groupBy(notifications.type);

    const severityDistribution = await db
      .select({
        severity: notifications.severity,
        count: count()
      })
      .from(notifications)
      .where(and(...conditions))
      .groupBy(notifications.severity);

    // Get recent activity
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentActivity] = await db
      .select({
        last24Hours: count(sql`CASE WHEN ${notifications.createdAt} >= ${last24Hours} THEN 1 END`),
        lastWeek: count(sql`CASE WHEN ${notifications.createdAt} >= ${lastWeek} THEN 1 END`),
        lastMonth: count(sql`CASE WHEN ${notifications.createdAt} >= ${lastMonth} THEN 1 END`)
      })
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.isActive, true)
      ));

    return {
      total: totalResult.total,
      pending: statusCounts.pending,
      sent: statusCounts.sent,
      delivered: statusCounts.delivered,
      failed: statusCounts.failed,
      expired: statusCounts.expired,
      byType: typeDistribution.reduce((acc, item) => {
        acc[item.type] = item.count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: severityDistribution.reduce((acc, item) => {
        acc[item.severity] = item.count;
        return acc;
      }, {} as Record<string, number>),
      byChannel: {}, // TODO: Implement channel-based stats
      recentActivity: {
        last24Hours: recentActivity.last24Hours,
        lastWeek: recentActivity.lastWeek,
        lastMonth: recentActivity.lastMonth
      }
    };
  }

  async getDeliveryRates(
    tenantId: string, 
    channel?: string
  ): Promise<{ channel: string; deliveryRate: number; totalSent: number }[]> {
    // This would need to query the delivery log table
    // Implementation would join with notificationDeliveryLog
    return []; // Placeholder
  }

  async getEngagementStats(tenantId: string): Promise<{
    openRate: number;
    clickRate: number;
    avgDeliveryTime: number;
  }> {
    // This would calculate engagement metrics from delivery log
    return {
      openRate: 0,
      clickRate: 0,
      avgDeliveryTime: 0
    }; // Placeholder
  }

  async markMultipleAsRead(notificationIds: string[], tenantId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ 
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        inArray(notifications.id, notificationIds),
        eq(notifications.tenantId, tenantId)
      ));

    return result.rowCount || 0;
  }

  async bulkUpdateStatus(
    notificationIds: string[], 
    status: NotificationStatus, 
    tenantId: string
  ): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(and(
        inArray(notifications.id, notificationIds),
        eq(notifications.tenantId, tenantId)
      ));

    return result.rowCount || 0;
  }

  async cleanupExpiredNotifications(tenantId: string, olderThan: Date): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ 
        isActive: false,
        status: 'expired',
        updatedAt: new Date()
      })
      .where(and(
        eq(notifications.tenantId, tenantId),
        lte(notifications.expiresAt, olderThan),
        eq(notifications.isActive, true)
      ));

    return result.rowCount || 0;
  }

  async findByChannel(
    channel: string, 
    tenantId: string, 
    status?: NotificationStatus
  ): Promise<NotificationEntity[]> {
    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.isActive, true),
      sql`${notifications.channels} @> ${[channel]}` // PostgreSQL array contains
    ];

    if (status) {
      conditions.push(eq(notifications.status, status));
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));

    return results.map(result => this.mapToEntity(result));
  }

  async getChannelHealthStats(tenantId: string): Promise<{
    channel: string;
    successRate: number;
    lastUsed: Date | null;
  }[]> {
    // This would analyze delivery log for channel health
    return []; // Placeholder
  }

  private mapToEntity(notification: Notification): NotificationEntity {
    return new NotificationEntity(
      notification.id,
      notification.tenantId,
      notification.type,
      notification.severity as NotificationSeverity,
      notification.title,
      notification.message,
      notification.metadata || {},
      notification.channels as any[], // Type conversion
      notification.status as NotificationStatus,
      notification.scheduledAt,
      notification.expiresAt,
      notification.sentAt,
      notification.deliveredAt,
      notification.failedAt,
      notification.relatedEntityType,
      notification.relatedEntityId,
      notification.userId,
      notification.retryCount || 0,
      notification.maxRetries || 3,
      notification.createdAt,
      notification.updatedAt
    );
  }
}