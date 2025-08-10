
import { ISkillRepository } from '../../domain/repositories/ISkillRepository';
import { Skill } from '../../domain/entities/Skill';
import { SkillValidationService } from '../../domain/services/SkillValidationService';

export class CreateSkillUseCase {
  constructor(
    private skillRepository: ISkillRepository,
    private validationService: SkillValidationService
  ) {}

  async execute(name: string, category: string, description?: string): Promise<Skill> {
    this.validationService.validateSkillName(name);
    
    const skill = new Skill({
      id: crypto.randomUUID(),
      name,
      category,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return await this.skillRepository.save(skill);
  }
}
