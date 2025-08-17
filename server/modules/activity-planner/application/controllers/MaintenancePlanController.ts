/**
 * MaintenancePlanController - Controller para operações de planos de manutenção
 * Coordena casos de uso e apresentação de dados de planos de manutenção
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth.js';
import { MaintenancePlanApplicationService } from '../services/MaintenancePlanApplicationService';
import { insertMaintenancePlanSchema } from '@shared/schema-activity-planner';

export class MaintenancePlanController {
  constructor(
    private maintenancePlanApplicationService: MaintenancePlanApplicationService
  ) {}

  async createMaintenancePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [MaintenancePlanController] Creating maintenance plan...');
      
      const validation = insertMaintenancePlanSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [MaintenancePlanController] Validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const plan = await this.maintenancePlanApplicationService.createMaintenancePlan(
        req.user.tenantId,
        validation.data,
        req.user.id
      );

      console.log('✅ [MaintenancePlanController] Maintenance plan created:', plan.id);
      res.status(201).json({
        success: true,
        data: plan,
        message: 'Plano de manutenção criado com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error creating plan:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMaintenancePlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [MaintenancePlanController] Getting maintenance plans...');
      
      const querySchema = z.object({
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(20),
        assetId: z.string().uuid().optional(),
        triggerType: z.enum(['time', 'meter', 'condition']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        isActive: z.coerce.boolean().optional(),
        needsGeneration: z.coerce.boolean().optional(),
        sortBy: z.enum(['name', 'priority', 'nextScheduledAt', 'lastGeneratedAt', 'createdAt']).optional().default('name'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
      });

      const validation = querySchema.safeParse(req.query);
      if (!validation.success) {
        console.log('❌ [MaintenancePlanController] Query validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Parâmetros de consulta inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const { 
        page, 
        limit, 
        sortBy, 
        sortOrder, 
        ...filters 
      } = validation.data;

      const result = await this.maintenancePlanApplicationService.getMaintenancePlans(
        req.user.tenantId,
        filters,
        { page, limit, sortBy, sortOrder }
      );

      console.log(`✅ [MaintenancePlanController] Found ${result.plans.length} plans`);
      res.json({
        success: true,
        data: result.plans,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        },
        message: 'Planos de manutenção obtidos com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error getting plans:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMaintenancePlanById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [MaintenancePlanController] Getting plan by ID:', req.params.id);
      
      const plan = await this.maintenancePlanApplicationService.getMaintenancePlanById(
        req.user.tenantId,
        req.params.id
      );

      if (!plan) {
        res.status(404).json({
          success: false,
          message: 'Plano de manutenção não encontrado'
        });
        return;
      }

      console.log('✅ [MaintenancePlanController] Plan found:', plan.name);
      res.json({
        success: true,
        data: plan,
        message: 'Plano de manutenção obtido com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error getting plan:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMaintenancePlansByAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [MaintenancePlanController] Getting plans by asset:', req.params.assetId);
      
      const plans = await this.maintenancePlanApplicationService.getMaintenancePlansByAsset(
        req.user.tenantId,
        req.params.assetId
      );

      console.log(`✅ [MaintenancePlanController] Found ${plans.length} plans for asset`);
      res.json({
        success: true,
        data: plans,
        message: 'Planos de manutenção do ativo obtidos com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error getting plans by asset:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateMaintenancePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [MaintenancePlanController] Updating plan:', req.params.id);
      
      const updateSchema = insertMaintenancePlanSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.log('❌ [MaintenancePlanController] Validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const plan = await this.maintenancePlanApplicationService.updateMaintenancePlan(
        req.user.tenantId,
        req.params.id,
        validation.data,
        req.user.id
      );

      console.log('✅ [MaintenancePlanController] Plan updated:', plan.id);
      res.json({
        success: true,
        data: plan,
        message: 'Plano de manutenção atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error updating plan:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteMaintenancePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🗑️ [MaintenancePlanController] Deleting plan:', req.params.id);
      
      await this.maintenancePlanApplicationService.deleteMaintenancePlan(
        req.user.tenantId,
        req.params.id
      );

      console.log('✅ [MaintenancePlanController] Plan deleted');
      res.json({
        success: true,
        message: 'Plano de manutenção excluído com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error deleting plan:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async activateMaintenancePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [MaintenancePlanController] Activating plan:', req.params.id);
      
      await this.maintenancePlanApplicationService.activateMaintenancePlan(
        req.user.tenantId,
        req.params.id,
        req.user.id
      );

      console.log('✅ [MaintenancePlanController] Plan activated');
      res.json({
        success: true,
        message: 'Plano de manutenção ativado com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error activating plan:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deactivateMaintenancePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [MaintenancePlanController] Deactivating plan:', req.params.id);
      
      await this.maintenancePlanApplicationService.deactivateMaintenancePlan(
        req.user.tenantId,
        req.params.id,
        req.user.id
      );

      console.log('✅ [MaintenancePlanController] Plan deactivated');
      res.json({
        success: true,
        message: 'Plano de manutenção desativado com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error deactivating plan:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async generateWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [MaintenancePlanController] Generating work order from plan:', req.params.id);
      
      const bodySchema = z.object({
        scheduledDate: z.string().datetime().optional()
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [MaintenancePlanController] Body validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const scheduledDate = validation.data.scheduledDate ? new Date(validation.data.scheduledDate) : undefined;

      await this.maintenancePlanApplicationService.generateWorkOrderFromPlan(
        req.user.tenantId,
        req.params.id,
        scheduledDate,
        req.user.id
      );

      console.log('✅ [MaintenancePlanController] Work order generated');
      res.json({
        success: true,
        message: 'Ordem de serviço gerada com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error generating work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPlansNeedingGeneration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [MaintenancePlanController] Getting plans needing generation');
      
      const plans = await this.maintenancePlanApplicationService.getPlansNeedingGeneration(
        req.user.tenantId
      );

      console.log(`✅ [MaintenancePlanController] Found ${plans.length} plans needing generation`);
      res.json({
        success: true,
        data: plans,
        message: 'Planos que precisam gerar OS obtidos com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error getting plans needing generation:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMaintenancePlanStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 [MaintenancePlanController] Getting plan statistics');
      
      const stats = await this.maintenancePlanApplicationService.getMaintenancePlanStatistics(
        req.user.tenantId
      );

      console.log('✅ [MaintenancePlanController] Statistics obtained');
      res.json({
        success: true,
        data: stats,
        message: 'Estatísticas de planos de manutenção obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error getting statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async processScheduledGeneration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔄 [MaintenancePlanController] Processing scheduled generation');
      
      const result = await this.maintenancePlanApplicationService.processScheduledGeneration(
        req.user.tenantId
      );

      console.log('✅ [MaintenancePlanController] Scheduled generation processed');
      res.json({
        success: true,
        data: result,
        message: 'Geração programada processada com sucesso'
      });
    } catch (error) {
      console.error('❌ [MaintenancePlanController] Error processing scheduled generation:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}