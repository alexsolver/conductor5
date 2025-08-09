
import { GetDashboardMetricsUseCase } from '../use-cases/GetDashboardMetricsUseCase';
import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardMetricResponseDTO } from '../dto/DashboardMetricDTO';

export class DashboardApplicationService {
  constructor(
    private getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private dashboardRepository: IDashboardRepository
  ) {}

  async getMetrics(tenantId: string): Promise<DashboardMetricResponseDTO[]> {
    const metrics = await this.getDashboardMetricsUseCase.execute({ tenantId });
    
    return metrics.map(metric => ({
      id: metric.id,
      metricType: metric.metricType,
      value: metric.value,
      timestamp: metric.timestamp.toISOString(),
      metadata: metric.metadata
    }));
  }
}
