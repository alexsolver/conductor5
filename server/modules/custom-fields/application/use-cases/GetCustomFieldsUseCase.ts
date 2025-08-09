
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';

export class GetCustomFieldsUseCase {
  constructor(
    private readonly customFieldRepository: ICustomFieldRepository
  ) {}

  async execute(entityType?: string): Promise<CustomField[]> {
    if (entityType) {
      return await this.customFieldRepository.findByEntityType(entityType);
    }
    return await this.customFieldRepository.findAll();
  }
}
