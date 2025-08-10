import { ISkillRepository } from '../../domain/ports/ISkillRepository';
import { CreateSkillUseCase } from '../use-cases/CreateSkillUseCase';
import { GetSkillsUseCase } from '../use-cases/GetSkillsUseCase';
import { UpdateSkillUseCase } from '../use-cases/UpdateSkillUseCase';
import { CreateSkillDTO, UpdateSkillDTO, SkillResponseDTO } from '../dto/CreateSkillDTO';
import { ValidationDomainService } from '../../../shared/domain/services/ValidationDomainService';

// Use abstracted HTTP types instead of Express directly
interface IRequest {
  user?: any;
  params: any;
  body: any;
  query: any;
}

interface IResponse {
  status: (code: number) => IResponse;
  json: (data: any) => void;
}

export class SkillApplicationService {
  private createSkillUseCase: CreateSkillUseCase;
  private getSkillsUseCase: GetSkillsUseCase;
  private updateSkillUseCase: UpdateSkillUseCase;

  constructor(
    private readonly skillRepository: ISkillRepository
  ) {
    this.createSkillUseCase = new CreateSkillUseCase(skillRepository);
    this.getSkillsUseCase = new GetSkillsUseCase(skillRepository);
    this.updateSkillUseCase = new UpdateSkillUseCase(skillRepository);
  }

  async createSkill(tenantId: string, data: CreateSkillDTO): Promise<SkillResponseDTO> {
    ValidationDomainService.validateRequired(data.name, 'Skill name');
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');
    const skill = await this.createSkillUseCase.execute({ ...data, tenantId });
    return this.mapToResponseDTO(skill);
  }

  async getSkills(tenantId: string): Promise<SkillResponseDTO[]> {
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');
    const skills = await this.getSkillsUseCase.execute(tenantId);
    return skills.map(skill => this.mapToResponseDTO(skill));
  }

  async getSkillById(id: string, tenantId: string): Promise<SkillResponseDTO | null> {
    ValidationDomainService.validateRequired(id, 'Skill ID');
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');
    const skill = await this.skillRepository.findByIdAndTenantId(id, tenantId);
    return skill ? this.mapToResponseDTO(skill) : null;
  }

  async updateSkill(id: string, tenantId: string, updates: UpdateSkillDTO): Promise<SkillResponseDTO> {
    ValidationDomainService.validateRequired(id, 'Skill ID');
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');
    const skill = await this.updateSkillUseCase.execute(id, tenantId, updates);
    return this.mapToResponseDTO(skill);
  }

  async deleteSkill(id: string, tenantId: string): Promise<void> {
    ValidationDomainService.validateRequired(id, 'Skill ID');
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');
    await this.skillRepository.delete(id, tenantId);
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
import { CreateSkillUseCase } from '../use-cases/CreateSkillUseCase';
import { ISkillRepository } from '../../domain/ports/ISkillRepository';

export class SkillApplicationService {
  constructor(
    private readonly createSkillUseCase: CreateSkillUseCase
  ) {}

  async createSkill(skillData: any, tenantId: string) {
    return await this.createSkillUseCase.execute(skillData, tenantId);
  }
}
