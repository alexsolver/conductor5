// DOMAIN ENTITY - Clean Architecture
// Domain layer - Business rules and core logic

import { NotificationSeverity, NotificationStatus, NotificationChannelType } from '@shared/schema-notifications';

export class NotificationEntity {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private readonly type: string,
    private severity: NotificationSeverity,
    private readonly title: string,
    private readonly message: string,
    private readonly metadata: Record<string, any>,
    private readonly channels: NotificationChannelType[],
    private status: NotificationStatus,
    private readonly scheduledAt: Date,
    private readonly expiresAt: Date | null,
    private sentAt: Date | null,
    private deliveredAt: Date | null,
    private failedAt: Date | null,
    private readonly relatedEntityType: string | null,
    private readonly relatedEntityId: string | null,
    private readonly userId: string | null,
    private retryCount: number,
    private readonly maxRetries: number,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    this.validateBusinessRules();
  }

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getType(): string { return this.type; }
  getSeverity(): NotificationSeverity { return this.severity; }
  getTitle(): string { return this.title; }
  getMessage(): string { return this.message; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getChannels(): NotificationChannelType[] { return [...this.channels]; }
  getStatus(): NotificationStatus { return this.status; }
  getScheduledAt(): Date { return this.scheduledAt; }
  getExpiresAt(): Date | null { return this.expiresAt; }
  getSentAt(): Date | null { return this.sentAt; }
  getDeliveredAt(): Date | null { return this.deliveredAt; }
  getFailedAt(): Date | null { return this.failedAt; }
  getRelatedEntityType(): string | null { return this.relatedEntityType; }
  getRelatedEntityId(): string | null { return this.relatedEntityId; }
  getUserId(): string | null { return this.userId; }
  getRetryCount(): number { return this.retryCount; }
  getMaxRetries(): number { return this.maxRetries; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business Rules - Core Domain Logic
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  canBeSent(): boolean {
    return this.status === 'pending' && 
           !this.isExpired() && 
           this.scheduledAt <= new Date();
  }

  requiresEscalation(): boolean {
    if (this.severity !== 'critical') return false;
    if (this.status !== 'pending') return false;
    
    // Critical alerts require escalation after 15 minutes
    const escalationThreshold = 15 * 60 * 1000; // 15 minutes
    return this.scheduledAt.getTime() <= (Date.now() - escalationThreshold);
  }

  shouldRetry(): boolean {
    if (this.status !== 'failed') return false;
    if (this.retryCount >= this.maxRetries) return false;
    if (!this.failedAt) return false;
    
    // Retry window: 1 hour after failure
    const retryWindow = 60 * 60 * 1000; // 1 hour
    return (Date.now() - this.failedAt.getTime()) < retryWindow;
  }

  isCritical(): boolean {
    return this.severity === 'critical';
  }

  isSystemAlert(): boolean {
    return this.type.startsWith('system_');
  }

  isTicketAlert(): boolean {
    return this.type.startsWith('ticket_');
  }

  isFieldAlert(): boolean {
    return this.type.startsWith('field_');
  }

  isTimecardAlert(): boolean {
    return this.type.startsWith('timecard_');
  }

  isSecurityAlert(): boolean {
    return this.type.startsWith('security_');
  }

  // State Mutations
  markAsSent(sentAt: Date): void {
    if (this.status !== 'pending' && this.status !== 'scheduled') {
      throw new Error('Cannot mark as sent: notification is not in sendable state');
    }
    this.status = 'sent';
    this.sentAt = sentAt;
    this.updatedAt = new Date();
  }

  markAsDelivered(deliveredAt: Date): void {
    if (this.status !== 'sent') {
      throw new Error('Cannot mark as delivered: notification was not sent');
    }
    this.status = 'delivered';
    this.deliveredAt = deliveredAt;
    this.updatedAt = new Date();
  }

  markAsFailed(failedAt: Date, reason?: string): void {
    this.status = 'failed';
    this.failedAt = failedAt;
    this.retryCount += 1;
    this.updatedAt = new Date();
    
    // Add failure reason to metadata
    if (reason) {
      this.metadata.lastFailureReason = reason;
      this.metadata.failureHistory = this.metadata.failureHistory || [];
      this.metadata.failureHistory.push({
        timestamp: failedAt,
        reason,
        attemptNumber: this.retryCount
      });
    }
  }

  markAsExpired(): void {
    if (this.isExpired()) {
      this.status = 'expired';
      this.updatedAt = new Date();
    }
  }

  incrementRetryCount(): void {
    this.retryCount += 1;
    this.updatedAt = new Date();
  }

  escalateSeverity(): void {
    const severityOrder: NotificationSeverity[] = ['low', 'medium', 'high', 'critical'];
    const currentIndex = severityOrder.indexOf(this.severity);
    
    if (currentIndex < severityOrder.length - 1) {
      this.severity = severityOrder[currentIndex + 1];
      this.updatedAt = new Date();
    }
  }

  // Factory Methods
  static createSystemAlert(
    id: string,
    tenantId: string,
    type: string,
    title: string,
    message: string,
    severity: NotificationSeverity = 'critical',
    metadata: Record<string, any> = {}
  ): NotificationEntity {
    return new NotificationEntity(
      id,
      tenantId,
      type,
      severity,
      title,
      message,
      metadata,
      ['in_app', 'email', 'dashboard_alert'],
      'pending',
      new Date(),
      null, // System alerts don't expire
      null,
      null,
      null,
      'system',
      null,
      null,
      0,
      3,
      new Date(),
      new Date()
    );
  }

  static createTicketAlert(
    id: string,
    tenantId: string,
    type: string,
    title: string,
    message: string,
    ticketId: string,
    userId: string | null,
    severity: NotificationSeverity = 'medium',
    metadata: Record<string, any> = {}
  ): NotificationEntity {
    return new NotificationEntity(
      id,
      tenantId,
      type,
      severity,
      title,
      message,
      metadata,
      ['in_app', 'email'],
      'pending',
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
      null,
      null,
      null,
      'ticket',
      ticketId,
      userId,
      0,
      3,
      new Date(),
      new Date()
    );
  }

  static createFieldAlert(
    id: string,
    tenantId: string,
    type: string,
    title: string,
    message: string,
    userId: string,
    locationData: Record<string, any>,
    severity: NotificationSeverity = 'high',
    metadata: Record<string, any> = {}
  ): NotificationEntity {
    const enhancedMetadata = {
      ...metadata,
      location: locationData
    };

    return new NotificationEntity(
      id,
      tenantId,
      type,
      severity,
      title,
      message,
      enhancedMetadata,
      ['in_app', 'sms', 'push'],
      'pending',
      new Date(),
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
      null,
      null,
      null,
      'field_operation',
      userId,
      userId,
      0,
      3,
      new Date(),
      new Date()
    );
  }

  // Validation
  private validateBusinessRules(): void {
    if (!this.title?.trim()) {
      throw new Error('Notification title is required');
    }
    
    if (!this.message?.trim()) {
      throw new Error('Notification message is required');
    }
    
    if (!this.tenantId) {
      throw new Error('Notification must belong to a tenant');
    }

    if (!this.channels || this.channels.length === 0) {
      throw new Error('At least one delivery channel is required');
    }

    if (this.expiresAt && this.expiresAt <= this.scheduledAt) {
      throw new Error('Expiration date must be after scheduled date');
    }

    if (this.maxRetries < 0) {
      throw new Error('Max retries must be non-negative');
    }
  }
}