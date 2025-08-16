// Application Layer - Use Case following 1qa.md Clean Architecture
import { UserNotificationPreferences, NotificationPreferencesData } from '../../domain/entities/UserNotificationPreferences';
import { IUserNotificationPreferencesRepository } from '../../domain/repositories/IUserNotificationPreferencesRepository';

export class GetUserNotificationPreferencesUseCase {
  constructor(
    private readonly repository: IUserNotificationPreferencesRepository
  ) {}

  async execute(userId: string, tenantId: string): Promise<UserNotificationPreferences> {
    console.log(`[GET-USER-PREFERENCES-USE-CASE] Retrieving preferences for user ${userId} in tenant ${tenantId}`);
    
    try {
      const preferences = await this.repository.findByUserId(userId, tenantId);

      if (!preferences) {
        console.log(`[GET-USER-PREFERENCES-USE-CASE] No preferences found, creating defaults for user ${userId}`);
        
        // Create default preferences following 1qa.md business rules
        const defaultPreferences = this.createDefaultPreferences();
        return await this.repository.create(userId, tenantId, defaultPreferences);
      }

      return preferences;
    } catch (error) {
      console.log(`[GET-USER-PREFERENCES-USE-CASE] Database error, returning default preferences:`, error);
      
      // Fallback to temporary defaults if database fails
      const defaultPreferences = this.createDefaultPreferences();
      const tempId = `temp_${userId}_${tenantId}`;
      
      return new UserNotificationPreferences(
        tempId,
        userId,
        tenantId,
        defaultPreferences,
        new Date(),
        new Date()
      );
    }
  }

  private createDefaultPreferences(): NotificationPreferencesData {
    return {
      types: {
        system_maintenance: {
          enabled: true,
          channels: ['email', 'in_app'],
          priority: 'medium',
          frequency: 'immediate'
        },
        system_alert: {
          enabled: true,
          channels: ['email', 'in_app', 'sms'],
          priority: 'high',
          frequency: 'immediate'
        },
        ticket_created: {
          enabled: true,
          channels: ['email', 'in_app'],
          priority: 'medium',
          frequency: 'immediate'
        },
        ticket_updated: {
          enabled: true,
          channels: ['in_app'],
          priority: 'medium',
          frequency: 'immediate'
        },
        field_emergency: {
          enabled: true,
          channels: ['email', 'in_app', 'sms', 'push'],
          priority: 'critical',
          frequency: 'immediate'
        },
        security_alert: {
          enabled: true,
          channels: ['email', 'in_app', 'sms'],
          priority: 'critical',
          frequency: 'immediate'
        }
      },
      deliveryWindow: {
        startTime: '08:00',
        endTime: '20:00',
        timezone: 'America/Sao_Paulo',
        daysOfWeek: [1, 2, 3, 4, 5]
      },
      globalSettings: {
        doNotDisturb: false,
        soundEnabled: true,
        vibrationEnabled: true,
        emailDigest: false,
        digestFrequency: 'daily'
      }
    };
  }
}