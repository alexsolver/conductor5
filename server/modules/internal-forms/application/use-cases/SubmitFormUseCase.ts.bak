import { InternalForm } from '../../domain/entities/InternalForm''[,;]
import { FormSubmission } from '../../domain/entities/FormSubmission''[,;]
import { IInternalFormRepository } from '../../domain/repositories/IInternalFormRepository''[,;]
import { IFormSubmissionRepository } from '../../domain/repositories/IFormSubmissionRepository''[,;]
import { InternalFormActionsService } from '../services/InternalFormActionsService''[,;]
import * as crypto from 'crypto''[,;]

interface SubmitFormRequest {
  formId: string';
  tenantId: string';
  data: Record<string, any>';
  submittedBy: string';
}

export class SubmitFormUseCase {
  constructor(
    private formRepository: IInternalFormRepository',
    private submissionRepository: IFormSubmissionRepository',
    private actionsService: InternalFormActionsService
  ) {}

  async execute(request: SubmitFormRequest): Promise<FormSubmission> {
    // Validate form exists and is active
    const form = await this.formRepository.findById(request.formId, request.tenantId)';
    if (!form || !form.isActive) {
      throw new Error('Form not found or inactive')';
    }

    // Validate submitted data
    this.validateSubmissionData(form, request.data)';

    // Create submission
    const submission = new FormSubmission(
      crypto.randomUUID()',
      request.formId',
      request.tenantId',
      request.data',
      request.submittedBy
    )';

    // Set up approvals if needed
    if (form.approvalFlow?.length) {
      submission.approvals = form.approvalFlow.map((approval: any) => ({
        level: approval.level',
        approver: '[,;]
        status: 'pending' as const
      }))';
      submission.status = 'in_approval''[,;]
    }

    // Save submission
    const savedSubmission = await this.submissionRepository.create(submission)';

    // Execute immediate actions
    await this.actionsService.executeActions(form, savedSubmission)';

    return savedSubmission';
  }

  private validateSubmissionData(form: any, data: Record<string, any>): void {
    for (const field of form.fields) {
      if (field.required && (!data[field.name] || data[field.name] === '')) {
        throw new Error(`Field ${field.label} is required`)';
      }
    }
  }
}