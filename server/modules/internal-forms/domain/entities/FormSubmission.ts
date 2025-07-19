
export interface FormSubmissionData {
  [fieldName: string]: any;
}

export interface FormSubmissionApproval {
  level: number;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: Date;
}

export class FormSubmission {
  constructor(
    public readonly id: string,
    public readonly formId: string,
    public readonly tenantId: string,
    public data: FormSubmissionData,
    public submittedBy: string,
    public status: 'draft' | 'submitted' | 'in_approval' | 'approved' | 'rejected' | 'completed' = 'submitted',
    public approvals: FormSubmissionApproval[] = [],
    public readonly submittedAt: Date = new Date(),
    public completedAt?: Date
  ) {}

  public approve(level: number, approver: string, comment?: string): void {
    const approval = this.approvals.find(a => a.level === level);
    if (approval) {
      approval.status = 'approved';
      approval.approver = approver;
      approval.comment = comment;
      approval.approvedAt = new Date();
    }
    
    this.checkApprovalComplete();
  }

  public reject(level: number, approver: string, comment: string): void {
    const approval = this.approvals.find(a => a.level === level);
    if (approval) {
      approval.status = 'rejected';
      approval.approver = approver;
      approval.comment = comment;
      approval.approvedAt = new Date();
    }
    
    this.status = 'rejected';
  }

  private checkApprovalComplete(): void {
    const allApproved = this.approvals.every(a => a.status === 'approved');
    if (allApproved) {
      this.status = 'approved';
    }
  }

  public complete(): void {
    this.status = 'completed';
    this.completedAt = new Date();
  }
}
