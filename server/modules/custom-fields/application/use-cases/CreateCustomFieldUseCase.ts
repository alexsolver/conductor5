
import { CustomFieldApplicationService } from '../services/CustomFieldApplicationService';
import { CreateCustomFieldDTO } from '../dto/CreateCustomFieldDTO';
import { CustomField } from '../../domain/entities/CustomField';

export class CreateCustomFieldUseCase {
  constructor(
    private customFieldApplicationService: CustomFieldApplicationService
  ) {}

  async execute(data: CreateCustomFieldDTO): Promise<CustomField> {
    return await this.customFieldApplicationService.createCustomField(data);
  }
}
