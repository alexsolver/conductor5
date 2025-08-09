import { GetDashboardMetricsUseCase } from '../use-cases/GetDashboardMetricsUseCase';

export class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  ) {}

  async getStats(tenantId: string): Promise<any> {
    try {
      return await this.getDashboardMetricsUseCase.execute(tenantId);
    } catch (error) {
      console.error('Erro ao obter estatísticas do dashboard:', error);
      throw error;
    }
  }

  async getActivity(tenantId: string): Promise<any> {
    try {
      // Implementar lógica de atividades
      return {
        activities: [],
        totalCount: 0
      };
    } catch (error) {
      console.error('Erro ao obter atividades:', error);
      throw error;
    }
  }

  async getMetrics(tenantId: string): Promise<any> {
    try {
      return await this.getDashboardMetricsUseCase.execute(tenantId);
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      throw error;
    }
  }
}