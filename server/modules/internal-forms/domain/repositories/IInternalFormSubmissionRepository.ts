import { InternalFormSubmission, InsertInternalFormSubmission } from '@shared/schema';

export interface IInternalFormSubmissionRepository {
  create(submission: InsertInternalFormSubmission): Promise<InternalFormSubmission>;
  findById(id: string, tenantId: string): Promise<InternalFormSubmission | null>;
  findByFormId(formId: string, tenantId: string): Promise<InternalFormSubmission[]>;
  findByTicketId(ticketId: string, tenantId: string): Promise<InternalFormSubmission[]>;
  updateStatus(
    id: string,
    status: 'submitted' | 'in_approval' | 'approved' | 'rejected',
    tenantId: string,
    userId?: string,
    reason?: string
  ): Promise<void>;
}
