export type DecisionType = 'approved' | 'rejected' | 'delegated' | 'escalated';
export type ApproverType = 'user' | 'group' | 'external' | 'automated';

export class ApprovalDecision {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly instanceId: string,
    public readonly stepId: string,
    public readonly approverId: string | null,
    public readonly approverType: ApproverType,
    public readonly approverIdentifier: string | null,
    public readonly decision: DecisionType,
    public readonly comments: string | null,
    public readonly reasonCode: string | null,
    public readonly delegatedToId: string | null,
    public readonly delegationReason: string | null,
    public readonly responseTimeMinutes: number | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validateDecision();
  }

  private validateDecision(): void {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.instanceId) {
      throw new Error('Instance ID is required');
    }

    if (!this.stepId) {
      throw new Error('Step ID is required');
    }

    if (this.decision === 'delegated' && !this.delegatedToId) {
      throw new Error('Delegated to ID is required for delegation decisions');
    }

    if (this.decision === 'rejected' && (!this.comments || this.comments.trim().length === 0)) {
      throw new Error('Comments are required for rejection decisions');
    }

    if (this.responseTimeMinutes !== null && this.responseTimeMinutes < 0) {
      throw new Error('Response time cannot be negative');
    }
  }

  public isApproval(): boolean {
    return this.decision === 'approved';
  }

  public isRejection(): boolean {
    return this.decision === 'rejected';
  }

  public isDelegation(): boolean {
    return this.decision === 'delegated';
  }

  public isEscalation(): boolean {
    return this.decision === 'escalated';
  }

  public isUserDecision(): boolean {
    return this.approverType === 'user';
  }

  public isAutomatedDecision(): boolean {
    return this.approverType === 'automated';
  }

  public isExternalDecision(): boolean {
    return this.approverType === 'external';
  }

  public isGroupDecision(): boolean {
    return this.approverType === 'group';
  }

  public hasComments(): boolean {
    return this.comments !== null && this.comments.trim().length > 0;
  }

  public getApproverDisplay(): string {
    if (this.approverType === 'user' && this.approverId) {
      return `User: ${this.approverId}`;
    }

    if (this.approverType === 'group' && this.approverIdentifier) {
      return `Group: ${this.approverIdentifier}`;
    }

    if (this.approverType === 'external' && this.approverIdentifier) {
      return `External: ${this.approverIdentifier}`;
    }

    if (this.approverType === 'automated') {
      return 'System (Automated)';
    }

    return 'Unknown Approver';
  }

  public static fromDatabase(data: any): ApprovalDecision {
    return new ApprovalDecision(
      data.id,
      data.tenantId || data.tenant_id,
      data.instanceId || data.instance_id,
      data.stepId || data.step_id,
      data.approverId || data.approver_id || null,
      data.approverType || data.approver_type,
      data.approverIdentifier || data.approver_identifier || null,
      data.decision,
      data.comments || null,
      data.reasonCode || data.reason_code || null,
      data.delegatedToId || data.delegated_to_id || null,
      data.delegationReason || data.delegation_reason || null,
      data.responseTimeMinutes || data.response_time_minutes || null,
      data.ipAddress || data.ip_address || null,
      data.userAgent || data.user_agent || null,
      data.isActive !== undefined ? data.isActive : data.is_active !== undefined ? data.is_active : true,
      new Date(data.createdAt || data.created_at),
      new Date(data.updatedAt || data.updated_at)
    );
  }

  public toDatabase(): Record<string, any> {
    return {
      id: this.id,
      tenant_id: this.tenantId,
      instance_id: this.instanceId,
      step_id: this.stepId,
      approver_id: this.approverId,
      approver_type: this.approverType,
      approver_identifier: this.approverIdentifier,
      decision: this.decision,
      comments: this.comments,
      reason_code: this.reasonCode,
      delegated_to_id: this.delegatedToId,
      delegation_reason: this.delegationReason,
      response_time_minutes: this.responseTimeMinutes,
      ip_address: this.ipAddress,
      user_agent: this.userAgent,
      is_active: this.isActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}