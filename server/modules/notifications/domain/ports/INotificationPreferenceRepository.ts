
/**
 * NotificationPreference Repository Interface
 * Clean Architecture - Domain Layer Port
 */

import { NotificationPreference } from '../entities/NotificationPreference';

export interface INotificationPreferenceRepository {
  save(preference: NotificationPreference): Promise<void>;
  findById(id: string, tenantId: string): Promise<NotificationPreference | null>;
  findByUserId(userId: string, tenantId: string): Promise<NotificationPreference[]>;
  findByUserAndType(userId: string, notificationType: string, tenantId: string): Promise<NotificationPreference | null>;
  update(preference: NotificationPreference): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
  findDefaultPreferences(tenantId: string): Promise<NotificationPreference[]>;
}
