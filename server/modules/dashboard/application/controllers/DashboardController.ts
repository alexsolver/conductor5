import { GetDashboardMetricsUseCase, GetDashboardMetricsRequest, GetDashboardMetricsResponse } from '../use-cases/GetDashboardMetricsUseCase';

export class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  ) {}

  async getMetrics(request: GetDashboardMetricsRequest): Promise<GetDashboardMetricsResponse> {
    return await this.getDashboardMetricsUseCase.execute(request);
  }
}