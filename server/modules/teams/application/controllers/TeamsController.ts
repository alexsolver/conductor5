
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { GetTeamMembersUseCase } from '../use-cases/GetTeamMembersUseCase';
import { GetTeamOverviewUseCase } from '../use-cases/GetTeamOverviewUseCase';
import { GetTeamStatsUseCase } from '../use-cases/GetTeamStatsUseCase';
import { GetTeamPerformanceUseCase } from '../use-cases/GetTeamPerformanceUseCase';
import { GetSkillsMatrixUseCase } from '../use-cases/GetSkillsMatrixUseCase';
import { GetDepartmentsUseCase } from '../use-cases/GetDepartmentsUseCase';
import { GetRolesUseCase } from '../use-cases/GetRolesUseCase';
import { UpdateMemberStatusUseCase } from '../use-cases/UpdateMemberStatusUseCase';
import { UpdateMemberUseCase } from '../use-cases/UpdateMemberUseCase';
import { SyncTeamDataUseCase } from '../use-cases/SyncTeamDataUseCase';

export class TeamsController {
  private getTeamOverviewUseCase: GetTeamOverviewUseCase;
  private getTeamStatsUseCase: GetTeamStatsUseCase;
  private getTeamPerformanceUseCase: GetTeamPerformanceUseCase;
  private getSkillsMatrixUseCase: GetSkillsMatrixUseCase;
  private getDepartmentsUseCase: GetDepartmentsUseCase;
  private getRolesUseCase: GetRolesUseCase;
  private updateMemberStatusUseCase: UpdateMemberStatusUseCase;
  private updateMemberUseCase: UpdateMemberUseCase;
  private syncTeamDataUseCase: SyncTeamDataUseCase;

  constructor() {
    this.getTeamOverviewUseCase = new GetTeamOverviewUseCase();
    this.getTeamStatsUseCase = new GetTeamStatsUseCase();
    this.getTeamPerformanceUseCase = new GetTeamPerformanceUseCase();
    this.getSkillsMatrixUseCase = new GetSkillsMatrixUseCase();
    this.getDepartmentsUseCase = new GetDepartmentsUseCase();
    this.getRolesUseCase = new GetRolesUseCase();
    this.updateMemberStatusUseCase = new UpdateMemberStatusUseCase();
    this.updateMemberUseCase = new UpdateMemberUseCase();
    this.syncTeamDataUseCase = new SyncTeamDataUseCase();
  }
  
  // Get team overview data
  async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      console.log('[TEAMS-CONTROLLER] Fetching overview for tenant:', user.tenantId);

      const overview = await this.getTeamOverviewUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

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

      console.log('[TEAMS-CONTROLLER] Fetching stats for tenant:', user.tenantId);

      const stats = await this.getTeamStatsUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

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

      console.log('[TEAMS-CONTROLLER] Fetching performance for tenant:', user.tenantId);

      const performance = await this.getTeamPerformanceUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

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

      console.log('[TEAMS-CONTROLLER] Fetching skills matrix for tenant:', user.tenantId);

      const skillsMatrix = await this.getSkillsMatrixUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

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

      console.log('[TEAMS-CONTROLLER] Fetching departments for tenant:', user.tenantId);

      const result = await this.getDepartmentsUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

      res.json(result);
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

      console.log('[TEAMS-CONTROLLER] Fetching roles for tenant:', user.tenantId);

      const result = await this.getRolesUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

      res.json(result);
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

      console.log('[TEAMS-CONTROLLER] Updating member status:', { memberId: id, status });

      const result = await this.updateMemberStatusUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id,
        memberId: id,
        status,
        updatedBy: user.id
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
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

      console.log('[TEAMS-CONTROLLER] Updating member:', { memberId: id, updateData });

      const result = await this.updateMemberUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id,
        memberId: id,
        updateData,
        updatedBy: user.id
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
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

      console.log('[TEAMS-CONTROLLER] Syncing team data for tenant:', user.tenantId);

      const result = await this.syncTeamDataUseCase.execute({
        tenantId: user.tenantId,
        userId: user.id
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error syncing team data:', error);
      res.status(500).json({ message: 'Failed to sync team data' });
    }
  }
}
