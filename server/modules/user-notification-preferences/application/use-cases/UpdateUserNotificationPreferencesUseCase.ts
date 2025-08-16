// Application Layer - Use Case following 1qa.md Clean Architecture
import { UserNotificationPreferences, NotificationPreferencesData } from '../../domain/entities/UserNotificationPreferences';
import { IUserNotificationPreferencesRepository } from '../../domain/repositories/IUserNotificationPreferencesRepository';

export interface UpdateUserNotificationPreferencesRequest {
  userId: string;
  tenantId: string;
  preferences: NotificationPreferencesData;
}

export class UpdateUserNotificationPreferencesUseCase {
  constructor(
    private readonly repository: IUserNotificationPreferencesRepository
  ) {}

  async execute(request: UpdateUserNotificationPreferencesRequest): Promise<UserNotificationPreferences> {
    const { userId, tenantId, preferences } = request;
    
    console.log(`[UPDATE-USER-PREFERENCES-USE-CASE] Updating preferences for user ${userId} in tenant ${tenantId}`);
    
    // Validate business rules following 1qa.md
    this.validatePreferences(preferences);
    
    try {
      const updatedPreferences = await this.repository.update(userId, tenantId, preferences);
      console.log(`[UPDATE-USER-PREFERENCES-USE-CASE] Successfully updated preferences for user ${userId}`);
      return updatedPreferences;
    } catch (error) {
      console.error(`[UPDATE-USER-PREFERENCES-USE-CASE] Failed to update preferences:`, error);
      throw new Error('Failed to update user notification preferences');
    }
  }

  private validatePreferences(preferences: NotificationPreferencesData): void {
    if (!preferences) {
      throw new Error('Preferences data is required');
    }

    if (!preferences.types) {
      throw new Error('Notification types are required');
    }

    if (!preferences.globalSettings) {
      throw new Error('Global settings are required');
    }

    // Validate delivery window if provided
    if (preferences.deliveryWindow) {
      const { startTime, endTime } = preferences.deliveryWindow;
      if (!startTime || !endTime) {
        throw new Error('Both start and end times are required for delivery window');
      }
      
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (start >= end) {
        throw new Error('Start time must be before end time');
      }
    }
  }
}