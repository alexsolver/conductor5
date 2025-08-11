import { DashboardMetric } from '../entities/DashboardMetric';

export interface IDashboardMetricRepository {
  findById(id: string, tenantId: string): Promise<DashboardMetric | null>;
  findAll(tenantId: string): Promise<DashboardMetric[]>;
  create(entity: DashboardMetric): Promise<DashboardMetric>;
  update(id: string, entity: Partial<DashboardMetric>, tenantId: string): Promise<DashboardMetric | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
