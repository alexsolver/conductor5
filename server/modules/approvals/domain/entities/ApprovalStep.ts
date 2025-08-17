// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN LAYER
// Domain Entity: ApprovalStep - Pure business logic with no external dependencies

export interface ApprovalStepValue {
  id: string;
  tenantId: string;
  instanceId: string;
  stepIndex: number;
  stepName: string;
  decisionMode: 'ALL' | 'ANY' | 'QUORUM';
  quorumCount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  stepSlaHours: number;
  stepDeadline?: Date;
  approverConfiguration: Record<string, any>;
  approvedCount: number;
  rejectedCount: number;
  totalApprovers: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalStep {
  private constructor(private readonly data: ApprovalStepValue) {}

  static create(data: Omit<ApprovalStepValue, 'id' | 'createdAt' | 'updatedAt'>): ApprovalStep {
    const now = new Date();
    return new ApprovalStep({
      ...data,
      id: crypto.randomUUID(),
      status: data.status ?? 'pending',
      stepSlaHours: data.stepSlaHours ?? 24,
      approvedCount: data.approvedCount ?? 0,
      rejectedCount: data.rejectedCount ?? 0,
      totalApprovers: data.totalApprovers ?? 0,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromDatabase(data: ApprovalStepValue): ApprovalStep {
    return new ApprovalStep(data);
  }

  // Getters
  get id(): string { return this.data.id; }
  get tenantId(): string { return this.data.tenantId; }
  get instanceId(): string { return this.data.instanceId; }
  get stepIndex(): number { return this.data.stepIndex; }
  get stepName(): string { return this.data.stepName; }
  get decisionMode(): string { return this.data.decisionMode; }
  get quorumCount(): number | undefined { return this.data.quorumCount; }
  get status(): string { return this.data.status; }
  get startedAt(): Date | undefined { return this.data.startedAt; }
  get completedAt(): Date | undefined { return this.data.completedAt; }
  get stepSlaHours(): number { return this.data.stepSlaHours; }
  get stepDeadline(): Date | undefined { return this.data.stepDeadline; }
  get approverConfiguration(): Record<string, any> { return this.data.approverConfiguration; }
  get approvedCount(): number { return this.data.approvedCount; }
  get rejectedCount(): number { return this.data.rejectedCount; }
  get totalApprovers(): number { return this.data.totalApprovers; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Business Methods
  private update(updates: Partial<Omit<ApprovalStepValue, 'id' | 'tenantId' | 'createdAt'>>): ApprovalStep {
    return new ApprovalStep({
      ...this.data,
      ...updates,
      updatedAt: new Date(),
    });
  }

  // Lifecycle management
  start(): ApprovalStep {
    const now = new Date();
    const deadline = new Date(now.getTime() + (this.stepSlaHours * 60 * 60 * 1000));
    
    return this.update({
      startedAt: now,
      stepDeadline: deadline,
    });
  }

  // Decision tracking
  recordApproval(): ApprovalStep {
    const updated = this.update({
      approvedCount: this.approvedCount + 1,
    });

    // Check if step should be completed based on decision mode
    if (updated.shouldComplete()) {
      return updated.complete('approved');
    }

    return updated;
  }

  recordRejection(): ApprovalStep {
    const updated = this.update({
      rejectedCount: this.rejectedCount + 1,
    });

    // For rejection, if ANY approver rejects and mode is not ALL, step is rejected
    if (this.decisionMode === 'ANY' || updated.shouldComplete()) {
      return updated.complete('rejected');
    }

    return updated;
  }

  // Status transitions
  complete(finalStatus: 'approved' | 'rejected' | 'expired' | 'cancelled'): ApprovalStep {
    return this.update({
      status: finalStatus,
      completedAt: new Date(),
    });
  }

  expire(): ApprovalStep {
    return this.complete('expired');
  }

  cancel(): ApprovalStep {
    return this.complete('cancelled');
  }

  // Decision logic
  shouldComplete(): boolean {
    switch (this.decisionMode) {
      case 'ALL':
        return this.approvedCount === this.totalApprovers || this.rejectedCount > 0;
      
      case 'ANY':
        return this.approvedCount > 0 || this.rejectedCount === this.totalApprovers;
      
      case 'QUORUM':
        if (!this.quorumCount) return false;
        return this.approvedCount >= this.quorumCount || 
               this.rejectedCount > (this.totalApprovers - this.quorumCount);
      
      default:
        return false;
    }
  }

  getRequiredApprovals(): number {
    switch (this.decisionMode) {
      case 'ALL':
        return this.totalApprovers;
      case 'ANY':
        return 1;
      case 'QUORUM':
        return this.quorumCount || 1;
      default:
        return 1;
    }
  }

  getRemainingApprovals(): number {
    const required = this.getRequiredApprovals();
    return Math.max(0, required - this.approvedCount);
  }

  // SLA and timing
  isOverdue(): boolean {
    if (!this.stepDeadline || this.isCompleted()) {
      return false;
    }
    return new Date() > this.stepDeadline;
  }

  isCompleted(): boolean {
    return ['approved', 'rejected', 'expired', 'cancelled'].includes(this.status);
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isStarted(): boolean {
    return !!this.startedAt;
  }

  getTimeRemaining(): number | null {
    if (!this.stepDeadline || this.isCompleted()) {
      return null;
    }
    
    const now = new Date();
    const timeRemaining = this.stepDeadline.getTime() - now.getTime();
    return Math.max(0, Math.floor(timeRemaining / (1000 * 60))); // minutes
  }

  getElapsedTime(): number | null {
    if (!this.startedAt) {
      return null;
    }
    
    const endTime = this.completedAt || new Date();
    return Math.floor((endTime.getTime() - this.startedAt.getTime()) / (1000 * 60)); // minutes
  }

  getSlaUsagePercentage(): number | null {
    if (!this.startedAt || !this.stepDeadline) {
      return null;
    }
    
    const now = this.isCompleted() ? (this.completedAt || new Date()) : new Date();
    const totalTime = this.stepDeadline.getTime() - this.startedAt.getTime();
    const usedTime = now.getTime() - this.startedAt.getTime();
    
    return Math.min(100, Math.max(0, (usedTime / totalTime) * 100));
  }

  // Progress tracking
  getCompletionPercentage(): number {
    if (this.totalApprovers === 0) return 0;
    
    const required = this.getRequiredApprovals();
    const progress = Math.min(this.approvedCount, required);
    
    return (progress / required) * 100;
  }

  getParticipationPercentage(): number {
    if (this.totalApprovers === 0) return 0;
    
    const participated = this.approvedCount + this.rejectedCount;
    return (participated / this.totalApprovers) * 100;
  }

  // Approver management
  setTotalApprovers(count: number): ApprovalStep {
    return this.update({
      totalApprovers: count,
    });
  }

  updateApproverConfiguration(config: Record<string, any>): ApprovalStep {
    return this.update({
      approverConfiguration: config,
    });
  }

  // Domain validation
  validate(): string[] {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.instanceId) {
      errors.push('Instance ID is required');
    }

    if (!this.stepName.trim()) {
      errors.push('Step name is required');
    }

    if (this.stepIndex < 0) {
      errors.push('Step index cannot be negative');
    }

    if (this.stepSlaHours <= 0) {
      errors.push('Step SLA hours must be positive');
    }

    if (this.decisionMode === 'QUORUM') {
      if (!this.quorumCount || this.quorumCount <= 0) {
        errors.push('Quorum count is required for QUORUM decision mode');
      }
      
      if (this.quorumCount && this.totalApprovers > 0 && this.quorumCount > this.totalApprovers) {
        errors.push('Quorum count cannot exceed total approvers');
      }
    }

    if (this.approvedCount < 0) {
      errors.push('Approved count cannot be negative');
    }

    if (this.rejectedCount < 0) {
      errors.push('Rejected count cannot be negative');
    }

    if (this.totalApprovers < 0) {
      errors.push('Total approvers cannot be negative');
    }

    if (this.approvedCount + this.rejectedCount > this.totalApprovers) {
      errors.push('Sum of approved and rejected counts cannot exceed total approvers');
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'expired', 'cancelled'];
    if (!validStatuses.includes(this.status)) {
      errors.push('Invalid status');
    }

    if (this.isCompleted() && !this.completedAt) {
      errors.push('Completed steps must have completion date');
    }

    if (this.startedAt && this.completedAt && this.startedAt > this.completedAt) {
      errors.push('Start date cannot be after completion date');
    }

    return errors;
  }

  // Export for persistence
  toDatabase(): ApprovalStepValue {
    return { ...this.data };
  }
}