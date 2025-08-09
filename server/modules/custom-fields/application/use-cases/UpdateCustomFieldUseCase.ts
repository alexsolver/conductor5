
import { CustomFieldUpdatedEvent } from '../../domain/events/CustomFieldUpdatedEvent';
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomFieldDomainService } from '../../domain/services/CustomFieldDomainService';

export interface UpdateCustomFieldRequest {
  id: string;
  name?: string;
  type?: string;
  config?: Record<string, any>;
  updatedBy: string;
  tenantId: string;
}

export class UpdateCustomFieldUseCase {
  constructor(
    private customFieldRepository: ICustomFieldRepository,
    private domainService: CustomFieldDomainService
  ) {}

  async execute(request: UpdateCustomFieldRequest): Promise<void> {
    const customField = await this.customFieldRepository.findById(request.id);
    
    if (!customField) {
      throw new Error('Custom field not found');
    }

    const updatedField = { ...customField, ...request };
    await this.customFieldRepository.update(updatedField);

    const event: CustomFieldUpdatedEvent = {
      id: crypto.randomUUID(),
      customFieldId: request.id,
      changes: request,
      updatedBy: request.updatedBy,
      updatedAt: new Date(),
      tenantId: request.tenantId
    };

    // Publish event logic would go here
  }
}
