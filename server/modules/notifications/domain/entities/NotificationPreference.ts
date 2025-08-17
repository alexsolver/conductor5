// ✅ 1QA.MD COMPLIANCE: NOTIFICATION PREFERENCE DOMAIN ENTITY
// Domain layer - User notification preferences business logic

export interface NotificationPreference {
  id: string;
  tenantId: string;
  userId: string;
  notificationType: string;
  channels: string[]; // Array of enabled channels: ['email', 'in_app', 'sms']
  quietHours?: QuietHours;
  digestFrequency: DigestFrequency;
  emailAddress?: string; // Override default user email
  phoneNumber?: string; // For SMS notifications
  slackUserId?: string; // Slack integration
  webhookUrl?: string; // Custom webhook endpoint
  isEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuietHours {
  start: string; // '22:00'
  end: string; // '08:00'
  timezone: string; // 'America/Sao_Paulo'
  daysOfWeek?: number[]; // [0,1,2,3,4,5,6] for Sunday to Saturday
}

export type DigestFrequency = 
  | 'immediate'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'never';

// ✅ 1QA.MD: Domain entity with business logic
export class NotificationPreferenceEntity implements NotificationPreference {
  constructor(
    public id: string,
    public tenantId: string,
    public userId: string,
    public notificationType: string,
    public channels: string[],
    public digestFrequency: DigestFrequency,
    public isEnabled: boolean,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date,
    public quietHours?: QuietHours,
    public emailAddress?: string,
    public phoneNumber?: string,
    public slackUserId?: string,
    public webhookUrl?: string
  ) {}

  // Business logic: Check if notification should be sent now
  shouldSendImmediately(): boolean {
    if (!this.isEnabled || !this.isActive) return false;
    if (this.digestFrequency !== 'immediate') return false;
    
    return !this.isInQuietHours();
  }

  // Business logic: Check if currently in quiet hours
  isInQuietHours(): boolean {
    if (!this.quietHours) return false;

    const now = new Date();
    const timezone = this.quietHours.timezone || 'America/Sao_Paulo';
    
    // Simple time check - in production would use proper timezone libraries
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 100 + currentMinute;
    
    const [startHour, startMinute] = this.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 100 + startMinute;
    const endTime = endHour * 100 + endMinute;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    // Handle same-day quiet hours (e.g., 13:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  // Business logic: Check if channel is enabled
  isChannelEnabled(channel: string): boolean {
    return this.isEnabled && this.isActive && this.channels.includes(channel);
  }

  // Business logic: Get delivery address for channel
  getDeliveryAddress(channel: string): string | null {
    if (!this.isChannelEnabled(channel)) return null;
    
    switch (channel) {
      case 'email':
        return this.emailAddress || null; // Fallback to user's primary email in service
      case 'sms':
        return this.phoneNumber || null;
      case 'slack':
        return this.slackUserId || null;
      case 'webhook':
        return this.webhookUrl || null;
      case 'in_app':
        return this.userId; // For in-app notifications
      default:
        return null;
    }
  }

  // Business logic: Update preferences
  updateChannels(channels: string[]): void {
    this.channels = [...channels];
    this.updatedAt = new Date();
  }

  // Business logic: Set quiet hours
  setQuietHours(quietHours: QuietHours): void {
    this.quietHours = { ...quietHours };
    this.updatedAt = new Date();
  }

  // Business logic: Enable/disable preference
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.updatedAt = new Date();
  }
}