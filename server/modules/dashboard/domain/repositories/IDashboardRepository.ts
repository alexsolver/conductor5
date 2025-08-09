
import { DashboardMetric } from '../entities/DashboardMetric';

export interface IDashboardRepository {
  findAll(): Promise<DashboardMetric[]>;
  findByCategory(category: string): Promise<DashboardMetric[]>;
  save(metric: DashboardMetric): Promise<DashboardMetric>;
  findById(id: string): Promise<DashboardMetric | null>;
}
import { DashboardMetric } from '../entities/DashboardMetric';

export interface IDashboardRepository {
  getMetricsByTenant(tenantId: string): Promise<DashboardMetric[]>;
  createMetric(metric: DashboardMetric): Promise<DashboardMetric>;
  updateMetric(id: string, metric: Partial<DashboardMetric>): Promise<DashboardMetric>;
  deleteMetric(id: string): Promise<void>;
}
