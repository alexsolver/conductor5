
import { GetDashboardMetricsUseCase } from '../use-cases/GetDashboardMetricsUseCase';

export interface GetDashboardMetricsRequest {
  category?: string;
}

export interface DashboardMetricResponse {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export class DashboardController {
  constructor(private getDashboardMetricsUseCase: GetDashboardMetricsUseCase) {}

  async getMetrics(request: GetDashboardMetricsRequest): Promise<DashboardMetricResponse[]> {
    const metrics = await this.getDashboardMetricsUseCase.execute(request.category);
    
    return metrics.map(metric => ({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      category: metric.category,
      createdAt: metric.createdAt.toISOString(),
      metadata: metric.metadata
    }));
  }
}
