/**
 * DrizzleNotificationPreferenceRepository
 * Clean Architecture - Infrastructure Layer
 */

import { eq, and } from 'drizzle-orm';
import { NotificationPreference } from '../../domain/entities/NotificationPreference';
import { INotificationPreferenceRepository } from '../../domain/ports/INotificationPreferenceRepository';
import { schemaManager } from '../../../../db';
import { notificationPreferences } from '../../../../../@shared/schema';

export class DrizzleNotificationPreferenceRepository implements INotificationPreferenceRepository {
  async save(preference: NotificationPreference): Promise<void> {
    const { db } = await schemaManager.getTenantDb(preference.getTenantId());
    await db.insert(notificationPreferences).values({
      id: preference.getId(),
      tenantId: preference.getTenantId(),
      userId: preference.getUserId(),
      notificationType: preference.getNotificationType(),
      channels: preference.getChannels(),
      enabled: preference.isEnabled(),
      scheduleSettings: preference.getScheduleSettings(),
      filters: preference.getFilters(),
      createdAt: preference.getCreatedAt(),
      updatedAt: preference.getUpdatedAt()
    });
  }

  async findById(id: string, tenantId: string): Promise<NotificationPreference | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.id, id),
          eq(notificationPreferences.tenantId, tenantId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return NotificationPreference.fromPersistence(result[0]);
  }

  async findByUserId(userId: string, tenantId: string): Promise<NotificationPreference[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const results = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.tenantId, tenantId)
        )
      );

    return results.map(result => NotificationPreference.fromPersistence(result));
  }

  async update(preference: NotificationPreference): Promise<void> {
    const { db } = await schemaManager.getTenantDb(preference.getTenantId());
    await db
      .update(notificationPreferences)
      .set({
        channels: preference.getChannels(),
        enabled: preference.isEnabled(),
        scheduleSettings: preference.getScheduleSettings(),
        filters: preference.getFilters(),
        updatedAt: preference.getUpdatedAt()
      })
      .where(
        and(
          eq(notificationPreferences.id, preference.getId()),
          eq(notificationPreferences.tenantId, preference.getTenantId())
        )
      );
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    await db
      .delete(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.id, id),
          eq(notificationPreferences.tenantId, tenantId)
        )
      );
  }

  async findByUserAndType(userId: string, notificationType: string, tenantId: string): Promise<NotificationPreference | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.notificationType, notificationType),
          eq(notificationPreferences.tenantId, tenantId)
        )
      )
      .limit(1);

    return result.length > 0 ? NotificationPreference.fromPersistence(result[0]) : null;
  }

  async findDefaultPreferences(tenantId: string): Promise<NotificationPreference[]> {
   const { db } = await schemaManager.getTenantDb(tenantId);
    const results = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.tenantId, tenantId));

    return results.map(result => NotificationPreference.fromPersistence(result));
  }
}