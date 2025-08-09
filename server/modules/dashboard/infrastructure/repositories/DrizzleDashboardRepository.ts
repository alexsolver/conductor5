import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardMetric } from '../../domain/entities/DashboardMetric';

export class DrizzleDashboardRepository implements IDashboardRepository {
  async findAll(): Promise<DashboardMetric[]> {
    // Implementação do Drizzle ORM
    return [];
  }

  async findByCategory(category: string): Promise<DashboardMetric[]> {
    // Implementação do Drizzle ORM
    return [];
  }

  async save(metric: DashboardMetric): Promise<DashboardMetric> {
    // Implementação do Drizzle ORM
    return metric;
  }

  async findById(id: string): Promise<DashboardMetric | null> {
    // Implementação do Drizzle ORM
    return null;
  }
}