
import { DashboardMetric } from '../entities/DashboardMetric';

export interface IDashboardRepository {
  findAll(): Promise<DashboardMetric[]>;
  findByCategory(category: string): Promise<DashboardMetric[]>;
  save(metric: DashboardMetric): Promise<DashboardMetric>;
  findById(id: string): Promise<DashboardMetric | null>;
}
