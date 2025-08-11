
import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface GetTeamStatsRequest {
  tenantId: string;
  userId: string;
}

export interface GetTeamStatsResponse {
  totalMembers: string;
  activeToday: string;
  pendingApprovals: string;
  averagePerformance: number;
}

export class GetTeamStatsUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: GetTeamStatsRequest): Promise<GetTeamStatsResponse> {
    try {
      console.log('[GET-TEAM-STATS] Processing request for tenant:', request.tenantId);

      const stats = await this.teamRepository.getTeamStats(request.tenantId);

      return stats;
    } catch (error) {
      console.error('Error in GetTeamStatsUseCase:', error);
      throw new Error('Failed to get team stats');
    }
  }
}
