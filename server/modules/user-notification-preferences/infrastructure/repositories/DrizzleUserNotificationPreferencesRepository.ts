// Infrastructure Layer - Repository implementation following 1qa.md Clean Architecture
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../db';
import { IUserNotificationPreferencesRepository } from '../../domain/repositories/IUserNotificationPreferencesRepository';
import { UserNotificationPreferences, NotificationPreferencesData } from '../../domain/entities/UserNotificationPreferences';
import { userNotificationPreferences } from '@shared/schema';

export class DrizzleUserNotificationPreferencesRepository implements IUserNotificationPreferencesRepository {
  
  async findByUserId(userId: string, tenantId: string): Promise<UserNotificationPreferences | null> {
    try {
      const result = await db
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, userId),
            eq(userNotificationPreferences.tenantId, tenantId)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return new UserNotificationPreferences(
        row.id,
        row.userId,
        row.tenantId,
        row.preferences as NotificationPreferencesData,
        row.createdAt,
        row.updatedAt
      );
    } catch (error) {
      console.error('[DRIZZLE-USER-NOTIFICATION-PREFERENCES-REPOSITORY] Error finding by user ID:', error);
      throw error;
    }
  }

  async create(
    userId: string,
    tenantId: string,
    preferences: NotificationPreferencesData
  ): Promise<UserNotificationPreferences> {
    try {
      const result = await db
        .insert(userNotificationPreferences)
        .values({
          userId,
          tenantId,
          preferences: preferences as any,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      const row = result[0];
      return new UserNotificationPreferences(
        row.id,
        row.userId,
        row.tenantId,
        row.preferences as NotificationPreferencesData,
        row.createdAt,
        row.updatedAt
      );
    } catch (error) {
      console.error('[DRIZZLE-USER-NOTIFICATION-PREFERENCES-REPOSITORY] Error creating preferences:', error);
      throw error;
    }
  }

  async update(
    userId: string,
    tenantId: string,
    preferences: NotificationPreferencesData
  ): Promise<UserNotificationPreferences> {
    try {
      const result = await db
        .update(userNotificationPreferences)
        .set({
          preferences: preferences as any,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userNotificationPreferences.userId, userId),
            eq(userNotificationPreferences.tenantId, tenantId)
          )
        )
        .returning();

      if (result.length === 0) {
        // If no existing record, create new one
        return await this.create(userId, tenantId, preferences);
      }

      const row = result[0];
      return new UserNotificationPreferences(
        row.id,
        row.userId,
        row.tenantId,
        row.preferences as NotificationPreferencesData,
        row.createdAt,
        row.updatedAt
      );
    } catch (error) {
      console.error('[DRIZZLE-USER-NOTIFICATION-PREFERENCES-REPOSITORY] Error updating preferences:', error);
      throw error;
    }
  }

  async delete(userId: string, tenantId: string): Promise<void> {
    try {
      await db
        .delete(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, userId),
            eq(userNotificationPreferences.tenantId, tenantId)
          )
        );
    } catch (error) {
      console.error('[DRIZZLE-USER-NOTIFICATION-PREFERENCES-REPOSITORY] Error deleting preferences:', error);
      throw error;
    }
  }
}