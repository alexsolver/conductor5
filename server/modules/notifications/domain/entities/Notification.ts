/**
 * Notification Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for notification management
 */

interface NotificationRecipient {
  userId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  address: string; // email, phone, device token, or user ID
}

export class Notification {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private title: string,
    private message: string,
    private type: 'info' | 'warning' | 'error' | 'success' = 'info',
    private priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    private recipients: NotificationRecipient[] = [],
    private scheduledAt: Date | null = null,
    private sentAt: Date | null = null,
    private status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled' = 'draft',
    private metadata: Record<string, any> = {},
    private retryCount: number = 0,
    private maxRetries: number = 3,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getTitle(): string { return this.title; }
  getMessage(): string { return this.message; }
  getType(): 'info' | 'warning' | 'error' | 'success' { return this.type; }
  getPriority(): 'low' | 'medium' | 'high' | 'urgent' { return this.priority; }
  getRecipients(): NotificationRecipient[] { return [...this.recipients]; }
  getScheduledAt(): Date | null { return this.scheduledAt; }
  getSentAt(): Date | null { return this.sentAt; }
  getStatus(): 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled' { return this.status; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getRetryCount(): number { return this.retryCount; }
  getMaxRetries(): number { return this.maxRetries; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateContent(title: string, message: string): void {
    if (this.status !== 'draft') {
      throw new Error('Cannot update content of non-draft notification');
    }
    if (!title.trim() || !message.trim()) {
      throw new Error('Title and message cannot be empty');
    }
    this.title = title.trim();
    this.message = message.trim();
    this.updatedAt = new Date();
  }

  changePriority(priority: 'low' | 'medium' | 'high' | 'urgent'): void {
    if (this.status === 'sent') {
      throw new Error('Cannot change priority of sent notification');
    }
    this.priority = priority;
    this.updatedAt = new Date();
  }

  changeType(type: 'info' | 'warning' | 'error' | 'success'): void {
    if (this.status !== 'draft') {
      throw new Error('Cannot change type of non-draft notification');
    }
    this.type = type;
    this.updatedAt = new Date();
  }

  addRecipient(recipient: NotificationRecipient): void {
    if (this.status === 'sent') {
      throw new Error('Cannot add recipients to sent notification');
    }
    
    // Check for duplicate recipient
    const exists = this.recipients.some(r => 
      r.userId === recipient.userId && 
      r.channel === recipient.channel &&
      r.address === recipient.address
    );
    
    if (!exists) {
      this.recipients.push(recipient);
      this.updatedAt = new Date();
    }
  }

  removeRecipient(userId: string, channel: 'email' | 'sms' | 'push' | 'in_app'): void {
    if (this.status === 'sent') {
      throw new Error('Cannot remove recipients from sent notification');
    }
    
    this.recipients = this.recipients.filter(r => 
      !(r.userId === userId && r.channel === channel)
    );
    this.updatedAt = new Date();
  }

  scheduleFor(scheduledAt: Date): void {
    if (this.status !== 'draft') {
      throw new Error('Can only schedule draft notifications');
    }
    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }
    if (this.recipients.length === 0) {
      throw new Error('Cannot schedule notification without recipients');
    }
    
    this.scheduledAt = scheduledAt;
    this.status = 'scheduled';
    this.updatedAt = new Date();
  }

  sendNow(): void {
    if (this.status !== 'draft' && this.status !== 'scheduled') {
      throw new Error('Can only send draft or scheduled notifications');
    }
    if (this.recipients.length === 0) {
      throw new Error('Cannot send notification without recipients');
    }
    
    this.sentAt = new Date();
    this.status = 'sent';
    this.updatedAt = new Date();
  }

  markAsFailed(): void {
    if (this.status !== 'scheduled' && this.status !== 'sent') {
      throw new Error('Can only mark scheduled or sending notifications as failed');
    }
    
    this.status = 'failed';
    this.updatedAt = new Date();
  }

  retry(): void {
    if (this.status !== 'failed') {
      throw new Error('Can only retry failed notifications');
    }
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts reached');
    }
    
    this.retryCount++;
    this.status = 'scheduled';
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status === 'sent') {
      throw new Error('Cannot cancel sent notification');
    }
    
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  removeMetadata(key: string): void {
    delete this.metadata[key];
    this.updatedAt = new Date();
  }

  // Business queries
  isReadyToSend(): boolean {
    return this.status === 'scheduled' && 
           this.scheduledAt !== null && 
           this.scheduledAt <= new Date() &&
           this.recipients.length > 0;
  }

  canBeRetried(): boolean {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
  }

  canBeModified(): boolean {
    return this.status === 'draft';
  }

  getRecipientsByChannel(channel: 'email' | 'sms' | 'push' | 'in_app'): NotificationRecipient[] {
    return this.recipients.filter(r => r.channel === channel);
  }

  getUniqueUserIds(): string[] {
    return [...new Set(this.recipients.map(r => r.userId))];
  }

  hasRecipient(userId: string): boolean {
    return this.recipients.some(r => r.userId === userId);
  }

  isUrgent(): boolean {
    return this.priority === 'urgent';
  }

  isScheduled(): boolean {
    return this.status === 'scheduled' && this.scheduledAt !== null;
  }

  getEstimatedDeliveryTime(): Date | null {
    if (!this.isScheduled()) return null;
    
    // Add estimated processing time based on priority
    const processingTime = this.priority === 'urgent' ? 0 : 
                          this.priority === 'high' ? 60000 : // 1 minute
                          this.priority === 'medium' ? 300000 : // 5 minutes
                          900000; // 15 minutes for low priority
    
    return new Date(this.scheduledAt!.getTime() + processingTime);
  }
}