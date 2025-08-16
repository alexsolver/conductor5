// Application Use Case - Business logic orchestration
import { IUserNotificationPreferencesRepository } from '../../domain/repositories/IUserNotificationPreferencesRepository';
import { UserNotificationPreferences, NotificationPreferencesData } from '../../domain/entities/UserNotificationPreferences';

export interface UpdateUserNotificationPreferencesRequest {
  userId: string;
  tenantId: string;
  preferences: Partial<NotificationPreferencesData>;
}

export class UpdateUserNotificationPreferencesUseCase {
  constructor(
    private readonly repository: IUserNotificationPreferencesRepository
  ) {}

  async execute(request: UpdateUserNotificationPreferencesRequest): Promise<UserNotificationPreferences> {
    const { userId, tenantId, preferences } = request;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!preferences) {
      throw new Error('Preferences are required');
    }

    // Get current preferences or create default ones
    let currentPreferences = await this.repository.findByUserId(userId, tenantId);
    
    if (!currentPreferences) {
      throw new Error('User notification preferences not found');
    }

    // Validate preferences structure
    this.validatePreferences(preferences);

    // Update preferences using domain entity method
    const updatedEntity = currentPreferences.updatePreferences(preferences);
    
    // Persist changes
    return await this.repository.update(
      updatedEntity.getId(),
      updatedEntity.getPreferences(),
      tenantId
    );
  }

  private validatePreferences(preferences: Partial<NotificationPreferencesData>): void {
    if (preferences.types) {
      for (const [type, typePrefs] of Object.entries(preferences.types)) {
        if (typePrefs.channels) {
          const validChannels = ['email', 'sms', 'push', 'in_app', 'webhook', 'dashboard_alert'];
          const invalidChannels = typePrefs.channels.filter(channel => !validChannels.includes(channel));
          
          if (invalidChannels.length > 0) {
            throw new Error(`Invalid notification channels: ${invalidChannels.join(', ')}`);
          }
        }

        if (typePrefs.priority && !['low', 'medium', 'high', 'critical'].includes(typePrefs.priority)) {
          throw new Error(`Invalid priority for ${type}: ${typePrefs.priority}`);
        }

        if (typePrefs.frequency && !['immediate', 'hourly', 'daily', 'weekly'].includes(typePrefs.frequency)) {
          throw new Error(`Invalid frequency for ${type}: ${typePrefs.frequency}`);
        }
      }
    }

    if (preferences.deliveryWindow) {
      const { startTime, endTime, daysOfWeek } = preferences.deliveryWindow;
      
      if (startTime && !this.isValidTime(startTime)) {
        throw new Error(`Invalid start time format: ${startTime}`);
      }
      
      if (endTime && !this.isValidTime(endTime)) {
        throw new Error(`Invalid end time format: ${endTime}`);
      }
      
      if (daysOfWeek && (!Array.isArray(daysOfWeek) || daysOfWeek.some(day => day < 0 || day > 6))) {
        throw new Error('Invalid days of week. Must be array of numbers 0-6');
      }
    }

    if (preferences.globalSettings?.digestFrequency && !['daily', 'weekly', 'never'].includes(preferences.globalSettings.digestFrequency)) {
      throw new Error(`Invalid digest frequency: ${preferences.globalSettings.digestFrequency}`);
    }
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}