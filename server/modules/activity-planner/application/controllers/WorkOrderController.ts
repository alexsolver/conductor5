/**
 * WorkOrderController - Controller para operações de ordens de serviço
 * Coordena casos de uso e apresentação de dados de ordens de serviço
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth.js';
import { WorkOrderApplicationService } from '../services/WorkOrderApplicationService';
import { insertWorkOrderSchema } from '@shared/schema-activity-planner';

export class WorkOrderController {
  constructor(
    private workOrderApplicationService: WorkOrderApplicationService
  ) {}

  async createWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Creating work order...');
      
      const validation = insertWorkOrderSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const workOrder = await this.workOrderApplicationService.createWorkOrder(
        req.user.tenantId,
        validation.data,
        req.user.id
      );

      console.log('✅ [WorkOrderController] Work order created:', workOrder.id);
      res.status(201).json({
        success: true,
        data: workOrder,
        message: 'Ordem de serviço criada com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error creating work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getWorkOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [WorkOrderController] Getting work orders...');
      
      const querySchema = z.object({
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(20),
        assetId: z.string().uuid().optional(),
        ticketId: z.string().uuid().optional(),
        maintenancePlanId: z.string().uuid().optional(),
        origin: z.enum(['pm', 'incident', 'manual', 'condition']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).optional(),
        status: z.string().optional(),
        assignedTechnicianId: z.string().uuid().optional(),
        assignedTeamId: z.string().uuid().optional(),
        locationId: z.string().uuid().optional(),
        approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
        isOverdue: z.coerce.boolean().optional(),
        isPastSchedule: z.coerce.boolean().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['priority', 'status', 'scheduledStart', 'slaTargetAt', 'createdAt', 'actualStart', 'completionPercentage']).optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
      });

      const validation = querySchema.safeParse(req.query);
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Query validation failed:', validation.error.errors);
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

      const result = await this.workOrderApplicationService.getWorkOrders(
        req.user.tenantId,
        filters,
        { page, limit, sortBy, sortOrder }
      );

      console.log(`✅ [WorkOrderController] Found ${result.workOrders.length} work orders`);
      res.json({
        success: true,
        data: result.workOrders,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        },
        message: 'Ordens de serviço obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error getting work orders:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getWorkOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [WorkOrderController] Getting work order by ID:', req.params.id);
      
      const workOrder = await this.workOrderApplicationService.getWorkOrderById(
        req.user.tenantId,
        req.params.id
      );

      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
        return;
      }

      console.log('✅ [WorkOrderController] Work order found:', workOrder.title);
      res.json({
        success: true,
        data: workOrder,
        message: 'Ordem de serviço obtida com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error getting work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getWorkOrdersByAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [WorkOrderController] Getting work orders by asset:', req.params.assetId);
      
      const workOrders = await this.workOrderApplicationService.getWorkOrdersByAsset(
        req.user.tenantId,
        req.params.assetId
      );

      console.log(`✅ [WorkOrderController] Found ${workOrders.length} work orders for asset`);
      res.json({
        success: true,
        data: workOrders,
        message: 'Ordens de serviço do ativo obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error getting work orders by asset:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Updating work order:', req.params.id);
      
      const updateSchema = insertWorkOrderSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const workOrder = await this.workOrderApplicationService.updateWorkOrder(
        req.user.tenantId,
        req.params.id,
        validation.data,
        req.user.id
      );

      console.log('✅ [WorkOrderController] Work order updated:', workOrder.id);
      res.json({
        success: true,
        data: workOrder,
        message: 'Ordem de serviço atualizada com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error updating work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateWorkOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Updating work order status:', req.params.id);
      
      const bodySchema = z.object({
        status: z.string()
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Body validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      await this.workOrderApplicationService.updateWorkOrderStatus(
        req.user.tenantId,
        req.params.id,
        validation.data.status as any,
        req.user.id
      );

      console.log('✅ [WorkOrderController] Status updated');
      res.json({
        success: true,
        message: 'Status da ordem de serviço atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error updating status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateWorkOrderProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Updating work order progress:', req.params.id);
      
      const bodySchema = z.object({
        percentage: z.number().min(0).max(100)
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Body validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      await this.workOrderApplicationService.updateWorkOrderProgress(
        req.user.tenantId,
        req.params.id,
        validation.data.percentage,
        req.user.id
      );

      console.log('✅ [WorkOrderController] Progress updated');
      res.json({
        success: true,
        message: 'Progresso da ordem de serviço atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error updating progress:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async scheduleWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Scheduling work order:', req.params.id);
      
      const bodySchema = z.object({
        scheduledStart: z.string().datetime(),
        scheduledEnd: z.string().datetime()
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Body validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      await this.workOrderApplicationService.scheduleWorkOrder(
        req.user.tenantId,
        req.params.id,
        new Date(validation.data.scheduledStart),
        new Date(validation.data.scheduledEnd),
        req.user.id
      );

      console.log('✅ [WorkOrderController] Work order scheduled');
      res.json({
        success: true,
        message: 'Ordem de serviço agendada com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error scheduling work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async assignTechnician(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Assigning technician:', req.params.id);
      
      const bodySchema = z.object({
        technicianId: z.string().uuid()
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Body validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      await this.workOrderApplicationService.assignTechnician(
        req.user.tenantId,
        req.params.id,
        validation.data.technicianId,
        req.user.id
      );

      console.log('✅ [WorkOrderController] Technician assigned');
      res.json({
        success: true,
        message: 'Técnico atribuído à ordem de serviço com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error assigning technician:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🗑️ [WorkOrderController] Deleting work order:', req.params.id);
      
      await this.workOrderApplicationService.deleteWorkOrder(
        req.user.tenantId,
        req.params.id
      );

      console.log('✅ [WorkOrderController] Work order deleted');
      res.json({
        success: true,
        message: 'Ordem de serviço excluída com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error deleting work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async startWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Starting work order:', req.params.id);
      
      await this.workOrderApplicationService.startWorkOrder(
        req.user.tenantId,
        req.params.id,
        req.user.id
      );

      console.log('✅ [WorkOrderController] Work order started');
      res.json({
        success: true,
        message: 'Ordem de serviço iniciada com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error starting work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async completeWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [WorkOrderController] Completing work order:', req.params.id);
      
      await this.workOrderApplicationService.completeWorkOrder(
        req.user.tenantId,
        req.params.id,
        req.user.id
      );

      console.log('✅ [WorkOrderController] Work order completed');
      res.json({
        success: true,
        message: 'Ordem de serviço finalizada com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error completing work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getOverdueWorkOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [WorkOrderController] Getting overdue work orders');
      
      const workOrders = await this.workOrderApplicationService.getOverdueWorkOrders(
        req.user.tenantId
      );

      console.log(`✅ [WorkOrderController] Found ${workOrders.length} overdue work orders`);
      res.json({
        success: true,
        data: workOrders,
        message: 'Ordens de serviço atrasadas obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error getting overdue work orders:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getWorkOrderStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 [WorkOrderController] Getting work order statistics');
      
      const querySchema = z.object({
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional()
      });

      const validation = querySchema.safeParse(req.query);
      if (!validation.success) {
        console.log('❌ [WorkOrderController] Query validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Parâmetros de consulta inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const fromDate = validation.data.fromDate ? new Date(validation.data.fromDate) : undefined;
      const toDate = validation.data.toDate ? new Date(validation.data.toDate) : undefined;

      const stats = await this.workOrderApplicationService.getWorkOrderStatistics(
        req.user.tenantId,
        fromDate,
        toDate
      );

      console.log('✅ [WorkOrderController] Statistics obtained');
      res.json({
        success: true,
        data: stats,
        message: 'Estatísticas de ordens de serviço obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error getting statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 [WorkOrderController] Getting dashboard metrics');
      
      const metrics = await this.workOrderApplicationService.getDashboardMetrics(
        req.user.tenantId
      );

      console.log('✅ [WorkOrderController] Dashboard metrics obtained');
      res.json({
        success: true,
        data: metrics,
        message: 'Métricas do dashboard obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ [WorkOrderController] Error getting dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}