// ✅ 1QA.MD COMPLIANCE: DRIZZLE NOTIFICATION PREFERENCE REPOSITORY
// Infrastructure layer - Database implementation for user preferences

import { db, sql } from '@shared/schema';
import { userNotificationPreferences } from '@shared/schema-notifications';
import { eq, and, count } from 'drizzle-orm';
import { 
  INotificationPreferenceRepository, 
  UserNotificationPreferences, 
  PreferenceStats 
} from '../../domain/repositories/INotificationPreferenceRepository';
import { NotificationPreference, NotificationPreferenceEntity } from '../../domain/entities/NotificationPreference';
import { v4 as uuidv4 } from 'uuid';


export class DrizzleNotificationPreferenceRepository implements INotificationPreferenceRepository {

  async findById(id: string, tenantId: string): Promise<NotificationPreference | null> {
    try {
      // Since we're using simplified schema, we need to work with the preferences JSON
      // In a full implementation, this would query the notification_preferences table
      return null; // Simplified for now
    } catch (error) {
      console.error('Error finding notification preference by ID:', error);
      return null;
    }
  }

  async findByUserId(userId: string, tenantId: string): Promise<NotificationPreference[]> {
    try {
      // Simplified implementation using the user preferences JSON structure
      const userPrefs = await this.getUserPreferences(userId, tenantId);
      const preferences: NotificationPreference[] = [];

      for (const [type, settings] of Object.entries(userPrefs.preferences)) {
        preferences.push(new NotificationPreferenceEntity(
          `${userId}-${type}`, // Generate ID
          tenantId,
          userId,
          type,
          settings.channels,
          settings.digestFrequency as any,
          settings.enabled,
          true, // isActive
          new Date(), // createdAt
          new Date(), // updatedAt
          settings.quietHours,
          userPrefs.globalSettings.emailAddress,
          userPrefs.globalSettings.phoneNumber,
          userPrefs.globalSettings.slackUserId,
          userPrefs.globalSettings.webhookUrl
        ));
      }

      return preferences;
    } catch (error) {
      console.error('Error finding preferences by user ID:', error);
      return [];
    }
  }

  async findByUserIdAndType(userId: string, type: string, tenantId: string): Promise<NotificationPreference | null> {
    try {
      const userPrefs = await this.getUserPreferences(userId, tenantId);
      const typeSettings = userPrefs.preferences[type];

      if (!typeSettings) return null;

      return new NotificationPreferenceEntity(
        `${userId}-${type}`,
        tenantId,
        userId,
        type,
        typeSettings.channels,
        typeSettings.digestFrequency as any,
        typeSettings.enabled,
        true,
        new Date(),
        new Date(),
        typeSettings.quietHours,
        userPrefs.globalSettings.emailAddress,
        userPrefs.globalSettings.phoneNumber,
        userPrefs.globalSettings.slackUserId,
        userPrefs.globalSettings.webhookUrl
      );
    } catch (error) {
      console.error('Error finding preference by user and type:', error);
      return null;
    }
  }

