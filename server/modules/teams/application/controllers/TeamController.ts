/**
 * Team Controller - Phase 10 Implementation
 * 
 * Controlador para operações de equipes
 * Camada de aplicação seguindo Clean Architecture
 * 
 * @module TeamController
 * @version 1.0.0
 * @created 2025-08-12 - Phase 10 Clean Architecture Implementation
 */

import type { Request, Response } from 'express';
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository';
import { Team, TeamEntity } from '../../domain/entities/Team';
// AuthenticatedRequest type definition
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}
import { z } from 'zod';

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1, 'Nome da equipe é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
  description: z.string().optional(),
  teamType: z.enum(['support', 'technical', 'sales', 'management', 'external']).default('support'),
  managerId: z.string().uuid('ID do gerente inválido').optional(),
  departmentId: z.string().uuid('ID do departamento inválido').optional(),
  location: z.string().optional(),
  maxMembers: z.number().min(1, 'Máximo de membros deve ser positivo').optional(),
  workingHours: z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)'),
    timezone: z.string().min(1, 'Timezone é obrigatório'),
    workDays: z.array(z.number().min(0, 'Dia inválido').max(6, 'Dia inválido')).min(1, 'Pelo menos um dia de trabalho é obrigatório')
  }).optional(),
  contactInfo: z.object({
    email: z.string().email('Email inválido').optional(),
    phone: z.string().optional(),
    slackChannel: z.string().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

const updateTeamSchema = createTeamSchema.partial();

export class TeamController {
  constructor(private teamRepository: ITeamRepository) {}

  /**
   * Create team
   * POST /api/teams-integration/working/teams
   */
  async createTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      // Validate input
      const teamData = createTeamSchema.parse(req.body);

      // Check if team name already exists
      const nameExists = await this.teamRepository.existsByName(teamData.name, tenantId);
      if (nameExists) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Uma equipe com este nome já existe'
        });
        return;
      }

      // Create team entity
      const teamEntity = TeamEntity.create({
        tenantId,
        ...teamData,
        createdBy: req.user?.id
      });

      // Convert to Team interface
      const team: Team = {
        id: teamEntity.id,
        tenantId: teamEntity.tenantId,
        name: teamEntity.name,
        description: teamEntity.description || undefined,
        teamType: teamEntity.teamType,
        status: teamEntity.status,
        managerId: teamEntity.managerId || undefined,
        departmentId: teamEntity.departmentId || undefined,
        location: teamEntity.location || undefined,
        maxMembers: teamEntity.maxMembers || undefined,
        workingHours: teamEntity.workingHours || undefined,
        contactInfo: teamEntity.contactInfo || undefined,
        metadata: teamEntity.metadata || undefined,
        isActive: teamEntity.isActive,
        createdAt: teamEntity.createdAt,
        updatedAt: teamEntity.updatedAt,
        createdBy: teamEntity.createdBy || undefined,
        updatedBy: teamEntity.updatedBy || undefined
      };

      // Save to repository
      const createdTeam = await this.teamRepository.create(team);

      res.status(201).json({
        success: true,
        data: createdTeam,
        message: 'Equipe criada com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[TEAM-CONTROLLER] Error creating team:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao criar equipe'
      });
    }
  }

  /**
   * Get teams
   * GET /api/teams-integration/working/teams
   */
  async getTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { teamType, status, managerId, departmentId, location, search, isActive } = req.query;

      const filters = {
        tenantId,
        ...(teamType && { teamType: teamType as string }),
        ...(status && { status: status as string }),
        ...(managerId && { managerId: managerId as string }),
        ...(departmentId && { departmentId: departmentId as string }),
        ...(location && { location: location as string }),
        ...(search && { search: search as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      };

      const teams = await this.teamRepository.findAll(filters);

      res.json({
        success: true,
        data: teams,
        pagination: {
          page: 1,
          limit: 100,
          total: teams.length,
          totalPages: 1
        },
        message: 'Equipes recuperadas com sucesso'
      });

    } catch (error) {
      console.error('[TEAM-CONTROLLER] Error fetching teams:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar equipes'
      });
    }
  }

  /**
   * Get team by ID
   * GET /api/teams-integration/working/teams/:id
   */
  async getTeamById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const team = await this.teamRepository.findById(id, tenantId);
      if (!team) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Equipe não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: team,
        message: 'Equipe encontrada com sucesso'
      });

    } catch (error) {
      console.error('[TEAM-CONTROLLER] Error fetching team:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar equipe'
      });
    }
  }

  /**
   * Update team
   * PUT /api/teams-integration/working/teams/:id
   */
  async updateTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      // Validate input
      const updateData = updateTeamSchema.parse(req.body);

      // Check if team exists
      const existingTeam = await this.teamRepository.findById(id, tenantId);
      if (!existingTeam) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Equipe não encontrada'
        });
        return;
      }

      // Check if new name conflicts (if name is being updated)
      if (updateData.name && updateData.name !== existingTeam.name) {
        const nameExists = await this.teamRepository.existsByName(updateData.name, tenantId, id);
        if (nameExists) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: 'Uma equipe com este nome já existe'
          });
          return;
        }
      }

      // Update team
      const updatedTeam = await this.teamRepository.update(id, tenantId, {
        ...updateData,
        updatedBy: req.user?.id,
        updatedAt: new Date()
      });

      if (!updatedTeam) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Equipe não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedTeam,
        message: 'Equipe atualizada com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[TEAM-CONTROLLER] Error updating team:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao atualizar equipe'
      });
    }
  }

  /**
   * Delete team
   * DELETE /api/teams-integration/working/teams/:id
   */
  async deleteTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const deleted = await this.teamRepository.delete(id, tenantId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Equipe não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Equipe desativada com sucesso'
      });

    } catch (error) {
      console.error('[TEAM-CONTROLLER] Error deleting team:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao desativar equipe'
      });
    }
  }

  /**
   * Get team statistics
   * GET /api/teams-integration/working/teams/statistics
   */
  async getTeamStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const statistics = await this.teamRepository.getStatistics(tenantId);

      res.json({
        success: true,
        data: statistics,
        message: 'Estatísticas recuperadas com sucesso'
      });

    } catch (error) {
      console.error('[TEAM-CONTROLLER] Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Get team types
   * GET /api/teams-integration/working/teams/types
   */
  async getTeamTypes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamTypes = [
        { value: 'support', label: 'Suporte', description: 'Equipe de atendimento ao cliente' },
        { value: 'technical', label: 'Técnica', description: 'Equipe técnica especializada' },
        { value: 'sales', label: 'Vendas', description: 'Equipe comercial' },
        { value: 'management', label: 'Gestão', description: 'Equipe de gerenciamento' },
        { value: 'external', label: 'Externa', description: 'Equipe externa ou terceirizada' }
      ];

      res.json({
        success: true,
        data: teamTypes,
        message: 'Tipos de equipe recuperados com sucesso'
      });

    } catch (error) {
      console.error('[TEAM-CONTROLLER] Error fetching team types:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar tipos de equipe'
      });
    }
  }
}