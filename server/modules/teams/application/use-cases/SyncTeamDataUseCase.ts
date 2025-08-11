
import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface SyncTeamDataRequest {
  tenantId: string;
  userId: string;
}

export interface SyncTeamDataResponse {
  success: boolean;
  message: string;
  stats?: any;
}

export class SyncTeamDataUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: SyncTeamDataRequest): Promise<SyncTeamDataResponse> {
    try {
      console.log('[SYNC-TEAM-DATA] Processing request for tenant:', request.tenantId);

      const result = await this.teamRepository.syncTeamData(request.tenantId);

      if (result.success) {
        return {
          success: true,
          message: 'Team data synchronized',
          stats: result.stats
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to sync team data'
        };
      }
    } catch (error) {
      console.error('Error in SyncTeamDataUseCase:', error);
      return {
        success: false,
        message: 'Failed to sync team data'
      };
    }
  }
}
