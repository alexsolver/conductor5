
import { ISkillRepository } from '../../domain/repositories/ISkillRepository';
import { Skill } from '../../domain/entities/Skill';

export class CreateSkillUseCase {
  constructor(private skillRepository: ISkillRepository) {}

  async execute(skillData: any, tenantId: string): Promise<Skill> {
    const skill = new Skill(
      skillData.id,
      skillData.name,
      skillData.description,
      skillData.category,
      tenantId
    );

    return await this.skillRepository.create(skill);
  }
}
import { ISkillRepository } from '../../domain/ports/ISkillRepository';

export class CreateSkillUseCase {
  constructor(private skillRepository: ISkillRepository) {}

  async execute(skillData: any): Promise<any> {
    if (!skillData.name) {
      throw new Error('Skill name is required');
    }
    
    return await this.skillRepository.create(skillData);
  }
}
