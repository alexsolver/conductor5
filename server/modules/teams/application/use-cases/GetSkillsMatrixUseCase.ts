
import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface GetSkillsMatrixRequest {
  tenantId: string;
  userId: string;
}

export interface GetSkillsMatrixResponse {
  topSkills: Array<{
    name: string;
    count: number;
    level: string;
  }>;
  skillCategories: Array<{
    category: string;
    count: number;
  }>;
}

export class GetSkillsMatrixUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: GetSkillsMatrixRequest): Promise<GetSkillsMatrixResponse> {
    try {
      console.log('[GET-SKILLS-MATRIX] Processing request for tenant:', request.tenantId);

      const skillsMatrix = await this.teamRepository.getSkillsMatrix(request.tenantId);

      return skillsMatrix;
    } catch (error) {
      console.error('Error in GetSkillsMatrixUseCase:', error);
      throw new Error('Failed to get skills matrix');
    }
  }
}
