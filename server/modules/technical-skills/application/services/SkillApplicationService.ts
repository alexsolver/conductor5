import { CreateSkillUseCase } from '../use-cases/CreateSkillUseCase';
import { GetSkillsUseCase } from '../use-cases/GetSkillsUseCase';
import { UpdateSkillUseCase } from '../use-cases/UpdateSkillUseCase';
import { CreateSkillDTO, UpdateSkillDTO, SkillResponseDTO } from '../dto/CreateSkillDTO';
import { ISkillRepository } from '../../domain/ports/ISkillRepository';
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
  constructor(
    private readonly createSkillUseCase: CreateSkillUseCase,
    private readonly getSkillsUseCase: GetSkillsUseCase,
    private readonly updateSkillUseCase: UpdateSkillUseCase,
    private readonly skillRepository: ISkillRepository // Adicionado skillRepository para uso direto
  ) {}

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

  async updateSkill(id: string, tenantId: string, data: UpdateSkillDTO): Promise<SkillResponseDTO> {
    ValidationDomainService.validateRequired(id, 'Skill ID');
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');
    const skill = await this.updateSkillUseCase.execute(id, tenantId, data);
    return this.mapToResponseDTO(skill);
  }

  // Método para obter skills diretamente do repository (se necessário em outros use cases ou serviços)
  async getAllSkillsFromRepository(tenantId: string): Promise<any[]> {
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');
    return await this.skillRepository.findByTenant(tenantId);
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
