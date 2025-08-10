
import { ISkillRepository } from '../../domain/ports/ISkillRepository';

export class UpdateSkillUseCase {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async execute(id: string, tenantId: string, updates: any): Promise<any> {
    return await this.skillRepository.update(id, tenantId, updates);
  }
}
