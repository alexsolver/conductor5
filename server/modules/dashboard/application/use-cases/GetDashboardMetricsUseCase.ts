/**
 * Get Dashboard Metrics Use Case
 * Clean Architecture - Application Layer
 */

import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardMetrics } from '../../domain/entities/DashboardMetrics';

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