import { Request, Response } from 'express';
import { z } from 'zod';
import { DrizzleSkillRepository } from '../../infrastructure/repositories/DrizzleSkillRepository';
import { Skill } from '../../domain/entities/Skill';
import { insertSkillSchema } from '../../../../../shared/schema-master.js';
import winston from 'winston';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId: string;
  };
}

export class SkillController {
  private skillRepository: any;

  constructor() {
    this.skillRepository = new DrizzleSkillRepository();
  }

  async getSkills(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }

      const skillRepository = new DrizzleSkillRepository(req.user.tenantId);
      const { category, search, isActive } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (search) filters.search = search as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const skills = await skillRepository.findAll(filters);

      res.json({
        success: true,
        data: skills,
        count: skills.length
      });
    } catch (error: any) {
      console.error('Error fetching skills', {
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

  async getSkillById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }

      const skillRepository = new DrizzleSkillRepository(req.user.tenantId);
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da habilidade é obrigatório'
        });
      }

      const skill = await skillRepository.findById(id);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Habilidade não encontrada'
        });
      }

      res.json({
        success: true,
        data: skill
      });
    } catch (error: any) {
      console.error('Error fetching skill by ID', {
        error: error.message,
        skillId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async createSkill(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }

      const skillRepository = new DrizzleSkillRepository(req.user.tenantId);
      
      // Validar dados básicos sem usar schema Zod temporariamente
      const { name, category, minLevelRequired, description, observations, certificationSuggested, validityMonths } = req.body;
      
      if (!name || !category) {
        return res.status(400).json({
          success: false,
          message: 'Nome e categoria são obrigatórios'
        });
      }

      const skill = Skill.create({
        name,
        category,
        minLevelRequired: minLevelRequired || 1,
        description: description || null,
        observations: observations || null,
        certificationSuggested: certificationSuggested || null,
        validityMonths: validityMonths || null,
        createdBy: req.user?.id,
        tenantId: req.user.tenantId
      });

      const createdSkill = await skillRepository.create(skill);

      console.info('Skill created', {
        skillId: createdSkill.id,
        skillName: createdSkill.name,
        createdBy: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.status(201).json({
        success: true,
        data: createdSkill,
        message: 'Habilidade criada com sucesso'
      });
    } catch (error: any) {
      console.error('Error creating skill', {
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

  async updateSkill(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }

      const skillRepository = new DrizzleSkillRepository(req.user.tenantId);
      const { id } = req.params;
      const validatedData = insertSkillSchema.partial().parse(req.body);

      const existingSkill = await skillRepository.findById(id);
      if (!existingSkill) {
        return res.status(404).json({
          success: false,
          message: 'Habilidade não encontrada'
        });
      }

      // Atualizar campos
      if (validatedData.name) existingSkill.updateName(validatedData.name);
      if (validatedData.category) existingSkill.updateCategory(validatedData.category);
      if (validatedData.minLevelRequired) existingSkill.updateMinLevel(validatedData.minLevelRequired);
      if (validatedData.description !== undefined) existingSkill.description = validatedData.description;
      if (validatedData.observations !== undefined) existingSkill.observations = validatedData.observations;
      if (validatedData.certificationSuggested !== undefined) existingSkill.certificationSuggested = validatedData.certificationSuggested;
      if (validatedData.validityMonths !== undefined) existingSkill.validityMonths = validatedData.validityMonths;

      existingSkill.updatedBy = req.user?.id;

      const updatedSkill = await skillRepository.update(existingSkill);

      console.info('Skill updated', {
        skillId: updatedSkill.id,
        skillName: updatedSkill.name,
        updatedBy: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.json({
        success: true,
        data: updatedSkill,
        message: 'Habilidade atualizada com sucesso'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      console.error('Error updating skill', {
        error: error.message,
        skillId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async deleteSkill(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }

      const skillRepository = new DrizzleSkillRepository(req.user.tenantId);
      const { id } = req.params;

      const existingSkill = await skillRepository.findById(id);
      if (!existingSkill) {
        return res.status(404).json({
          success: false,
          message: 'Habilidade não encontrada'
        });
      }

      // Soft delete
      existingSkill.deactivate();
      existingSkill.updatedBy = req.user?.id;
      await skillRepository.update(existingSkill);

      console.info('Skill deactivated', {
        skillId: id,
        skillName: existingSkill.name,
        deactivatedBy: req.user?.id,
        tenantId: req.user?.tenantId
      });

      res.json({
        success: true,
        message: 'Habilidade desativada com sucesso'
      });
    } catch (error: any) {
      console.error('Error deleting skill', {
        error: error.message,
        skillId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          error: 'Tenant ID é obrigatório',
          data: []
        });
      }

      const skillRepository = new DrizzleSkillRepository();
      const categories = await skillRepository.getCategories();

      // Ensure we always return an array
      const validCategories = Array.isArray(categories) ? categories : [];

      res.json({ 
        success: true, 
        data: validCategories,
        count: validCategories.length
      });
    } catch (error) {
      console.error('Erro ao buscar categorias:', {
        error: error instanceof Error ? error.message : error,
        tenantId: req.user?.tenantId,
        userId: req.user?.id
      });
      res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        data: []
      });
    }
  }

  async getStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const [categoryStats, mostDemanded] = await Promise.all([
        this.skillRepository.countByCategory(),
        this.skillRepository.getMostDemandedSkills(10)
      ]);

      res.json({
        success: true,
        data: {
          categoryStats,
          mostDemanded
        }
      });
    } catch (error: any) {
      console.error('Error fetching skill statistics', {
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