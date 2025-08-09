
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
