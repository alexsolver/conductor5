
import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface GetRolesRequest {
  tenantId: string;
  userId: string;
}

export interface GetRolesResponse {
  roles: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export class GetRolesUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: GetRolesRequest): Promise<GetRolesResponse> {
    try {
      console.log('[GET-ROLES] Processing request for tenant:', request.tenantId);

      const roles = await this.teamRepository.getRoles(request.tenantId);

      return { roles };
    } catch (error) {
      console.error('Error in GetRolesUseCase:', error);
      throw new Error('Failed to get roles');
    }
  }
}
