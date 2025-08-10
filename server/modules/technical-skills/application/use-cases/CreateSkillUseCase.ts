import { ISkillRepository } from '../../domain/ports/ISkillRepository';
import { Skill } from '../../domain/entities/Skill';

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

  async execute(request: CreateSkillRequest): Promise<Skill> {
    const skill = new Skill({
      id: crypto.randomUUID(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return await this.skillRepository.create(skill);
  }
}