import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface GetDepartmentsRequest {
  tenantId: string;
  userId: string;
}

export interface GetDepartmentsResponse {
  departments: Array<{
    id: string;
    name: string;
    description?: string;
    count: number;
    percentage: number;
  }>;
}

export class GetDepartmentsUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: GetDepartmentsRequest): Promise<GetDepartmentsResponse> {
    try {
      console.log('[GET-DEPARTMENTS] Processing request for tenant:', request.tenantId);

      const departments = await this.teamRepository.findDepartmentsByTenant(request.tenantId);

      return { departments };
    } catch (error) {
      console.error('Error in GetDepartmentsUseCase:', error);
      throw new Error('Failed to get departments');
    }
  }
}