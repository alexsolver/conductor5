
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomFieldDomainService } from '../../domain/services/CustomFieldDomainService';
import { CreateCustomFieldDTO } from '../dto/CreateCustomFieldDTO';
import { CustomField } from '../../domain/entities/CustomField';

export class CustomFieldApplicationService {
  constructor(
    private customFieldRepository: ICustomFieldRepository,
    private customFieldDomainService: CustomFieldDomainService
  ) {}

  async createCustomField(data: CreateCustomFieldDTO): Promise<CustomField> {
    const customField = new CustomField({
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      name: data.name,
      type: data.type,
      label: data.label,
      required: data.required,
      options: data.options,
      defaultValue: data.defaultValue,
      validationRules: data.validationRules,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.customFieldDomainService.validateCustomFieldConfiguration(customField);

    return await this.customFieldRepository.create(customField);
  }

  async getCustomFieldsByTenant(tenantId: string): Promise<CustomField[]> {
    return await this.customFieldRepository.findByTenant(tenantId);
  }
}
