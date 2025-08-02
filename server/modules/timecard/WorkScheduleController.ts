
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/jwtAuth';
import { WorkScheduleRepository } from './WorkScheduleRepository';

export class WorkScheduleController {
  private repository: WorkScheduleRepository;

  constructor() {
    this.repository = new WorkScheduleRepository();
  }

  async getAllWorkSchedules(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      console.log('[CONTROLLER-QA] Getting work schedules for tenant:', tenantId);
      
      const schedules = await this.repository.getAllWorkSchedules(tenantId);
      
      console.log('[CONTROLLER-QA] Returning schedules count:', schedules.length);
      
      res.json({
        success: true,
        schedules: schedules
      });
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error fetching work schedules:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  }

  async createWorkSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      const scheduleData = {
        ...req.body,
        tenantId,
        createdBy: req.user?.id
      };

      const schedule = await this.repository.createWorkSchedule(scheduleData);
      
      res.status(201).json({
        success: true,
        schedule: schedule
      });
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error creating work schedule:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao criar escala',
        details: error.message 
      });
    }
  }

  async updateWorkSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user?.id
      };

      const schedule = await this.repository.updateWorkSchedule(id, tenantId, updateData);
      
      if (!schedule) {
        return res.status(404).json({ 
          success: false, 
          error: 'Escala não encontrada' 
        });
      }

      res.json({
        success: true,
        schedule: schedule
      });
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error updating work schedule:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao atualizar escala',
        details: error.message 
      });
    }
  }

  async deleteWorkSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      await this.repository.deleteWorkSchedule(id, tenantId);
      
      res.status(204).send();
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error deleting work schedule:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao excluir escala',
        details: error.message 
      });
    }
  }

  async getScheduleTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID é obrigatório' 
        });
      }

      const templates = await this.repository.getScheduleTemplates(tenantId);
      
      res.json({
        success: true,
        templates: templates
      });
    } catch (error: any) {
      console.error('[CONTROLLER-QA] Error fetching schedule templates:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar templates',
        details: error.message 
      });
    }
  }
}
