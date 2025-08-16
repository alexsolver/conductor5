// Domain Repository Interface - Pure abstraction
import { UserNotificationPreferences, NotificationPreferencesData } from '../entities/UserNotificationPreferences';

export interface IUserNotificationPreferencesRepository {
  findByUserId(userId: string, tenantId: string): Promise<UserNotificationPreferences | null>;
  
  create(
    userId: string,
    tenantId: string,
    preferences: NotificationPreferencesData
  ): Promise<UserNotificationPreferences>;
  
  update(
    id: string,
    preferences: NotificationPreferencesData,
    tenantId: string
  ): Promise<UserNotificationPreferences>;
  
  delete(id: string, tenantId: string): Promise<boolean>;
  
  findByTenantId(tenantId: string, limit?: number, offset?: number): Promise<UserNotificationPreferences[]>;
}