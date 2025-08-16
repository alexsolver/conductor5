// Application Use Case - Business logic orchestration
import { IUserNotificationPreferencesRepository } from '../../domain/repositories/IUserNotificationPreferencesRepository';
import { UserNotificationPreferences, NotificationPreferencesData } from '../../domain/entities/UserNotificationPreferences';

export class GetUserNotificationPreferencesUseCase {
  constructor(
    private readonly repository: IUserNotificationPreferencesRepository
  ) {}

  async execute(userId: string, tenantId: string): Promise<UserNotificationPreferences> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    let preferences = await this.repository.findByUserId(userId, tenantId);

    // Create default preferences if none exist
    if (!preferences) {
      const defaultPreferences: NotificationPreferencesData = this.getDefaultPreferences();
      preferences = await this.repository.create(userId, tenantId, defaultPreferences);
    }

    return preferences;
  }

  private getDefaultPreferences(): NotificationPreferencesData {
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
          channels: ['email', 'in_app', 'push'],
          priority: 'high',
          frequency: 'immediate'
        },
        ticket_created: {
          enabled: true,
          channels: ['in_app'],
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
          channels: ['email', 'sms', 'push', 'in_app'],
          priority: 'critical',
          frequency: 'immediate'
        },
        security_alert: {
          enabled: true,
          channels: ['email', 'sms', 'push', 'in_app'],
          priority: 'critical',
          frequency: 'immediate'
        }
      },
      deliveryWindow: {
        startTime: '08:00',
        endTime: '20:00',
        timezone: 'America/Sao_Paulo',
        daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
      },
      globalSettings: {
        doNotDisturb: false,
        soundEnabled: true,
        vibrationEnabled: true,
        emailDigest: true,
        digestFrequency: 'daily'
      }
    };
  }
}