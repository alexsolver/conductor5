
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { GetTeamMembersUseCase } from '../use-cases/GetTeamMembersUseCase';

export class TeamsController {
  
  // Get team overview data
  async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Mock data for now - should be replaced with actual use cases
      const overview = {
        departments: [
          { id: 1, name: 'TI', description: 'Tecnologia da Informação', count: 5, percentage: 50 },
          { id: 2, name: 'Comercial', description: 'Vendas e Marketing', count: 3, percentage: 30 },
          { id: 3, name: 'Administrativo', description: 'Recursos Humanos', count: 2, percentage: 20 }
        ],
        recentActivities: [
          { 
            id: 1, 
            description: 'Usuário adicionado ao sistema', 
            user: 'Admin', 
            timestamp: new Date().toISOString() 
          }
        ],
        totalMembers: 10,
        totalDepartments: 3
      };

      res.json(overview);
    } catch (error) {
      console.error('Error fetching team overview:', error);
      res.status(500).json({ message: 'Failed to fetch overview' });
    }
  }

  // Get team members
  async getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      console.log('[TEAMS-CONTROLLER] Fetching members for tenant:', user.tenantId);

      const getTeamMembersUseCase = new GetTeamMembersUseCase();
      const result = await getTeamMembersUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: 'Failed to fetch members' });
    }
  }

  // Get team stats
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const stats = {
        totalMembers: "4",
        activeToday: "2", 
        pendingApprovals: "0",
        averagePerformance: 85
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching team stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  }

  // Get performance data
  async getPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const performance = {
        individuals: [
          {
            id: user.id,
            name: 'Admin User',
            performance: 90,
            goals: 5,
            completedGoals: 4,
            role: 'Administrator',
            department: 'TI'
          }
        ],
        goals: [
          {
            name: 'Metas Individuais',
            completed: 4,
            total: 5,
            percentage: 80
          },
          {
            name: 'Performance Geral',
            completed: 85,
            total: 100,
            percentage: 85
          }
        ]
      };

      res.json(performance);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      res.status(500).json({ message: 'Failed to fetch performance data' });
    }
  }

  // Get skills matrix
  async getSkillsMatrix(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const skillsMatrix = {
        topSkills: [
          { name: 'JavaScript', count: 3, level: 'Avançado' },
          { name: 'React', count: 2, level: 'Intermediário' },
          { name: 'Node.js', count: 2, level: 'Avançado' }
        ],
        skillCategories: [
          { category: 'Desenvolvimento', count: 5 },
          { category: 'Design', count: 2 },
          { category: 'Gestão', count: 1 }
        ]
      };

      res.json(skillsMatrix);
    } catch (error) {
      console.error('Error fetching skills matrix:', error);
      res.status(500).json({ message: 'Failed to fetch skills matrix' });
    }
  }

  // Get departments
  async getDepartments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const departments = [
        { id: 1, name: 'TI', description: 'Tecnologia da Informação', managerId: null, isActive: true, createdAt: new Date().toISOString() },
        { id: 2, name: 'Comercial', description: 'Vendas e Marketing', managerId: null, isActive: true, createdAt: new Date().toISOString() },
        { id: 3, name: 'Administrativo', description: 'Recursos Humanos', managerId: null, isActive: true, createdAt: new Date().toISOString() }
      ];

      res.json({ departments });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: 'Failed to fetch departments' });
    }
  }

  // Get roles
  async getRoles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const roles = [
        { id: 'tenant_admin', name: 'Administrador do Tenant', type: 'role' },
        { id: 'saas_admin', name: 'Administrador SaaS', type: 'role' },
        { id: 'manager', name: 'Gerente', type: 'role' },
        { id: 'agent', name: 'Agente', type: 'role' },
        { id: 'customer', name: 'Cliente', type: 'role' }
      ];

      res.json({ roles });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  }

  // Update member status
  async updateMemberStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { id } = req.params;
      const { status } = req.body;

      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Validate permissions
      if (!['tenant_admin', 'saas_admin', 'manager'].includes(user.role)) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }

      console.log(`Updating member ${id} status to ${status}`);

      res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating member status:', error);
      res.status(500).json({ message: 'Failed to update status' });
    }
  }

  // Update member data
  async updateMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { id } = req.params;
      const updateData = req.body;

      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      console.log('Updating member:', id, 'with data:', updateData);

      res.json({ 
        success: true, 
        message: 'Member updated successfully',
        data: updateData
      });
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ 
        message: 'Failed to update member',
        error: error.message 
      });
    }
  }

  // Sync team data
  async syncTeamData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      console.log('Syncing team data for tenant:', user.tenantId);

      const syncStats = {
        totalUsers: 4,
        activeUsers: 2,
        userGroups: 3
      };

      res.json({ 
        success: true, 
        message: 'Team data synchronized',
        stats: syncStats
      });
    } catch (error) {
      console.error('Error syncing team data:', error);
      res.status(500).json({ message: 'Failed to sync team data' });
    }
  }
}
