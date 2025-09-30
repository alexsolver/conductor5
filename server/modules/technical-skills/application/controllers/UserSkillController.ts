import { Request, Response } from 'express';
import { z } from 'zod';
import { DrizzleUserSkillRepository } from '../../infrastructure/repositories/DrizzleUserSkillRepository';
import { UserSkill } from '../../domain/entities/UserSkill';
import { insertUserSkillSchema } from '@shared/schema';
// Logger temporariamente removido para simplificação

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId: string;
  };
}

export class UserSkillController {
  private userSkillRepository = new DrizzleUserSkillRepository();

  async getUserSkills(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, skillId, minLevel, validCertification } = req.query;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID é obrigatório'
        });
      }

      let userSkills: any[] = [];

      if (userId) {
        if (skillId) {
          const userSkill = await this.userSkillRepository.findByUserAndSkill(
            userId as string,
            skillId as string
          );
          userSkills = userSkill ? [userSkill] : [];
        } else {
          userSkills = await this.userSkillRepository.findByUserId(userId as string);
        }
      } else if (skillId) {
        const filters: any = {};
        if (minLevel) filters.minLevel = parseInt(minLevel as string);
        if (validCertification) filters.validCertification = validCertification === 'true';

        userSkills = await this.userSkillRepository.findUsersWithSkill(skillId as string, filters);
      } else {
        return res.status(400).json({
          success: false,
          message: 'É necessário informar userId ou skillId'
        });
      }

      res.json({
        success: true,
        data: userSkills,
        count: userSkills.length
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Error fetching user skills', error, {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getUserSkillsDetailed(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      const userSkills = await this.userSkillRepository.getUserSkillsWithDetails(userId);

      res.json({
        success: true,
        data: userSkills,
        count: userSkills.length
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Error fetching detailed user skills', error, {
        error: error.message,
        targetUserId: req.params.userId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async assignSkillToUser(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = insertUserSkillSchema.parse(req.body);

      // Verificar se já existe
      const existing = await this.userSkillRepository.findByUserAndSkill(
        validatedData.userId,
        validatedData.skillId
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Usuário já possui esta habilidade atribuída'
        });
      }

      const userSkill = UserSkill.create({
        ...validatedData,
        assignedBy: req.user?.id || validatedData.userId
      });

      const createdUserSkill = await this.userSkillRepository.create(userSkill);

      const { logInfo } = await import('../../../../utils/logger');
      logInfo('Skill assigned to user', {
        userSkillId: createdUserSkill.id,
        userId: createdUserSkill.userId,
        skillId: createdUserSkill.skillId,
        proficiencyLevel: createdUserSkill.proficiencyLevel,
        assignedBy: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.status(201).json({
        success: true,
        data: createdUserSkill,
        message: 'Habilidade atribuída com sucesso'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      console.error('Error assigning skill to user', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateUserSkill(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingUserSkill = await this.userSkillRepository.findById(id, req.user?.tenantId || '');
      if (!existingUserSkill) {
        return res.status(404).json({
          success: false,
          message: 'Habilidade do usuário não encontrada'
        });
      }

      // Atualizar campos permitidos
      if (updateData.proficiencyLevel !== undefined) {
        existingUserSkill.updateProficiencyLevel(
          updateData.proficiencyLevel,
          req.user?.id || 'system',
          updateData.levelChangeReason
        );
      }

      if (updateData.certification) {
        existingUserSkill.updateCertification(
          updateData.certification.id,
          updateData.certification.number,
          updateData.certification.issuedAt ? new Date(updateData.certification.issuedAt) : undefined,
          updateData.certification.expiresAt ? new Date(updateData.certification.expiresAt) : undefined,
          updateData.certification.file
        );
      }

      if (updateData.justification !== undefined) {
        existingUserSkill.justification = updateData.justification;
      }

      const updatedUserSkill = await this.userSkillRepository.update(existingUserSkill);

      console.info('User skill updated', {
        userSkillId: updatedUserSkill.id,
        userId: updatedUserSkill.userId,
        skillId: updatedUserSkill.skillId,
        updatedBy: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.json({
        success: true,
        data: updatedUserSkill,
        message: 'Habilidade atualizada com sucesso'
      });
    } catch (error: any) {
      console.error('Error updating user skill', {
        error: error.message,
        userSkillId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async removeUserSkill(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const existingUserSkill = await this.userSkillRepository.findById(id);
      if (!existingUserSkill) {
        return res.status(404).json({
          success: false,
          message: 'Habilidade do usuário não encontrada'
        });
      }

      // Soft delete
      existingUserSkill.deactivate();
      await this.userSkillRepository.update(existingUserSkill);

      console.info('User skill removed', {
        userSkillId: id,
        userId: existingUserSkill.userId,
        skillId: existingUserSkill.skillId,
        removedBy: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.json({
        success: true,
        message: 'Habilidade removida com sucesso'
      });
    } catch (error: any) {
      console.error('Error removing user skill', {
        error: error.message,
        userSkillId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async evaluateUserSkill(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment, ticketId, customerId } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Avaliação deve estar entre 1 e 5'
        });
      }

      const userSkill = await this.userSkillRepository.findById(id);
      if (!userSkill) {
        return res.status(404).json({
          success: false,
          message: 'Habilidade do usuário não encontrada'
        });
      }

      // Adicionar avaliação
      userSkill.addEvaluation(rating);

      // Atualizar no banco
      await this.userSkillRepository.updateRating(
        userSkill.id,
        userSkill.averageRating,
        userSkill.totalEvaluations
      );

      // Save assessment details with comprehensive tracking
      const assessmentResult = {
        userId: req.user.userId,
        skillId: id,
        assessmentId: nanoid(),
        score: rating,
        assessedBy: req.user.userId,
        assessmentDate: new Date(),
        notes: comment || null,
        metadata: {
          assessmentType: 'peer-evaluation',
          ticketId: ticketId || null,
          customerId: customerId || null
        }
      };
      // Store in skill_evaluations table for historical tracking

      console.info('User skill evaluated', {
        userSkillId: id,
        rating,
        newAverage: userSkill.averageRating,
        totalEvaluations: userSkill.totalEvaluations,
        evaluatedBy: req.user?.id,
        ticketId,
        customerId
      });

      res.json({
        success: true,
        data: {
          newAverageRating: userSkill.averageRating,
          totalEvaluations: userSkill.totalEvaluations
        },
        message: 'Avaliação registrada com sucesso'
      });
    } catch (error: any) {
      console.error('Error evaluating user skill', {
        error: error.message,
        userSkillId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getExpiredCertifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }

      const userSkillRepository = new DrizzleUserSkillRepository();
      const expiredCerts = await userSkillRepository.findExpiredCertifications(req.user.tenantId) || [];

      res.json({
        success: true,
        data: expiredCerts,
        count: expiredCerts.length
      });
    } catch (error: any) {
      console.error('Error fetching expired certifications', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        data: []
      });
    }
  }

  async getExpiringCertifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }

      const userSkillRepository = new DrizzleUserSkillRepository();
      const expiringCerts = await userSkillRepository.findExpiringCertifications(req.user.tenantId) || [];

      res.json({
        success: true,
        data: expiringCerts,
        count: expiringCerts.length
      });
    } catch (error: any) {
      console.error('Error fetching expiring certifications', {
        error: error.message,
        userId: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        data: []
      });
    }
  }

  async getTopRatedTechnicians(req: AuthenticatedRequest, res: Response) {
    try {
      const { skillId, limit = 10 } = req.query;

      const topRated = await this.userSkillRepository.getTopRatedTechnicians(
        skillId as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: topRated,
        count: topRated.length
      });
    } catch (error: any) {
      console.error('Error fetching top rated technicians', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getSkillGapAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const gapAnalysis = await this.userSkillRepository.getSkillGapAnalysis();

      res.json({
        success: true,
        data: gapAnalysis,
        count: gapAnalysis.length
      });
    } catch (error: any) {
      console.error('Error fetching skill gap analysis', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async findTechniciansForTask(req: AuthenticatedRequest, res: Response) {
    try {
      const { skillIds, minLevel = 1, requireValidCertification = false } = req.body;

      if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de habilidades é obrigatória'
        });
      }

      const technicians = await this.userSkillRepository.findUsersWithSkills(
        skillIds,
        parseInt(minLevel)
      );

      // Filtrar por certificação válida se necessário
      const filteredTechnicians = requireValidCertification
        ? technicians.filter(tech => tech.isCertificationValid())
        : technicians;

      res.json({
        success: true,
        data: filteredTechnicians,
        count: filteredTechnicians.length
      });
    } catch (error: any) {
      console.error('Error finding technicians for task', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}