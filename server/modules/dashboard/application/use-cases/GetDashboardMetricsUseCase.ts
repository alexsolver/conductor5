import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardMetric } from '../../domain/entities/DashboardMetric';

export interface GetDashboardMetricsRequest {
  tenantId: string;
}

export interface GetDashboardMetricsResponse {
  metrics: DashboardMetric[];
}

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly dashboardRepository: IDashboardRepository
  ) {}

  async execute(request: GetDashboardMetricsRequest): Promise<GetDashboardMetricsResponse> {
    const metrics = await this.dashboardRepository.getMetricsByTenant(request.tenantId);

    return {
      metrics
    };
  }
}