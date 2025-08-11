import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface GetTeamOverviewRequest {
  tenantId: string;
  userId: string;
}

export interface GetTeamOverviewResponse {
  departments: Array<{
    id: string;
    name: string;
    description?: string;
    count: number;
    percentage: number;
  }>;
  recentActivities: Array<{
    id: string;
    description: string;
    user: string;
    timestamp: Date;
  }>;
  totalMembers: number;
  totalDepartments: number;
}

export class GetTeamOverviewUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: GetTeamOverviewRequest): Promise<GetTeamOverviewResponse> {
    try {
      console.log('[GET-TEAM-OVERVIEW] Processing request for tenant:', request.tenantId);

      const overview = await this.teamRepository.getTeamOverview(request.tenantId);

      return overview;
    } catch (error) {
      console.error('Error in GetTeamOverviewUseCase:', error);
      throw new Error('Failed to get team overview');
    }
  }
}