import { Request, Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '../../../../utils/standardResponse';
import { GetDashboardMetricsUseCase } from '../use-cases/GetDashboardMetricsUseCase';
import { DashboardApplicationService } from '../services/DashboardApplicationService';

class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  ) {}

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(createErrorResponse('Tenant ID é obrigatório'));
        return;
      }

      const metrics = await this.getDashboardMetricsUseCase.execute({ tenantId });
      res.status(200).json(createSuccessResponse(metrics, 'Métricas obtidas com sucesso'));
    } catch (error) {
      console.error('Erro ao obter métricas do dashboard:', error);
      res.status(500).json(createErrorResponse('Erro interno do servidor'));
    }
  }

  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(createErrorResponse('Tenant ID é obrigatório'));
        return;
      }

      // Implementar lógica usando Use Case
      res.status(200).json(createSuccessResponse({}, 'Overview obtido com sucesso'));
    } catch (error) {
      console.error('Erro ao obter overview:', error);
      res.status(500).json(createErrorResponse('Erro interno do servidor'));
    }
  }
}

class DashboardController {
  constructor(private dashboardService: DashboardApplicationService) {}

  async getStats(tenantId: string): Promise<any> {
    return await this.dashboardService.getDashboardStats(tenantId);
  }

  async getActivity(tenantId: string): Promise<any> {
    return await this.dashboardService.getActivityFeed(tenantId);
  }
}

export default DashboardController;