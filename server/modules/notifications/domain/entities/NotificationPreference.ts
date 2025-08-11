
/**
 * NotificationPreference Domain Entity
 * Clean Architecture - Domain Layer
 */

export interface NotificationPreferenceCreateProps {
  tenantId: string;
  userId: string;
  notificationType: string;
  channels: NotificationChannel[];
  enabled: boolean;
  scheduleSettings?: ScheduleSettings;
  filters?: NotificationFilters;
}

export interface ScheduleSettings {
  doNotDisturbStart?: string; // "22:00"
  doNotDisturbEnd?: string;   // "08:00"
  timezone?: string;
  weekdaysOnly?: boolean;
}

export interface NotificationFilters {
  minSeverity?: NotificationSeverity;
  categories?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
}

export class NotificationPreference {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private readonly userId: string,
    private readonly notificationType: string,
    private channels: NotificationChannel[],
    private enabled: boolean,
    private scheduleSettings: ScheduleSettings,
    private filters: NotificationFilters,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getUserId(): string { return this.userId; }
  getNotificationType(): string { return this.notificationType; }
  getChannels(): NotificationChannel[] { return this.channels; }
  isEnabled(): boolean { return this.enabled; }
  getScheduleSettings(): ScheduleSettings { return this.scheduleSettings; }
  getFilters(): NotificationFilters { return this.filters; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business rules
  shouldReceiveNotification(notification: Notification): boolean {
    if (!this.enabled) return false;
    
    // Check severity filter
    if (this.filters.minSeverity) {
      const severityLevels = { info: 1, warning: 2, error: 3, critical: 4 };
      const minLevel = severityLevels[this.filters.minSeverity];
      const notificationLevel = severityLevels[notification.getSeverity()];
      if (notificationLevel < minLevel) return false;
    }

    // Check schedule (Do Not Disturb)
    if (this.scheduleSettings.doNotDisturbStart && this.scheduleSettings.doNotDisturbEnd) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const start = this.scheduleSettings.doNotDisturbStart;
      const end = this.scheduleSettings.doNotDisturbEnd;
      
      if (start < end) {
        // Same day range (e.g., 09:00 - 17:00)
        if (currentTime >= start && currentTime <= end) return false;
      } else {
        // Cross-midnight range (e.g., 22:00 - 08:00)
        if (currentTime >= start || currentTime <= end) return false;
      }
    }

    // Check weekdays only
    if (this.scheduleSettings.weekdaysOnly) {
      const dayOfWeek = new Date().getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Sunday or Saturday
    }

    return true;
  }

  isInDoNotDisturbPeriod(): boolean {
    if (!this.scheduleSettings.doNotDisturbStart || !this.scheduleSettings.doNotDisturbEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const start = this.scheduleSettings.doNotDisturbStart;
    const end = this.scheduleSettings.doNotDisturbEnd;
    
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  // Factory method
  // Factory method removed - should be handled by repository or service layer

  // Update methods
  updateChannels(channels: NotificationChannel[]): NotificationPreference {
    return new NotificationPreference(
      this.id,
      this.tenantId,
      this.userId,
      this.notificationType,
      channels,
      this.enabled,
      this.scheduleSettings,
      this.filters,
      this.createdAt,
      new Date()
    );
  }

  updateEnabled(enabled: boolean): NotificationPreference {
    return new NotificationPreference(
      this.id,
      this.tenantId,
      this.userId,
      this.notificationType,
      this.channels,
      enabled,
      this.scheduleSettings,
      this.filters,
      this.createdAt,
      new Date()
    );
  }

  updateScheduleSettings(scheduleSettings: ScheduleSettings): NotificationPreference {
    return new NotificationPreference(
      this.id,
      this.tenantId,
      this.userId,
      this.notificationType,
      this.channels,
      this.enabled,
      scheduleSettings,
      this.filters,
      this.createdAt,
      new Date()
    );
  }

  updateFilters(filters: NotificationFilters): NotificationPreference {
    return new NotificationPreference(
      this.id,
      this.tenantId,
      this.userId,
      this.notificationType,
      this.channels,
      this.enabled,
      this.scheduleSettings,
      filters,
      this.createdAt,
      new Date()
    );
  }

  // CLEANED: Factory method removed - persistence mapping moved to repository layer
  // Domain entities should not handle data reconstruction from external sources
}
