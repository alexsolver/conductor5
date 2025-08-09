import { GetDashboardMetricsUseCase, GetDashboardMetricsRequest } from '../use-cases/GetDashboardMetricsUseCase';

export interface DashboardControllerRequest {
  tenantId: string;
}

export interface DashboardControllerResponse {
  success: boolean;
  data: any;
  timestamp: string;
}

export class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  ) {}

  async getMetrics(request: DashboardControllerRequest): Promise<DashboardControllerResponse> {
    try {
      const useCaseRequest: GetDashboardMetricsRequest = {
        tenantId: request.tenantId
      };

      const result = await this.getDashboardMetricsUseCase.execute(useCaseRequest);

      return {
        success: true,
        data: result.metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Dashboard metrics retrieval failed: ${error}`);
    }
  }
}