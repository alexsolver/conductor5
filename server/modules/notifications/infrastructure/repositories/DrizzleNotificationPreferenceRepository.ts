/**
 * DrizzleNotificationPreferenceRepository
 * Clean Architecture - Infrastructure Layer
 */

import { db } from '../../../../db';
import { notificationPreferences } from '../../../../../shared/schema-master';
import { INotificationPreferenceRepository } from '../../domain/ports/INotificationPreferenceRepository';
import { NotificationPreference } from '../../domain/entities/NotificationPreference';
import { eq, and } from 'drizzle-orm';

export class DrizzleNotificationPreferenceRepository implements INotificationPreferenceRepository {
  async save(preference: NotificationPreference): Promise<void> {
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
    await db
      .delete(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.id, id),
          eq(notificationPreferences.tenantId, tenantId)
        )
      );
  }

  async findDefaultPreferences(tenantId: string): Promise<NotificationPreference[]> {
    const results = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.tenantId, tenantId));

    return results.map(result => NotificationPreference.fromPersistence(result));
  }
}