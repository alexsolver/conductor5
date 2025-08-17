export type ApprovalInstanceStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type SlaStatus = 'active' | 'warning' | 'breached';
export type ModuleType = 'tickets' | 'materials' | 'knowledge_base' | 'timecard' | 'contracts';

export class ApprovalInstance {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly ruleId: string,
    public readonly entityType: ModuleType,
    public readonly entityId: string,
    public readonly entityData: Record<string, any>,
    public readonly currentStepIndex: number,
    public readonly status: ApprovalInstanceStatus,
    public readonly slaDeadline: Date | null,
    public readonly slaStarted: Date,
    public readonly slaElapsedMinutes: number,
    public readonly slaStatus: SlaStatus,
    public readonly requestComments: string | null,
    public readonly finalComments: string | null,
    public readonly lastEscalationAt: Date | null,
    public readonly remindersSent: number,
    public readonly approvedAt: Date | null,
    public readonly rejectedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly expiredAt: Date | null,
    public readonly requestedById: string,
    public readonly completedById: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validateInstance();
  }

  private validateInstance(): void {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.ruleId) {
      throw new Error('Rule ID is required');
    }

    if (!this.entityId) {
      throw new Error('Entity ID is required');
    }

    if (!this.requestedById) {
      throw new Error('Requested by ID is required');
    }

    if (this.currentStepIndex < 0) {
      throw new Error('Current step index cannot be negative');
    }

    if (this.slaElapsedMinutes < 0) {
      throw new Error('SLA elapsed minutes cannot be negative');
    }

    if (this.remindersSent < 0) {
      throw new Error('Reminders sent cannot be negative');
    }
  }

  public isPending(): boolean {
    return this.status === 'pending';
  }

  public isCompleted(): boolean {
    return ['approved', 'rejected', 'expired', 'cancelled'].includes(this.status);
  }

  public isApproved(): boolean {
    return this.status === 'approved';
  }

  public isRejected(): boolean {
    return this.status === 'rejected';
  }

  public isExpired(): boolean {
    return this.status === 'expired';
  }

  public isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  public isSlaBreached(): boolean {
    return this.slaStatus === 'breached';
  }

  public isSlaWarning(): boolean {
    return this.slaStatus === 'warning';
  }

  public calculateSlaElapsed(): number {
    if (!this.slaDeadline) {
      return 0;
    }

    const now = new Date();
    const totalSlaMinutes = Math.floor((this.slaDeadline.getTime() - this.slaStarted.getTime()) / (1000 * 60));
    const elapsedMinutes = Math.floor((now.getTime() - this.slaStarted.getTime()) / (1000 * 60));

    return Math.min(Math.max((elapsedMinutes / totalSlaMinutes) * 100, 0), 100);
  }

  public getSlaPercentage(): number {
    return this.calculateSlaElapsed();
  }

  public getRemainingMinutes(): number {
    if (!this.slaDeadline) {
      return 0;
    }

    const now = new Date();
    const remainingMs = this.slaDeadline.getTime() - now.getTime();
    
    return Math.max(Math.floor(remainingMs / (1000 * 60)), 0);
  }

  public shouldSendReminder(): boolean {
    if (this.isCompleted()) {
      return false;
    }

    const slaPercentage = this.getSlaPercentage();
    const reminderThresholds = [25, 50, 75, 90, 95]; // Percentages at which to send reminders
    
    const nextThreshold = reminderThresholds[this.remindersSent];
    
    return nextThreshold !== undefined && slaPercentage >= nextThreshold;
  }

  public shouldEscalate(): boolean {
    if (this.isCompleted()) {
      return false;
    }

    return this.isSlaBreached();
  }

  public getProcessingTime(): number | null {
    if (!this.completedAt) {
      return null;
    }

    return Math.floor((this.completedAt.getTime() - this.createdAt.getTime()) / (1000 * 60));
  }

  public canBeCancelled(): boolean {
    return this.isPending() && !this.isCompleted();
  }

  public getEntityReference(): string {
    return `${this.entityType}:${this.entityId}`;
  }

  public static fromDatabase(data: any): ApprovalInstance {
    return new ApprovalInstance(
      data.id,
      data.tenantId || data.tenant_id,
      data.ruleId || data.rule_id,
      data.entityType || data.entity_type,
      data.entityId || data.entity_id,
      data.entityData || data.entity_data || {},
      data.currentStepIndex || data.current_step_index || 0,
      data.status || 'pending',
      data.slaDeadline ? new Date(data.slaDeadline || data.sla_deadline) : null,
      new Date(data.slaStarted || data.sla_started),
      data.slaElapsedMinutes || data.sla_elapsed_minutes || 0,
      data.slaStatus || data.sla_status || 'active',
      data.requestComments || data.request_comments || null,
      data.finalComments || data.final_comments || null,
      data.lastEscalationAt ? new Date(data.lastEscalationAt || data.last_escalation_at) : null,
      data.remindersSent || data.reminders_sent || 0,
      data.approvedAt ? new Date(data.approvedAt || data.approved_at) : null,
      data.rejectedAt ? new Date(data.rejectedAt || data.rejected_at) : null,
      data.completedAt ? new Date(data.completedAt || data.completed_at) : null,
      data.expiredAt ? new Date(data.expiredAt || data.expired_at) : null,
      data.requestedById || data.requested_by_id,
      data.completedById || data.completed_by_id || null,
      data.isActive !== undefined ? data.isActive : data.is_active !== undefined ? data.is_active : true,
      new Date(data.createdAt || data.created_at),
      new Date(data.updatedAt || data.updated_at)
    );
  }

  public toDatabase(): Record<string, any> {
    return {
      id: this.id,
      tenant_id: this.tenantId,
      rule_id: this.ruleId,
      entity_type: this.entityType,
      entity_id: this.entityId,
      entity_data: this.entityData,
      current_step_index: this.currentStepIndex,
      status: this.status,
      sla_deadline: this.slaDeadline,
      sla_started: this.slaStarted,
      sla_elapsed_minutes: this.slaElapsedMinutes,
      sla_status: this.slaStatus,
      request_comments: this.requestComments,
      final_comments: this.finalComments,
      last_escalation_at: this.lastEscalationAt,
      reminders_sent: this.remindersSent,
      approved_at: this.approvedAt,
      rejected_at: this.rejectedAt,
      completed_at: this.completedAt,
      expired_at: this.expiredAt,
      requested_by_id: this.requestedById,
      completed_by_id: this.completedById,
      is_active: this.isActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}