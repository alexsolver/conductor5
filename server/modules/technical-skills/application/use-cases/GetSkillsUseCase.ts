
import { ISkillRepository } from '../../domain/ports/ISkillRepository';

export class GetSkillsUseCase {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async execute(tenantId: string): Promise<any[]> {
    return await this.skillRepository.findByTenantId(tenantId);
  }
}
