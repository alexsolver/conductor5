// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN LAYER
// Domain Entity: ApprovalInstance - Pure business logic with no external dependencies

export interface ApprovalInstanceValue {
  id: string;
  tenantId: string;
  ruleId: string;
  entityType: 'tickets' | 'materials' | 'knowledge_base' | 'timecard' | 'contracts';
  entityId: string;
  entityData?: Record<string, any>;
  currentStepIndex: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  requestedById: string;
  requestReason?: string;
  urgencyLevel: number;
  slaDeadline?: Date;
  firstReminderSent?: Date;
  secondReminderSent?: Date;
  escalatedAt?: Date;
  completedAt?: Date;
  completedById?: string;
  completionReason?: string;
  totalResponseTimeMinutes?: number;
  slaViolated: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalInstance {
  private constructor(private readonly data: ApprovalInstanceValue) {}

  static create(data: Omit<ApprovalInstanceValue, 'id' | 'createdAt' | 'updatedAt'>): ApprovalInstance {
    const now = new Date();
    return new ApprovalInstance({
      ...data,
      id: crypto.randomUUID(),
      currentStepIndex: data.currentStepIndex ?? 0,
      status: data.status ?? 'pending',
      urgencyLevel: data.urgencyLevel ?? 1,
      slaViolated: data.slaViolated ?? false,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromDatabase(data: ApprovalInstanceValue): ApprovalInstance {
    return new ApprovalInstance(data);
  }

  // Getters
  get id(): string { return this.data.id; }
  get tenantId(): string { return this.data.tenantId; }
  get ruleId(): string { return this.data.ruleId; }
  get entityType(): string { return this.data.entityType; }
  get entityId(): string { return this.data.entityId; }
  get entityData(): Record<string, any> | undefined { return this.data.entityData; }
  get currentStepIndex(): number { return this.data.currentStepIndex; }
  get status(): string { return this.data.status; }
  get requestedById(): string { return this.data.requestedById; }
  get requestReason(): string | undefined { return this.data.requestReason; }
  get urgencyLevel(): number { return this.data.urgencyLevel; }
  get slaDeadline(): Date | undefined { return this.data.slaDeadline; }
  get firstReminderSent(): Date | undefined { return this.data.firstReminderSent; }
  get secondReminderSent(): Date | undefined { return this.data.secondReminderSent; }
  get escalatedAt(): Date | undefined { return this.data.escalatedAt; }
  get completedAt(): Date | undefined { return this.data.completedAt; }
  get completedById(): string | undefined { return this.data.completedById; }
  get completionReason(): string | undefined { return this.data.completionReason; }
  get totalResponseTimeMinutes(): number | undefined { return this.data.totalResponseTimeMinutes; }
  get slaViolated(): boolean { return this.data.slaViolated; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Business Methods
  private update(updates: Partial<Omit<ApprovalInstanceValue, 'id' | 'tenantId' | 'createdAt'>>): ApprovalInstance {
    return new ApprovalInstance({
      ...this.data,
      ...updates,
      updatedAt: new Date(),
    });
  }

  // Workflow progression
  advanceToNextStep(): ApprovalInstance {
    return this.update({
      currentStepIndex: this.currentStepIndex + 1,
    });
  }

  // Status transitions
  approve(completedById: string, completionReason?: string): ApprovalInstance {
    const now = new Date();
    const responseTime = this.calculateResponseTime(now);
    
    return this.update({
      status: 'approved',
      completedAt: now,
      completedById,
      completionReason,
      totalResponseTimeMinutes: responseTime,
    });
  }

  reject(completedById: string, completionReason: string): ApprovalInstance {
    const now = new Date();
    const responseTime = this.calculateResponseTime(now);
    
    return this.update({
      status: 'rejected',
      completedAt: now,
      completedById,
      completionReason,
      totalResponseTimeMinutes: responseTime,
    });
  }

  cancel(completedById: string, completionReason?: string): ApprovalInstance {
    const now = new Date();
    
    return this.update({
      status: 'cancelled',
      completedAt: now,
      completedById,
      completionReason,
    });
  }

  expire(): ApprovalInstance {
    const now = new Date();
    
    return this.update({
      status: 'expired',
      completedAt: now,
      completionReason: 'SLA deadline exceeded',
      slaViolated: true,
    });
  }

  // SLA management
  setSlaDeadline(deadline: Date): ApprovalInstance {
    return this.update({
      slaDeadline: deadline,
    });
  }

  markFirstReminderSent(): ApprovalInstance {
    return this.update({
      firstReminderSent: new Date(),
    });
  }

  markSecondReminderSent(): ApprovalInstance {
    return this.update({
      secondReminderSent: new Date(),
    });
  }

  escalate(): ApprovalInstance {
    return this.update({
      escalatedAt: new Date(),
    });
  }

  violateSla(): ApprovalInstance {
    return this.update({
      slaViolated: true,
    });
  }

  // Utility methods
  private calculateResponseTime(endTime: Date): number {
    const startTime = this.createdAt;
    return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
  }

  isOverdue(): boolean {
    if (!this.slaDeadline) return false;
    return new Date() > this.slaDeadline && !this.isCompleted();
  }

  isCompleted(): boolean {
    return ['approved', 'rejected', 'expired', 'cancelled'].includes(this.status);
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  needsFirstReminder(): boolean {
    if (!this.slaDeadline || this.firstReminderSent || this.isCompleted()) {
      return false;
    }
    
    // Send first reminder at 75% of SLA time
    const reminderTime = new Date(this.createdAt.getTime() + 
      (this.slaDeadline.getTime() - this.createdAt.getTime()) * 0.75);
    
    return new Date() >= reminderTime;
  }

  needsSecondReminder(): boolean {
    if (!this.slaDeadline || this.secondReminderSent || this.isCompleted()) {
      return false;
    }
    
    // Send second reminder at 90% of SLA time
    const reminderTime = new Date(this.createdAt.getTime() + 
      (this.slaDeadline.getTime() - this.createdAt.getTime()) * 0.9);
    
    return new Date() >= reminderTime;
  }

  needsEscalation(): boolean {
    if (!this.slaDeadline || this.escalatedAt || this.isCompleted()) {
      return false;
    }
    
    // Escalate at 95% of SLA time
    const escalationTime = new Date(this.createdAt.getTime() + 
      (this.slaDeadline.getTime() - this.createdAt.getTime()) * 0.95);
    
    return new Date() >= escalationTime;
  }

  getTimeRemaining(): number | null {
    if (!this.slaDeadline || this.isCompleted()) {
      return null;
    }
    
    const now = new Date();
    const timeRemaining = this.slaDeadline.getTime() - now.getTime();
    return Math.max(0, Math.floor(timeRemaining / (1000 * 60))); // minutes
  }

  getSlaUsagePercentage(): number | null {
    if (!this.slaDeadline) {
      return null;
    }
    
    const now = this.isCompleted() ? (this.completedAt || new Date()) : new Date();
    const totalTime = this.slaDeadline.getTime() - this.createdAt.getTime();
    const usedTime = now.getTime() - this.createdAt.getTime();
    
    return Math.min(100, Math.max(0, (usedTime / totalTime) * 100));
  }

  // Domain validation
  validate(): string[] {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.ruleId) {
      errors.push('Rule ID is required');
    }

    if (!this.entityId) {
      errors.push('Entity ID is required');
    }

    if (!this.requestedById) {
      errors.push('Requested by ID is required');
    }

    if (this.urgencyLevel < 1 || this.urgencyLevel > 5) {
      errors.push('Urgency level must be between 1 and 5');
    }

    if (this.currentStepIndex < 0) {
      errors.push('Current step index cannot be negative');
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'expired', 'cancelled'];
    if (!validStatuses.includes(this.status)) {
      errors.push('Invalid status');
    }

    // Completion validation
    if (this.isCompleted() && !this.completedAt) {
      errors.push('Completed instances must have completion date');
    }

    if (this.status === 'rejected' && !this.completionReason) {
      errors.push('Rejected instances must have completion reason');
    }

    return errors;
  }

  // Export for persistence
  toDatabase(): ApprovalInstanceValue {
    return { ...this.data };
  }
}