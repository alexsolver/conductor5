import { z } from 'zod';
import { SkillApplicationService } from '../services/SkillApplicationService';
import { ISkillRepository } from '../../domain/ports/ISkillRepository';
import crypto from 'crypto';
import { IUserSkillRepository } from '../../domain/ports/IUserSkillRepository';

export class SkillController {
  private skillService: SkillApplicationService;

  constructor(skillRepository: ISkillRepository) {
    this.skillService = new SkillApplicationService(skillRepository);
  }

  async createSkill(req: any, res: any): Promise<void> {
    try {
      const { name, category, description } = req.body;
      const user = (req as any).user;
      const tenantId = req.headers['x-tenant-id'] as string || user?.tenantId;
      const userId = user?.id;

      console.log('Creating skill with tenantId:', tenantId, 'user:', user);

      if (!name || !category) {
        res.status(400).json({
          success: false,
          message: 'Nome e categoria são obrigatórios'
        });
        return;
      }

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID é obrigatório'
        });
        return;
      }

      const skillData = {
        id: crypto.randomUUID(),
        name,
        category,
        description: description || '',
        minLevelRequired: 1,
        maxLevelRequired: 5,
        tenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdSkill = await this.skillService.createSkill(skillData);

      res.status(201).json({
        success: true,
        message: 'Habilidade criada com sucesso',
        data: createdSkill
      });
    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar habilidade',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSkills(req: any, res: any): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      console.log('Getting skills for tenant:', tenantId);

      const { category, search, isActive } = req.query;

      const filters: any = {};

      if (tenantId) {
        filters.tenantId = tenantId;
      }

      if (category) filters.category = category as string;
      if (search) filters.search = search as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const skills = await this.skillService.getSkills(filters);

      console.log('Found skills:', skills.length);

      res.json({
        success: true,
        data: skills,
        count: skills.length
      });
    } catch (error) {
      console.error('Error fetching skills:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
        tenantId: req.headers['x-tenant-id']
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao buscar habilidades',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSkillById(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const skill = await this.skillService.getSkillById(id);

      if (!skill) {
        res.status(404).json({
          success: false,
          message: 'Habilidade não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: skill
      });
    } catch (error) {
      console.error('Error fetching skill:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar habilidade',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateSkill(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const { name, category, description, suggestedCertification, certificationValidityMonths, observations, scaleOptions } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id;

      const updateData = {
        id,
        name,
        category,
        description,
        suggestedCertification,
        certificationValidityMonths,
        observations,
        scaleOptions: scaleOptions || [],
        tenantId,
        updatedBy: userId,
      };

      const updatedSkill = await this.skillService.updateSkill(id, updateData);

      res.json({
        success: true,
        message: 'Habilidade atualizada com sucesso',
        data: updatedSkill
      });
    } catch (error) {
      console.error('Error updating skill:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar habilidade',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteSkill(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;

      await this.skillService.deleteSkill(id);

      res.json({
        success: true,
        message: 'Habilidade desativada com sucesso'
      });
    } catch (error) {
      console.error('Error deleting skill:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao desativar habilidade',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCategories(req: any, res: any): Promise<void> {
    try {
      const categories = await this.skillService.getCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar categorias',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getStatistics(req: any, res: any): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      const statistics = await this.skillService.getStatistics(tenantId);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}