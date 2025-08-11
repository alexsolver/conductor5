import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface GetTeamMembersRequest {
  tenantId: string;
  userId: string;
}

export interface GetTeamMembersResponse {
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    status: string;
    position?: string;
    department?: string;
    createdAt: string;
  }>;
}

export class GetTeamMembersUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: GetTeamMembersRequest): Promise<GetTeamMembersResponse> {
    try {
      console.log('[GET-TEAM-MEMBERS] Processing request for tenant:', request.tenantId);

      const members = await this.teamRepository.findMembersByTenant(request.tenantId);

      return { 
        members: members.map(member => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          name: member.name,
          email: member.email,
          role: member.role,
          isActive: member.isActive,
          status: member.status,
          position: member.position,
          department: member.department,
          createdAt: member.createdAt.toISOString()
        }))
      };
    } catch (error) {
      console.error('Error in GetTeamMembersUseCase:', error);
      throw new Error('Failed to get team members');
    }
  }
}