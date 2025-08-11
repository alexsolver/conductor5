
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
  
  async execute(request: GetTeamMembersRequest): Promise<GetTeamMembersResponse> {
    try {
      console.log('[GET-TEAM-MEMBERS] Processing request for tenant:', request.tenantId);

      // TODO: Replace with actual repository call
      const members = [
        {
          id: request.userId,
          firstName: 'Admin',
          lastName: 'User',
          name: 'Admin User', 
          email: 'admin@system.com',
          role: 'tenant_admin',
          isActive: true,
          status: 'active',
          position: 'System Administrator',
          department: 'TI',
          departmentName: 'TI',
          phone: '(11) 99999-9999',
          cellPhone: '(11) 99999-9999',
          performance: 95,
          goals: 5,
          completedGoals: 5,
          lastActive: new Date().toISOString(),
          groupIds: ['bce2c5d4-1234-4321-9876-543210fedcba'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'sample-user-2',
          firstName: 'Maria',
          lastName: 'Silva',
          name: 'Maria Silva',
          email: 'maria.silva@company.com',
          role: 'agent',
          isActive: true,
          status: 'active',
          position: 'Desenvolvedora Frontend',
          department: 'TI',
          departmentName: 'TI',
          phone: '(11) 88888-8888',
          cellPhone: '(11) 88888-8888',
          performance: 88,
          goals: 4,
          completedGoals: 3,
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          groupIds: ['bce2c5d4-1234-4321-9876-543210fedcba'],
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'sample-user-3',
          firstName: 'João',
          lastName: 'Santos',
          name: 'João Santos',
          email: 'joao.santos@company.com',
          role: 'manager',
          isActive: true,
          status: 'active',
          position: 'Gerente de Vendas',
          department: 'Comercial',
          departmentName: 'Comercial',
          phone: '(11) 77777-7777',
          cellPhone: '(11) 77777-7777',
          performance: 92,
          goals: 6,
          completedGoals: 5,
          lastActive: new Date(Date.now() - 1800000).toISOString(),
          groupIds: ['abc123e4-5678-9012-3456-789012345678'],
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'sample-user-4',
          firstName: 'Ana',
          lastName: 'Costa',
          name: 'Ana Costa',
          email: 'ana.costa@company.com',
          role: 'agent',
          isActive: false,
          status: 'inactive',
          position: 'Analista de RH',
          department: 'Administrativo',
          departmentName: 'Administrativo',
          phone: '(11) 66666-6666',
          cellPhone: '(11) 66666-6666',
          performance: 75,
          goals: 3,
          completedGoals: 2,
          lastActive: new Date(Date.now() - 259200000).toISOString(),
          groupIds: ['def456f7-8901-2345-6789-012345678901'],
          createdAt: new Date(Date.now() - 259200000).toISOString()
        }
      ];

      return { members };
    } catch (error) {
      console.error('Error in GetTeamMembersUseCase:', error);
      throw new Error('Failed to get team members');
    }
  }
}
