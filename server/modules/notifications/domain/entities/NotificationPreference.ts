
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
    private modifiedAt: Date
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
  getModifiedAt(): Date { return this.modifiedAt; }

  // Business rules - decoupled from other entities
  canReceiveNotification(): boolean {
    return this.enabled;
  }
  
  meetsSevertityRequirement(severity: string): boolean {
    if (!this.filters.minSeverity) return true;
    const severityLevels = { info: 1, warning: 2, error: 3, critical: 4 };
    const minLevel = severityLevels[this.filters.minSeverity];
    const notificationLevel = severityLevels[severity];
    return notificationLevel >= minLevel;
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

  // State modification methods  
  changeChannels(channels: NotificationChannel[]): NotificationPreference {
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

  changeEnabled(enabled: boolean): NotificationPreference {
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
