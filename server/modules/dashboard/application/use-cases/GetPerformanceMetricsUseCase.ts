/**
 * GetPerformanceMetricsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for performance metrics business logic
 */

import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';

interface MetricsRepositoryInterface {
  getPerformanceMetrics(tenantId: string, period: string): Promise<PerformanceMetrics>;
}

export interface GetPerformanceMetricsRequest {
  tenantId: string;
  period?: string;
}

export interface GetPerformanceMetricsResponse {
  success: boolean;
  message: string;
  data: {
    averageResolutionTime: number;
    firstResponseTime: number;
    customerSatisfaction: number;
    agentUtilization: number;
    ticketVolume: number;
    period: string;
    tenantId: string;
  };
}

export class GetPerformanceMetricsUseCase {
  constructor(
    private readonly metricsRepository: MetricsRepositoryInterface
  ) {}

  async execute(request: GetPerformanceMetricsRequest): Promise<GetPerformanceMetricsResponse> {
    const period = request.period || 'week';
    const metrics = await this.metricsRepository.getPerformanceMetrics(
      request.tenantId,
      period
    );

    return {
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: {
        averageResolutionTime: metrics.getAverageResolutionTime(),
        firstResponseTime: metrics.getFirstResponseTime(),
        customerSatisfaction: metrics.getCustomerSatisfaction(),
        agentUtilization: metrics.getAgentUtilization(),
        ticketVolume: metrics.getTicketVolume(),
        period: metrics.getPeriod(),
        tenantId: metrics.getTenantId()
      }
    };
  }
}