// Domain Layer - Pure business entities following 1qa.md Clean Architecture
export interface NotificationPreferencesData {
  types: Record<string, {
    enabled: boolean;
    channels: string[];
    priority: string;
    frequency: string;
  }>;
  deliveryWindow?: {
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeek: number[];
  };
  globalSettings: {
    doNotDisturb: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    emailDigest: boolean;
    digestFrequency: string;
  };
}

export class UserNotificationPreferences {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly tenantId: string,
    private readonly preferences: NotificationPreferencesData,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {
    this.validateEntity();
  }

  private validateEntity(): void {
    if (!this.userId) throw new Error('User ID is required');
    if (!this.tenantId) throw new Error('Tenant ID is required');
    if (!this.preferences) throw new Error('Preferences data is required');
  }

  // Getters following Clean Architecture
  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getTenantId(): string { return this.tenantId; }
  getPreferences(): NotificationPreferencesData { return this.preferences; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business logic methods
  isNotificationEnabled(type: string): boolean {
    return this.preferences.types[type]?.enabled || false;
  }

  getEnabledChannels(type: string): string[] {
    return this.preferences.types[type]?.channels || [];
  }

  isInDeliveryWindow(timestamp: Date): boolean {
    if (!this.preferences.deliveryWindow) return true;
    
    const hour = timestamp.getHours();
    const startHour = parseInt(this.preferences.deliveryWindow.startTime.split(':')[0]);
    const endHour = parseInt(this.preferences.deliveryWindow.endTime.split(':')[0]);
    
    return hour >= startHour && hour <= endHour;
  }

  canReceiveNotifications(): boolean {
    return !this.preferences.globalSettings.doNotDisturb;
  }
}