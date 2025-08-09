
import { Request, Response } from 'express';
import { standardResponse } from '../../../utils/standardResponse';
import { GetDashboardMetricsUseCase } from '../use-cases/GetDashboardMetricsUseCase';

export class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  ) {}

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      const metrics = await this.getDashboardMetricsUseCase.execute({ tenantId });
      res.status(200).json(standardResponse(true, 'Métricas obtidas com sucesso', metrics));
    } catch (error) {
      console.error('Erro ao obter métricas do dashboard:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // Implementar lógica usando Use Case
      res.status(200).json(standardResponse(true, 'Overview obtido com sucesso', {}));
    } catch (error) {
      console.error('Erro ao obter overview:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }
}
