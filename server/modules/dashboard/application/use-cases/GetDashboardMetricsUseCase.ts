
import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardMetric } from '../../domain/entities/DashboardMetric';

export class GetDashboardMetricsUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(category?: string): Promise<DashboardMetric[]> {
    if (category) {
      return await this.dashboardRepository.findByCategory(category);
    }
    return await this.dashboardRepository.findAll();
  }
}
export class GetDashboardMetricsUseCase {
  async execute(tenantId: string): Promise<any> {
    try {
      // Implementar lógica de busca de métricas
      return {
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        pendingTickets: 0,
        customerSatisfaction: 0,
        responseTime: 0
      };
    } catch (error) {
      console.error('Erro no GetDashboardMetricsUseCase:', error);
      throw error;
    }
  }
}
import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardMetric } from '../../domain/entities/DashboardMetric';

export interface GetDashboardMetricsRequest {
  tenantId: string;
}

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly dashboardRepository: IDashboardRepository
  ) {}

  async execute(request: GetDashboardMetricsRequest): Promise<DashboardMetric[]> {
    return await this.dashboardRepository.getMetricsByTenant(request.tenantId);
  }
}
