
/**
 * Notification Domain Entity
 * Clean Architecture - Domain Layer
 * Contains business rules and invariants for notifications
 */

export interface NotificationCreateProps {
  tenantId: string;
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  channels: NotificationChannel[];
  scheduledAt?: Date;
  expiresAt?: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export type NotificationType = 
  | 'ticket_assignment'
  | 'ticket_overdue'
  | 'sla_breach'
  | 'compliance_expiry'
  | 'timecard_approval'
  | 'stock_low'
  | 'system_alert'
  | 'user_action'
  | 'automated';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export class Notification {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private readonly userId: string,
    private readonly type: NotificationType,
    private severity: NotificationSeverity,
    private title: string,
    private message: string,
    private readonly metadata: Record<string, any>,
    private readonly channels: NotificationChannel[],
    private status: NotificationStatus,
    private readonly scheduledAt: Date,
    private readonly expiresAt: Date | null,
    private sentAt: Date | null,
    private deliveredAt: Date | null,
    private failedAt: Date | null,
    private readonly relatedEntityType: string | null,
    private readonly relatedEntityId: string | null,
    private readonly createdAt: Date,
    private modifiedAt: Date
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getUserId(): string { return this.userId; }
  getType(): NotificationType { return this.type; }
  getSeverity(): NotificationSeverity { return this.severity; }
  getTitle(): string { return this.title; }
  getMessage(): string { return this.message; }
  getMetadata(): Record<string, any> { return this.metadata; }
  getChannels(): NotificationChannel[] { return this.channels; }
  getStatus(): NotificationStatus { return this.status; }
  getScheduledAt(): Date { return this.scheduledAt; }
  getExpiresAt(): Date | null { return this.expiresAt; }
  getSentAt(): Date | null { return this.sentAt; }
  getDeliveredAt(): Date | null { return this.deliveredAt; }
  getFailedAt(): Date | null { return this.failedAt; }
  getRelatedEntityType(): string | null { return this.relatedEntityType; }
  getRelatedEntityId(): string | null { return this.relatedEntityId; }
  getCreatedAt(): Date { return this.createdAt; }
  getModifiedAt(): Date { return this.modifiedAt; }

  // Business rules
  isExpired(currentTime: Date): boolean {
    if (!this.expiresAt) return false;
    return currentTime > this.expiresAt;
  }

  canBeSent(currentTime: Date): boolean {
    return this.status === 'pending' && !this.isExpired(currentTime) && this.scheduledAt <= currentTime;
  }

  requiresEscalation(currentTime: Date, thresholdTime: Date): boolean {
    return this.severity === 'critical' && this.status === 'pending' && 
           this.scheduledAt <= thresholdTime;
  }

  shouldRetry(currentTime: Date): boolean {
    return this.status === 'failed' && 
           this.failedAt && 
           currentTime.getTime() - this.failedAt.getTime() < 3600000; // 1 hour retry window
  }

  isCritical(): boolean {
    return this.severity === 'critical';
  }

  // State transition methods
  markAsSent(): Notification {
    if (this.status !== 'pending') {
      throw new Error('Only pending notifications can be marked as sent');
    }

    return new Notification(
      this.id,
      this.tenantId,
      this.userId,
      this.type,
      this.severity,
      this.title,
      this.message,
      this.metadata,
      this.channels,
      'sent',
      this.scheduledAt,
      this.expiresAt,
      this.sentAt, // Will be set by application layer
      this.deliveredAt,
      this.failedAt,
      this.relatedEntityType,
      this.relatedEntityId,
      this.createdAt,
      this.modifiedAt // Will be set by application layer
    );
  }

  markAsDelivered(): Notification {
    if (this.status !== 'sent') {
      throw new Error('Only sent notifications can be marked as delivered');
    }

    return new Notification(
      this.id,
      this.tenantId,
      this.userId,
      this.type,
      this.severity,
      this.title,
      this.message,
      this.metadata,
      this.channels,
      'delivered',
      this.scheduledAt,
      this.expiresAt,
      this.sentAt,
      this.deliveredAt, // Will be set by application layer
      this.failedAt,
      this.relatedEntityType,
      this.relatedEntityId,
      this.createdAt,
      this.modifiedAt // Will be set by application layer
    );
  }

  markAsFailed(error?: string): Notification {
    const updatedMetadata = error ? 
      { ...this.metadata, error } : this.metadata;

    return new Notification(
      this.id,
      this.tenantId,
      this.userId,
      this.type,
      this.severity,
      this.title,
      this.message,
      updatedMetadata,
      this.channels,
      'failed',
      this.scheduledAt,
      this.expiresAt,
      this.sentAt,
      this.deliveredAt,
      new Date(), // failedAt
      this.relatedEntityType,
      this.relatedEntityId,
      this.createdAt,
      new Date() // modifiedAt
    );
  }

  escalate(): Notification {
    if (!this.requiresEscalation()) {
      throw new Error('Notification does not require escalation');
    }

    return new Notification(
      this.id,
      this.tenantId,
      this.userId,
      this.type,
      'critical', // Escalate severity
      `[ESCALATED] ${this.title}`,
      this.message,
      { ...this.metadata, escalated: true, escalatedAt: new Date().toISOString() },
      this.channels,
      this.status,
      this.scheduledAt,
      this.expiresAt,
      this.sentAt,
      this.deliveredAt,
      this.failedAt,
      this.relatedEntityType,
      this.relatedEntityId,
      this.createdAt,
      new Date() // modifiedAt
    );
  }

  // CLEANED: Factory method removed - persistence mapping moved to repository layer
}
