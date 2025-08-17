// ✅ 1QA.MD COMPLIANCE: NOTIFICATION PREFERENCE REPOSITORY INTERFACE
// Domain layer - Repository contracts for user notification preferences

import { NotificationPreference } from '../entities/NotificationPreference';

export interface INotificationPreferenceRepository {
  // Basic CRUD operations
  findById(id: string, tenantId: string): Promise<NotificationPreference | null>;
  findByUserId(userId: string, tenantId: string): Promise<NotificationPreference[]>;
  findByUserIdAndType(userId: string, type: string, tenantId: string): Promise<NotificationPreference | null>;
  create(preference: Omit<NotificationPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationPreference>;
  update(id: string, tenantId: string, updates: Partial<NotificationPreference>): Promise<NotificationPreference | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // User preference management
  getUserPreferences(userId: string, tenantId: string): Promise<UserNotificationPreferences>;
  updateUserPreferences(userId: string, tenantId: string, preferences: UserNotificationPreferences): Promise<boolean>;
  resetToDefaults(userId: string, tenantId: string): Promise<boolean>;

  // Query operations
  findByChannel(channel: string, tenantId: string): Promise<NotificationPreference[]>;
  findEnabledByType(type: string, tenantId: string): Promise<NotificationPreference[]>;
  findUsersWithImmediatePreference(type: string, tenantId: string): Promise<string[]>;
  
  // Bulk operations
  bulkUpdatePreferences(userIds: string[], updates: Partial<NotificationPreference>, tenantId: string): Promise<number>;
  
  // Analytics
  getPreferenceStats(tenantId: string): Promise<PreferenceStats>;
}

export interface UserNotificationPreferences {
  userId: string;
  tenantId: string;
  preferences: {
    [notificationType: string]: {
      enabled: boolean;
      channels: string[];
      digestFrequency: string;
      quietHours?: {
        start: string;
        end: string;
        timezone: string;
      };
      customSettings?: Record<string, any>;
    };
  };
  globalSettings: {
    emailAddress?: string;
    phoneNumber?: string;
    slackUserId?: string;
    webhookUrl?: string;
    globalQuietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
}

export interface PreferenceStats {
  totalUsers: number;
  byChannel: Record<string, number>;
  byDigestFrequency: Record<string, number>;
  withQuietHours: number;
  fullyDisabled: number;
}