// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN LAYER
// Domain Entity: ApprovalDecision - Pure business logic with no external dependencies

export interface ApprovalDecisionValue {
  id: string;
  tenantId: string;
  instanceId: string;
  stepId: string;
  approverType: 'user' | 'user_group' | 'customer_contact' | 'supplier' | 'manager_chain' | 'auto';
  approverId?: string;
  approverGroupId?: string;
  approverName: string;
  decision: 'approved' | 'rejected' | 'delegated' | 'escalated';
  comments: string;
  attachments?: Record<string, any>;
  decidedAt: Date;
  notifiedAt?: Date;
  responseTimeMinutes?: number;
  delegatedToId?: string;
  escalatedFromStepId?: string;
  escalationReason?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalDecision {
  private constructor(private readonly data: ApprovalDecisionValue) {}

  static create(data: Omit<ApprovalDecisionValue, 'id' | 'createdAt' | 'updatedAt'>): ApprovalDecision {
    const now = new Date();
    return new ApprovalDecision({
      ...data,
      id: crypto.randomUUID(),
      decidedAt: data.decidedAt ?? now,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromDatabase(data: ApprovalDecisionValue): ApprovalDecision {
    return new ApprovalDecision(data);
  }

  // Getters
  get id(): string { return this.data.id; }
  get tenantId(): string { return this.data.tenantId; }
  get instanceId(): string { return this.data.instanceId; }
  get stepId(): string { return this.data.stepId; }
  get approverType(): string { return this.data.approverType; }
  get approverId(): string | undefined { return this.data.approverId; }
  get approverGroupId(): string | undefined { return this.data.approverGroupId; }
  get approverName(): string { return this.data.approverName; }
  get decision(): string { return this.data.decision; }
  get comments(): string { return this.data.comments; }
  get attachments(): Record<string, any> | undefined { return this.data.attachments; }
  get decidedAt(): Date { return this.data.decidedAt; }
  get notifiedAt(): Date | undefined { return this.data.notifiedAt; }
  get responseTimeMinutes(): number | undefined { return this.data.responseTimeMinutes; }
  get delegatedToId(): string | undefined { return this.data.delegatedToId; }
  get escalatedFromStepId(): string | undefined { return this.data.escalatedFromStepId; }
  get escalationReason(): string | undefined { return this.data.escalationReason; }
  get ipAddress(): string | undefined { return this.data.ipAddress; }
  get userAgent(): string | undefined { return this.data.userAgent; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Business Methods
  private update(updates: Partial<Omit<ApprovalDecisionValue, 'id' | 'tenantId' | 'createdAt'>>): ApprovalDecision {
    return new ApprovalDecision({
      ...this.data,
      ...updates,
      updatedAt: new Date(),
    });
  }

  // Decision factory methods
  static createApproval(
    tenantId: string,
    instanceId: string,
    stepId: string,
    approverType: string,
    approverId: string | undefined,
    approverName: string,
    comments: string,
    auditInfo?: { ipAddress?: string; userAgent?: string }
  ): ApprovalDecision {
    return ApprovalDecision.create({
      tenantId,
      instanceId,
      stepId,
      approverType: approverType as any,
      approverId,
      approverName,
      decision: 'approved',
      comments,
      ipAddress: auditInfo?.ipAddress,
      userAgent: auditInfo?.userAgent,
    });
  }

  static createRejection(
    tenantId: string,
    instanceId: string,
    stepId: string,
    approverType: string,
    approverId: string | undefined,
    approverName: string,
    comments: string,
    auditInfo?: { ipAddress?: string; userAgent?: string }
  ): ApprovalDecision {
    return ApprovalDecision.create({
      tenantId,
      instanceId,
      stepId,
      approverType: approverType as any,
      approverId,
      approverName,
      decision: 'rejected',
      comments,
      ipAddress: auditInfo?.ipAddress,
      userAgent: auditInfo?.userAgent,
    });
  }

  static createDelegation(
    tenantId: string,
    instanceId: string,
    stepId: string,
    approverType: string,
    approverId: string | undefined,
    approverName: string,
    delegatedToId: string,
    comments: string,
    auditInfo?: { ipAddress?: string; userAgent?: string }
  ): ApprovalDecision {
    return ApprovalDecision.create({
      tenantId,
      instanceId,
      stepId,
      approverType: approverType as any,
      approverId,
      approverName,
      decision: 'delegated',
      comments,
      delegatedToId,
      ipAddress: auditInfo?.ipAddress,
      userAgent: auditInfo?.userAgent,
    });
  }

  static createEscalation(
    tenantId: string,
    instanceId: string,
    stepId: string,
    approverType: string,
    approverId: string | undefined,
    approverName: string,
    escalatedFromStepId: string,
    escalationReason: string,
    auditInfo?: { ipAddress?: string; userAgent?: string }
  ): ApprovalDecision {
    return ApprovalDecision.create({
      tenantId,
      instanceId,
      stepId,
      approverType: approverType as any,
      approverId,
      approverName,
      decision: 'escalated',
      comments: escalationReason,
      escalatedFromStepId,
      escalationReason,
      ipAddress: auditInfo?.ipAddress,
      userAgent: auditInfo?.userAgent,
    });
  }

  // Notification tracking
  markNotified(): ApprovalDecision {
    return this.update({
      notifiedAt: new Date(),
    });
  }

  // Response time calculation
  calculateResponseTime(requestTime: Date): ApprovalDecision {
    const responseMinutes = Math.floor((this.decidedAt.getTime() - requestTime.getTime()) / (1000 * 60));
    return this.update({
      responseTimeMinutes: responseMinutes,
    });
  }

  // Attachment management
  addAttachments(attachments: Record<string, any>): ApprovalDecision {
    const currentAttachments = this.attachments || {};
    return this.update({
      attachments: { ...currentAttachments, ...attachments },
    });
  }

  // Decision type checks
  isApproval(): boolean {
    return this.decision === 'approved';
  }

  isRejection(): boolean {
    return this.decision === 'rejected';
  }

  isDelegation(): boolean {
    return this.decision === 'delegated';
  }

  isEscalation(): boolean {
    return this.decision === 'escalated';
  }

  isFinalDecision(): boolean {
    return this.isApproval() || this.isRejection();
  }

  // Approver identification
  isUserApprover(): boolean {
    return this.approverType === 'user';
  }

  isGroupApprover(): boolean {
    return this.approverType === 'user_group';
  }

  isExternalApprover(): boolean {
    return ['customer_contact', 'supplier'].includes(this.approverType);
  }

  isAutoDecision(): boolean {
    return this.approverType === 'auto';
  }

  isManagerChainApprover(): boolean {
    return this.approverType === 'manager_chain';
  }

  // Audit and compliance
  hasAuditTrail(): boolean {
    return !!(this.ipAddress && this.userAgent);
  }

  isTimely(slaDeadline?: Date): boolean {
    if (!slaDeadline) return true;
    return this.decidedAt <= slaDeadline;
  }

  // Response quality metrics
  hasSubstantialComments(): boolean {
    return this.comments.trim().length >= 10; // Minimum comment length
  }

  hasAttachments(): boolean {
    return !!(this.attachments && Object.keys(this.attachments).length > 0);
  }

  // Delegation validation
  isValidDelegation(): boolean {
    return this.isDelegation() && !!this.delegatedToId;
  }

  // Escalation validation
  isValidEscalation(): boolean {
    return this.isEscalation() && !!this.escalatedFromStepId && !!this.escalationReason;
  }

  // Decision summary
  getDecisionSummary(): {
    decision: string;
    approver: string;
    timestamp: Date;
    hasComments: boolean;
    hasAttachments: boolean;
    responseTime?: number;
  } {
    return {
      decision: this.decision,
      approver: this.approverName,
      timestamp: this.decidedAt,
      hasComments: this.comments.trim().length > 0,
      hasAttachments: this.hasAttachments(),
      responseTime: this.responseTimeMinutes,
    };
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

    if (!this.stepId) {
      errors.push('Step ID is required');
    }

    if (!this.approverName.trim()) {
      errors.push('Approver name is required');
    }

    if (!this.comments.trim()) {
      errors.push('Comments are required');
    }

    const validApproverTypes = ['user', 'user_group', 'customer_contact', 'supplier', 'manager_chain', 'auto'];
    if (!validApproverTypes.includes(this.approverType)) {
      errors.push('Invalid approver type');
    }

    const validDecisions = ['approved', 'rejected', 'delegated', 'escalated'];
    if (!validDecisions.includes(this.decision)) {
      errors.push('Invalid decision');
    }

    // Type-specific validations
    if (this.approverType === 'user' && !this.approverId) {
      errors.push('User approver must have approver ID');
    }

    if (this.approverType === 'user_group' && !this.approverGroupId) {
      errors.push('Group approver must have approver group ID');
    }

    if (this.isDelegation() && !this.delegatedToId) {
      errors.push('Delegation must specify delegated to ID');
    }

    if (this.isEscalation()) {
      if (!this.escalatedFromStepId) {
        errors.push('Escalation must specify escalated from step ID');
      }
      if (!this.escalationReason) {
        errors.push('Escalation must specify escalation reason');
      }
    }

    // Business rule validations
    if (this.isRejection() && this.comments.trim().length < 5) {
      errors.push('Rejection decisions must have substantial comments');
    }

    return errors;
  }

  // Export for persistence
  toDatabase(): ApprovalDecisionValue {
    return { ...this.data };
  }
}