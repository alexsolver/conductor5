/**
 * Get Dashboard Metrics Use Case
 * Clean Architecture - Application Layer
 */

import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
// Dashboard metrics interface - simplified for now
interface DashboardMetrics {
  tenantId: string;
  ticketStats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  userStats: {
    total: number;
    active: number;
    inactive: number;
  };
  activityStats: {
    todayTickets: number;
    weekTickets: number;
    monthTickets: number;
  };
  performanceStats: {
    avgResolutionTime: number;
    avgResponseTime: number;
    satisfactionScore: number;
  };
  generatedAt: Date;
}

export interface GetDashboardMetricsRequest {
  tenantId: string;
}

export class GetDashboardMetricsUseCase {
  constructor(
    private dashboardRepository: IDashboardRepository
  ) {}

  async execute(request: GetDashboardMetricsRequest): Promise<DashboardMetrics> {
    if (!request.tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Get metrics from repository
    return await this.dashboardRepository.getMetrics(request.tenantId);
  }
}