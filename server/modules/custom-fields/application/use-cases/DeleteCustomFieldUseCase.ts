
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';

export class DeleteCustomFieldUseCase {
  constructor(private customFieldRepository: ICustomFieldRepository) {}

  async execute(id: string): Promise<void> {
    const existingField = await this.customFieldRepository.findById(id);
    if (!existingField) {
      throw new Error('Custom field not found');
    }

    await this.customFieldRepository.delete(id);
  }
}
