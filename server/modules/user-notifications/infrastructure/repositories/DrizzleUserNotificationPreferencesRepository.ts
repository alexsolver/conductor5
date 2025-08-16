// Infrastructure Repository - Database implementation
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../db';
import { IUserNotificationPreferencesRepository } from '../../domain/repositories/IUserNotificationPreferencesRepository';
import { UserNotificationPreferences, NotificationPreferencesData } from '../../domain/entities/UserNotificationPreferences';

// Import database schema from shared schema
import { userNotificationPreferences } from '@shared/schema';

export class DrizzleUserNotificationPreferencesRepository implements IUserNotificationPreferencesRepository {
  
  async findByUserId(userId: string, tenantId: string): Promise<UserNotificationPreferences | null> {
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
  }

  async create(
    userId: string,
    tenantId: string,
    preferences: NotificationPreferencesData
  ): Promise<UserNotificationPreferences> {
    const result = await db
      .insert(userNotificationPreferences)
      .values({
        userId,
        tenantId,
        preferences: preferences as any,
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
  }

  async update(
    id: string,
    preferences: NotificationPreferencesData,
    tenantId: string
  ): Promise<UserNotificationPreferences> {
    const result = await db
      .update(userNotificationPreferences)
      .set({
        preferences: preferences as any,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userNotificationPreferences.id, id),
          eq(userNotificationPreferences.tenantId, tenantId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('User notification preferences not found');
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
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.id, id),
          eq(userNotificationPreferences.tenantId, tenantId)
        )
      );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async findByTenantId(tenantId: string, limit: number = 50, offset: number = 0): Promise<UserNotificationPreferences[]> {
    const results = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.tenantId, tenantId))
      .limit(limit)
      .offset(offset);

    return results.map(row => new UserNotificationPreferences(
      row.id,
      row.userId,
      row.tenantId,
      row.preferences as NotificationPreferencesData,
      row.createdAt,
      row.updatedAt
    ));
  }
}