  async create(preference: Omit<NotificationPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationPreference> {
    try {
      // Update the user preferences JSON structure
      const userPrefs = await this.getUserPreferences(preference.userId, preference.tenantId);

      userPrefs.preferences[preference.notificationType] = {
        enabled: preference.isEnabled,
        channels: preference.channels,
        digestFrequency: preference.digestFrequency,
        quietHours: preference.quietHours,
        customSettings: {}
      };

      await this.updateUserPreferences(preference.userId, preference.tenantId, userPrefs);

      return new NotificationPreferenceEntity(
        `${preference.userId}-${preference.notificationType}`,
        preference.tenantId,
        preference.userId,
        preference.notificationType,
        preference.channels,
        preference.digestFrequency,
        preference.isEnabled,
        preference.isActive,
        new Date(),
        new Date(),
        preference.quietHours,
        preference.emailAddress,
        preference.phoneNumber,
        preference.slackUserId,
        preference.webhookUrl
      );
    } catch (error) {
      console.error('Error creating notification preference:', error);
      throw new Error('Failed to create notification preference');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<NotificationPreference>): Promise<NotificationPreference | null> {
    try {
      // Extract userId and type from the composite ID
      const [userId, type] = id.split('-', 2);

      const userPrefs = await this.getUserPreferences(userId, tenantId);
      const currentSettings = userPrefs.preferences[type];

      if (!currentSettings) return null;

      // Update the settings
      userPrefs.preferences[type] = {
        ...currentSettings,
        enabled: updates.isEnabled ?? currentSettings.enabled,
        channels: updates.channels ?? currentSettings.channels,
        digestFrequency: updates.digestFrequency ?? currentSettings.digestFrequency,
        quietHours: updates.quietHours ?? currentSettings.quietHours
      };

      await this.updateUserPreferences(userId, tenantId, userPrefs);

      return new NotificationPreferenceEntity(
        id,
        tenantId,
        userId,
        type,
        userPrefs.preferences[type].channels,
        userPrefs.preferences[type].digestFrequency as any,
        userPrefs.preferences[type].enabled,
        true,
        new Date(),
        new Date(),
        userPrefs.preferences[type].quietHours,
        updates.emailAddress,
        updates.phoneNumber,
        updates.slackUserId,
        updates.webhookUrl
      );
    } catch (error) {
      console.error('Error updating notification preference:', error);
      return null;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      const [userId, type] = id.split('-', 2);

      const userPrefs = await this.getUserPreferences(userId, tenantId);
      delete userPrefs.preferences[type];

      await this.updateUserPreferences(userId, tenantId, userPrefs);
      return true;
    } catch (error) {
      console.error('Error deleting notification preference:', error);
      return false;
    }
  }

  async getUserPreferences(userId: string, tenantId: string): Promise<UserNotificationPreferences> {
    try {
      console.log('[DRIZZLE-NOTIFICATION-PREFS] Getting preferences for user:', userId, 'tenant:', tenantId);

      // Validate that userId is a valid UUID
      if (!this.isValidUUID(userId)) {
        console.error('[DRIZZLE-NOTIFICATION-PREFS] Invalid UUID format for userId:', userId);
        return this.getDefaultPreferences(userId, tenantId);
      }

      try {
        // Try to fetch from database first
        const result = await db
          .select()
          .from(userNotificationPreferences)
          .where(and(
            eq(userNotificationPreferences.userId, userId),
            eq(userNotificationPreferences.tenantId, tenantId)
          ))
          .limit(1);

        if (result.length > 0) {
          const row = result[0];
          console.log('[DRIZZLE-NOTIFICATION-PREFS] Found existing preferences in database');
          return {
            userId: row.userId,
            tenantId: row.tenantId,
            preferences: row.preferences as any,
            globalSettings: (row.preferences as any)?.globalSettings || this.getDefaultPreferences(userId, tenantId).globalSettings
          };
        }
      } catch (dbError) {
        console.warn('[DRIZZLE-NOTIFICATION-PREFS] Database query failed, using defaults:', dbError);
      }

      // If no preferences found, return default preferences
      console.log('[DRIZZLE-NOTIFICATION-PREFS] No existing preferences found, returning defaults.');
      return this.getDefaultPreferences(userId, tenantId);
    } catch (error) {
      console.error('[DRIZZLE-NOTIFICATION-PREFS] Error getting user preferences:', error);
      // In case of error during fetch or conversion, return default preferences
      return this.getDefaultPreferences(userId, tenantId);
    }
  }

  async updateUserPreferences(userId: string, tenantId: string, preferences: UserNotificationPreferences): Promise<boolean> {
    try {
      await db
        .insert(userNotificationPreferences)
        .values({
          userId,
          tenantId,
          preferences: {
            preferences: preferences.preferences,
            globalSettings: preferences.globalSettings
          },
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [userNotificationPreferences.userId, userNotificationPreferences.tenantId],
          set: {
            preferences: {
              preferences: preferences.preferences,
              globalSettings: preferences.globalSettings
            },
            updatedAt: new Date()
          }
        });

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  async resetToDefaults(userId: string, tenantId: string): Promise<boolean> {
    try {
      const defaultPreferences = this.getDefaultPreferences(userId, tenantId);
      const success = await this.updateUserPreferences(userId, tenantId, defaultPreferences);
      console.log('[NOTIFICATION-PREFERENCES-REPOSITORY] Reset to defaults for user:', userId, 'Success:', success);
      return success;
    } catch (error) {
      console.error('Error resetting preferences to defaults:', error);
      return false;
    }
  }

  async findByChannel(channel: string, tenantId: string): Promise<NotificationPreference[]> {
    // Simplified implementation - would need to query across all user preferences
    return [];
  }

  async findEnabledByType(type: string, tenantId: string): Promise<NotificationPreference[]> {
    // Simplified implementation - would need to query across all user preferences
    return [];
  }

  async findUsersWithImmediatePreference(type: string, tenantId: string): Promise<string[]> {
    // Simplified implementation - would need to query across all user preferences
    return [];
  }

  async bulkUpdatePreferences(userIds: string[], updates: Partial<NotificationPreference>, tenantId: string): Promise<number> {
    // Simplified implementation
    return 0;
  }

  async getPreferenceStats(tenantId: string): Promise<PreferenceStats> {
    try {
      const [totalResult] = await db
        .select({ count: count() })
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.tenantId, tenantId));

      return {
        totalUsers: totalResult?.count || 0,
        byChannel: {},
        byDigestFrequency: {},
        withQuietHours: 0,
        fullyDisabled: 0
      };
    } catch (error) {
      console.error('Error getting preference stats:', error);
      return {
        totalUsers: 0,
        byChannel: {},
        byDigestFrequency: {},
        withQuietHours: 0,
        fullyDisabled: 0
      };
    }
  }

  private getDefaultPreferences(userId: string, tenantId: string): UserNotificationPreferences {
    return {
      userId,
      tenantId,
      preferences: {
        // Ticket notifications
        'ticket_created': {
          enabled: true,
          channels: ['in_app', 'email'],
          digestFrequency: 'immediate'
        },
        'ticket_assigned': {
          enabled: true,
          channels: ['in_app', 'email'],
          digestFrequency: 'immediate'
        },
        'ticket_status_changed': {
          enabled: true,
          channels: ['in_app'],
          digestFrequency: 'immediate'
        },
        // System notifications
        'system_alert': {
          enabled: true,
          channels: ['in_app', 'email'],
          digestFrequency: 'immediate'
        },
        // Marketing notifications
        'marketing': {
          enabled: false,
          channels: ['email'],
          digestFrequency: 'weekly'
        }
      },
      globalSettings: {
        doNotDisturb: false,
        soundEnabled: true,
        vibrationEnabled: true,
        emailDigest: false,
        digestFrequency: 'daily',
        globalChannels: {
          email: true,
          sms: true,
          push: true,
          in_app: true,
          webhook: true,
          slack: true,
          dashboard_alert: true
        },
        globalQuietHours: {
          start: '22:00',
          end: '08:00',
          timezone: 'America/Sao_Paulo'
        }
      }
    };
  }

  private convertToUserPreferences(preference: NotificationPreference): UserNotificationPreferences {
    return {
      userId: preference.userId,
      tenantId: preference.tenantId,
      preferences: {
        [preference.notificationType]: {
          enabled: preference.isEnabled,
          channels: preference.channels,
          digestFrequency: preference.digestFrequency,
          quietHours: preference.quietHours,
          customSettings: {} // Assuming no custom settings for now
        }
      },
      globalSettings: {
        // These would ideally be fetched from a global user settings or defaults
        // For now, we'll use placeholder values or values from the preference object
        doNotDisturb: false, // Default or fetched globally
        soundEnabled: true,  // Default or fetched globally
        vibrationEnabled: true, // Default or fetched globally
        emailDigest: preference.emailAddress ? true : false, // Infer from email presence
        digestFrequency: preference.digestFrequency, // Use from the preference or default
        globalChannels: {
          email: preference.emailAddress ? true : false,
          sms: preference.phoneNumber ? true : false,
          push: true, // Placeholder
          in_app: true, // Placeholder
          webhook: preference.webhookUrl ? true : false,
          slack: preference.slackUserId ? true : false,
          dashboard_alert: true // Placeholder
        },
        globalQuietHours: {
          start: '22:00', // Default or fetched globally
          end: '08:00',   // Default or fetched globally
          timezone: 'America/Sao_Paulo' // Default or fetched globally
        },
        emailAddress: preference.emailAddress,
        phoneNumber: preference.phoneNumber,
        slackUserId: preference.slackUserId,
        webhookUrl: preference.webhookUrl
      }
    };
  }

  private isValidUUID(id: string): boolean {
    return uuidv4.validate(id);
  }
}