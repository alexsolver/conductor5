import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import { DashboardMetric } from '../../domain/entities/DashboardMetric';

export class DrizzleDashboardRepository implements IDashboardRepository {
  private db = drizzle(process.env.DATABASE_URL!);

  async getMetricsByTenant(tenantId: string): Promise<DashboardMetric[]> {
    const result = await this.db.execute(sql`
      SELECT 
        'total_tickets' as metric_type,
        COUNT(*)::text as value,
        NOW() as created_at
      FROM tickets 
      WHERE tenant_id = ${tenantId}

      UNION ALL

      SELECT 
        'open_tickets' as metric_type,
        COUNT(*)::text as value,
        NOW() as created_at
      FROM tickets 
      WHERE tenant_id = ${tenantId} AND status = 'open'
    `);

    return result.map(row => new DashboardMetric(
      crypto.randomUUID(),
      tenantId,
      row.metric_type as string,
      row.value as string,
      new Date(row.created_at as string)
    ));
  }

  async createMetric(metric: DashboardMetric): Promise<DashboardMetric> {
    // Implementação para criar métrica
    return metric;
  }

  async updateMetric(id: string, metric: Partial<DashboardMetric>): Promise<DashboardMetric> {
    // Implementação para atualizar métrica
    throw new Error('Not implemented');
  }

  async deleteMetric(id: string): Promise<void> {
    // Implementação para deletar métrica
  }
}