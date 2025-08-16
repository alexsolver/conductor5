// Domain Entity - Pure business logic
export class UserNotificationPreferences {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly tenantId: string,
    private readonly preferences: NotificationPreferencesData,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  public getId(): string {
    return this.id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getPreferences(): NotificationPreferencesData {
    return this.preferences;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public updatePreferences(newPreferences: Partial<NotificationPreferencesData>): UserNotificationPreferences {
    return new UserNotificationPreferences(
      this.id,
      this.userId,
      this.tenantId,
      { ...this.preferences, ...newPreferences },
      this.createdAt,
      new Date()
    );
  }

  public isChannelEnabled(channel: NotificationChannel, type: NotificationType): boolean {
    const typePrefs = this.preferences.types[type];
    if (!typePrefs) return false;
    return typePrefs.channels.includes(channel) && typePrefs.enabled;
  }

  public getDeliveryWindow(): DeliveryWindow | null {
    return this.preferences.deliveryWindow || null;
  }

  public isWithinDeliveryWindow(date: Date = new Date()): boolean {
    const window = this.getDeliveryWindow();
    if (!window) return true;

    const hour = date.getHours();
    const minute = date.getMinutes();
    const currentTime = hour * 60 + minute;

    const startTime = this.parseTime(window.startTime);
    const endTime = this.parseTime(window.endTime);

    return currentTime >= startTime && currentTime <= endTime;
  }

  private parseTime(timeString: string): number {
    const [hour, minute] = timeString.split(':').map(Number);
    return hour * 60 + minute;
  }
}

export interface NotificationPreferencesData {
  types: Record<NotificationType, NotificationTypePreference>;
  deliveryWindow?: DeliveryWindow;
  globalSettings: GlobalNotificationSettings;
}

export interface NotificationTypePreference {
  enabled: boolean;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  frequency?: NotificationFrequency;
}

export interface DeliveryWindow {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  timezone: string;
  daysOfWeek: number[]; // 0-6, Sunday=0
}

export interface GlobalNotificationSettings {
  doNotDisturb: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  emailDigest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook' | 'dashboard_alert';
export type NotificationType = 'system_maintenance' | 'system_alert' | 'ticket_created' | 'ticket_updated' | 'field_emergency' | 'security_alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';