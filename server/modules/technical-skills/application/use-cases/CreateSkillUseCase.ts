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