import { ISkillRepository } from '../../domain/ports/ISkillRepository';

interface CreateSkillRequest {
  name: string;
  description?: string;
  category: string;
  level: number;
  tenantId: string;
}

export class CreateSkillUseCase {
  constructor(
    private readonly skillRepository: ISkillRepository
  ) {}

  async execute(request: CreateSkillRequest): Promise<any> {
    const skill = {
      id: crypto.randomUUID(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.skillRepository.create(skill);
  }
}
import { Skill } from '../../domain/entities/Skill';
import { ISkillRepository } from '../../domain/ports/ISkillRepository';

export class CreateSkillUseCase {
  constructor(
    private readonly skillRepository: ISkillRepository
  ) {}

  async execute(skillData: any, tenantId: string): Promise<Skill> {
    const skill = new Skill(skillData);
    return await this.skillRepository.create(skill);
  }
}
