import { sql } from 'drizzle-orm';
import { db } from '../db';

export class PerformanceDashboard {
  static async generateSystemReport(): Promise<any> {
    const report = {
      timestamp: new Date().toISOString(),
      systemHealth: await this.getSystemHealth(),
      queryPerformance: await this.getSlowQueries(),
      connectionStats: await this.getConnectionStats(),
      indexEfficiency: await this.getIndexUsage(),
      recommendations: []
    };

    // Gerar recomendações baseadas nos dados
    report.recommendations = this.generateRecommendations(report);
    
    return report;
  }

  private static async getSystemHealth(): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        datname as database_name,
        numbackends as active_connections,
        xact_commit as transactions_committed,
        xact_rollback as transactions_rolled_back,
        blks_read as disk_blocks_read,
        blks_hit as buffer_blocks_hit,
        temp_files,
        temp_bytes
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);

    return result.rows[0];
  }

  private static async getSlowQueries(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE mean_exec_time > 100
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `);
      return result.rows;
    } catch (error) {
      return []; // pg_stat_statements may not be enabled
    }
  }

  private static async getConnectionStats(): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        state,
        COUNT(*) as connection_count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `);

    return result.rows;
  }

  private static async getIndexUsage(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC
      LIMIT 20
    `);

    return result.rows;
  }

  private static generateRecommendations(report: any): string[] {
    const recommendations = [];
    
    const healthData = report.systemHealth;
    if (healthData?.buffer_blocks_hit && healthData?.disk_blocks_read) {
      const hitRatio = (healthData.buffer_blocks_hit / (healthData.buffer_blocks_hit + healthData.disk_blocks_read)) * 100;
      if (hitRatio < 95) {
        recommendations.push(`Buffer hit ratio é ${hitRatio.toFixed(1)}% - considere aumentar shared_buffers`);
      }
    }

    if (report.queryPerformance?.length > 5) {
      recommendations.push(`${report.queryPerformance.length} queries lentas identificadas - revisar indexação`);
    }

    const unusedIndexes = report.indexEfficiency?.filter((idx: any) => idx.idx_scan === 0);
    if (unusedIndexes?.length > 0) {
      recommendations.push(`${unusedIndexes.length} índices não utilizados - considerar remoção`);
    }

    return recommendations;
  }

  static async getTopTablesBySize(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname LIKE 'tenant_%'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 15
    `);

    return result.rows;
  }
}