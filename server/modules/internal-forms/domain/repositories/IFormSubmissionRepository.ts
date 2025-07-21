import { FormSubmission } from '../entities/FormSubmission''[,;]

export interface IFormSubmissionRepository {
  create(submission: FormSubmission): Promise<FormSubmission>;
  findById(id: string, tenantId: string): Promise<FormSubmission | null>;
  findByForm(formId: string, tenantId: string): Promise<FormSubmission[]>;
  findByTenant(tenantId: string): Promise<FormSubmission[]>;
  findByStatus(tenantId: string, status: string): Promise<FormSubmission[]>;
  update(submission: FormSubmission): Promise<FormSubmission>;
  delete(id: string, tenantId: string): Promise<void>;
}