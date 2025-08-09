
import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';

export class DeleteFieldLayoutUseCase {
  constructor(
    private readonly fieldLayoutRepository: IFieldLayoutRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const exists = await this.fieldLayoutRepository.findById(id);
    if (!exists) {
      return false;
    }
    
    return await this.fieldLayoutRepository.delete(id);
  }
}
