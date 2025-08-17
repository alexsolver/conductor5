// ✅ 1QA.MD COMPLIANCE: NOTIFICATION DOMAIN ENTITY
// Domain layer - Pure business logic without external dependencies

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  priority: NotificationPriority;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  expiresAt?: Date;
  sourceId?: string;
  sourceType?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type NotificationType = 
  // Sistema
  | 'system_db_connection_failure'
  | 'system_db_pool_exhausted'
  | 'system_query_timeout'
  | 'system_auth_error'
  | 'system_schema_validation_failure'
  | 'system_tenant_isolation_violation'
  // Tickets
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_status_changed'
  | 'ticket_sla_escalation'
  | 'ticket_comment_added'
  | 'ticket_approval_request'
  // Operacional de Campo
  | 'field_technician_arrived'
  | 'field_technician_departed'
  | 'field_schedule_delayed'
  | 'field_service_timeout'
  | 'field_urgent_support_request'
  | 'field_equipment_failure'
  // Timecard/Ponto
  | 'timecard_entry_exit'
  | 'timecard_overtime_detected'
  | 'timecard_absence_unjustified'
  | 'timecard_inconsistency'
  | 'timecard_adjustment_approval'
  // Segurança
  | 'security_suspicious_login'
  | 'security_permission_changed'
  | 'security_after_hours_access'
  | 'security_access_denied_multiple'
  // Genérico
  | 'custom';

export type NotificationChannel = 
  | 'email'
  | 'in_app'
  | 'sms'
  | 'webhook'
  | 'slack';

export type NotificationStatus = 
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'read';

export type NotificationPriority = 
  | 'low'
  | 'medium'
  | 'high' 
  | 'critical';

// ✅ 1QA.MD: Domain methods for business logic
export class NotificationEntity implements Notification {
  constructor(
    public id: string,
    public tenantId: string,
    public userId: string,
    public type: NotificationType,
    public channel: NotificationChannel,
    public title: string,
    public message: string,
    public status: NotificationStatus,
    public priority: NotificationPriority,
    public retryCount: number,
    public maxRetries: number,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date,
    public data?: Record<string, any>,
    public scheduledAt?: Date,
    public sentAt?: Date,
    public readAt?: Date,
    public failureReason?: string,
    public expiresAt?: Date,
    public sourceId?: string,
    public sourceType?: string,
    public createdBy?: string,
    public updatedBy?: string
  ) {}

  // Business logic: Check if notification can be sent
  canBeSent(): boolean {
    if (!this.isActive) return false;
    if (this.status === 'sent' || this.status === 'delivered') return false;
    if (this.status === 'cancelled' || this.status === 'expired') return false;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    if (this.retryCount >= this.maxRetries && this.status === 'failed') return false;
    
    return true;
  }

  // Business logic: Mark as sent
  markAsSent(): void {
    this.status = 'sent';
    this.sentAt = new Date();
    this.updatedAt = new Date();
  }

  // Business logic: Mark as failed
  markAsFailed(reason: string): void {
    this.status = 'failed';
    this.failureReason = reason;
    this.retryCount++;
    this.updatedAt = new Date();
  }

  // Business logic: Mark as read
  markAsRead(): void {
    this.status = 'read';
    this.readAt = new Date();
    this.updatedAt = new Date();
  }

  // Business logic: Check if should retry
  shouldRetry(): boolean {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
  }

  // Business logic: Check if is expired
  isExpired(): boolean {
    return this.expiresAt ? this.expiresAt < new Date() : false;
  }
}