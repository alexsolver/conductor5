import type { Request, Response } from 'express';
import type { ISkillRepository } from '../../domain/repositories/ISkillRepository';
import { Skill } from '../../domain/entities/Skill';
import { DrizzleSkillRepository } from '../../infrastructure/repositories/DrizzleSkillRepository';

export class SkillController {
  private skillRepository: ISkillRepository;

  constructor() {
    this.skillRepository = new DrizzleSkillRepository();
  }

  async createSkill(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, description, suggestedCertification, certificationValidityMonths, observations, scaleOptions } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id;

      if (!name || !category) {
        res.status(400).json({
          success: false,
          message: 'Nome e categoria são obrigatórios'
        });
        return;
      }

      const skill = Skill.create({
        name,
        category,
        description,
        suggestedCertification,
        certificationValidityMonths,
        observations,
        scaleOptions: scaleOptions || [],
        tenantId,
        createdBy: userId,
      });

      const createdSkill = await this.skillRepository.create(skill);

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

  async getSkills(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { category, search, isActive } = req.query;

      const filters: any = { tenantId };

      if (category) filters.category = category as string;
      if (search) filters.search = search as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const skills = await this.skillRepository.findAll(filters);

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

  async getSkillById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const skill = await this.skillRepository.findById(id);

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

  async updateSkill(req: Request, res: Response): Promise<void> {
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

      const updatedSkill = await this.skillRepository.updateDirect(updateData);

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

  async deleteSkill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.skillRepository.delete(id);

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

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.skillRepository.getCategories();

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

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      // Buscar estatísticas básicas das habilidades
      const allSkills = await this.skillRepository.findAll({ tenantId });
      
      const totalSkills = allSkills.length;
      const activeSkills = allSkills.filter(skill => skill.isActive).length;
      const inactiveSkills = totalSkills - activeSkills;

      // Agrupar por categoria
      const categoriesCount = allSkills.reduce((acc, skill) => {
        acc[skill.category] = (acc[skill.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        data: {
          totalSkills,
          activeSkills,
          inactiveSkills,
          categoriesCount
        }
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