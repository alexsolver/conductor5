import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface GetTeamPerformanceRequest {
  tenantId: string;
  userId: string;
}

export interface GetTeamPerformanceResponse {
  individuals: Array<{
    id: string;
    name: string;
    performance?: number;
    goals?: number;
    completedGoals?: number;
    department: string;
    completionRate: number;
  }>;
  goals: Array<{
    name: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
  totalEvaluations: number;
}

export class GetTeamPerformanceUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: GetTeamPerformanceRequest): Promise<GetTeamPerformanceResponse> {
    try {
      console.log('[GET-TEAM-PERFORMANCE] Processing request for tenant:', request.tenantId);

      const performance = await this.teamRepository.getTeamPerformance(request.tenantId);

      return performance;
    } catch (error) {
      console.error('Error in GetTeamPerformanceUseCase:', error);
      throw new Error('Failed to get team performance');
    }
  }
}