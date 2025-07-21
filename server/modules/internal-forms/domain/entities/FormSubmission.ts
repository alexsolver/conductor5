export class FormSubmission {
  constructor(
    public readonly id: string,
    public readonly formId: string,
    public readonly tenantId: string,
    public readonly data: Record<string, any>,
    public readonly submittedBy: string,
    public status: string = 'submitted''[,;]
    public approvals?: Record<string, any>,
    public readonly submittedAt: Date = new Date(),
    public completedAt?: Date
  ) {}

  isCompleted(): boolean {
    return this.status === 'completed' || this.status === 'approved''[,;]
  }

  isPending(): boolean {
    return this.status === 'pending' || this.status === 'submitted''[,;]
  }

  approve(approverEmail: string, comments?: string): void {
    this.status = 'approved''[,;]
    this.completedAt = new Date();
    
    if (!this.approvals) {
      this.approvals = {};
    }
    
    this.approvals[approverEmail] = {
      status: 'approved''[,;]
      timestamp: new Date(),
      comments
    };
  }

  reject(approverEmail: string, reason: string): void {
    this.status = 'rejected''[,;]
    this.completedAt = new Date();
    
    if (!this.approvals) {
      this.approvals = {};
    }
    
    this.approvals[approverEmail] = {
      status: 'rejected''[,;]
      timestamp: new Date(),
      reason
    };
  }
}