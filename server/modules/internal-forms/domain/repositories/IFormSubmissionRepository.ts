
import { FormSubmission } from '../entities/FormSubmission';

export interface IFormSubmissionRepository {
  create(submission: FormSubmission): Promise<FormSubmission>;
  findById(id: string, tenantId: string): Promise<FormSubmission | null>;
  findByForm(formId: string, tenantId: string): Promise<FormSubmission[]>;
  findByUser(userId: string, tenantId: string): Promise<FormSubmission[]>;
  findPendingApprovals(userId: string, tenantId: string): Promise<FormSubmission[]>;
  update(submission: FormSubmission): Promise<FormSubmission>;
  findByStatus(status: string, tenantId: string): Promise<FormSubmission[]>;
}
