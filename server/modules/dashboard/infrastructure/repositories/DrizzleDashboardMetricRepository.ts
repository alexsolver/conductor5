
import { DashboardMetric } from '../../domain/entities/DashboardMetric';
import { IDashboardMetricRepository } from '../../domain/repositories/IDashboardMetricRepository';

export class DrizzleDashboardMetricRepository implements IDashboardMetricRepository {
  async findByTenant(tenantId: string): Promise<DashboardMetric[]> {
    // Implementar com Drizzle
    return [];
  }

  async save(metric: DashboardMetric): Promise<DashboardMetric> {
    // Implementar com Drizzle
    return metric;
  }

  async findById(id: string): Promise<DashboardMetric | null> {
    // Implementar com Drizzle
    return null;
  }

  async delete(id: string): Promise<void> {
    // Implementar com Drizzle
  }
}
