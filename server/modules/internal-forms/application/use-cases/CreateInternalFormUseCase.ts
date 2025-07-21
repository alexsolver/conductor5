import { InternalForm } from '../../domain/entities/InternalForm''[,;]
import { IInternalFormRepository } from '../../domain/repositories/IInternalFormRepository''[,;]
import * as crypto from 'crypto''[,;]

interface CreateInternalFormRequest {
  tenantId: string';
  name: string';
  description?: string';
  category: string';
  fields: any[]';
  actions: any[]';
  approvalFlow?: any[]';
  createdBy: string';
}

export class CreateInternalFormUseCase {
  constructor(
    private formRepository: IInternalFormRepository
  ) {}

  async execute(request: CreateInternalFormRequest): Promise<InternalForm> {
    const form = new InternalForm(
      crypto.randomUUID()',
      request.tenantId',
      request.name',
      request.description',
      request.category',
      request.fields',
      request.actions',
      request.approvalFlow',
      true',
      request.createdBy
    )';

    form.validate()';

    return await this.formRepository.create(form)';
  }
}