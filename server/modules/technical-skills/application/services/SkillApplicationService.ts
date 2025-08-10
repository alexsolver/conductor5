// Removed express dependency - application layer should not depend on web framework
import { CreateSkillUseCase } from '../use-cases/CreateSkillUseCase';
import { GetSkillsUseCase } from '../use-cases/GetSkillsUseCase';
import { UpdateSkillUseCase } from '../use-cases/UpdateSkillUseCase';
import { CreateSkillDTO, UpdateSkillDTO, SkillResponseDTO } from '../dto/CreateSkillDTO';
import { ISkillRepository } from '../../domain/repositories/ISkillRepository';

export class SkillApplicationService {
  constructor(
    private readonly createSkillUseCase: CreateSkillUseCase,
    private readonly getSkillsUseCase: GetSkillsUseCase,
    private readonly updateSkillUseCase: UpdateSkillUseCase
  ) {}

  async createSkill(tenantId: string, data: CreateSkillDTO): Promise<SkillResponseDTO> {
    const skill = await this.createSkillUseCase.execute({ ...data, tenantId });
    return this.mapToResponseDTO(skill);
  }

  async getSkills(tenantId: string): Promise<SkillResponseDTO[]> {
    const skills = await this.getSkillsUseCase.execute(tenantId);
    return skills.map(skill => this.mapToResponseDTO(skill));
  }

  async updateSkill(id: string, tenantId: string, data: UpdateSkillDTO): Promise<SkillResponseDTO> {
    const skill = await this.updateSkillUseCase.execute(id, tenantId, data);
    return this.mapToResponseDTO(skill);
  }

  private mapToResponseDTO(skill: any): SkillResponseDTO {
    return {
      id: skill.id,
      tenantId: skill.tenantId,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      level: skill.level,
      certificationRequired: skill.certificationRequired,
      active: skill.active,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt
    };
  }
}