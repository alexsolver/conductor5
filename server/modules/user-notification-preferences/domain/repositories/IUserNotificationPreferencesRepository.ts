// Domain Layer - Repository interface following 1qa.md Clean Architecture
import { UserNotificationPreferences, NotificationPreferencesData } from '../entities/UserNotificationPreferences';

export interface IUserNotificationPreferencesRepository {
  findByUserId(userId: string, tenantId: string): Promise<UserNotificationPreferences | null>;
  create(userId: string, tenantId: string, preferences: NotificationPreferencesData): Promise<UserNotificationPreferences>;
  update(userId: string, tenantId: string, preferences: NotificationPreferencesData): Promise<UserNotificationPreferences>;
  delete(userId: string, tenantId: string): Promise<void>;
}