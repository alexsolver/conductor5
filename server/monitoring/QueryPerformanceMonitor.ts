

import { db, sql } from '../db.js';

export class QueryPerformanceMonitor {
  private static slowQueries = new Map<string, {
    count: number;
    avgDuration: number;
    lastOccurrence: Date;
  }>();

  static async analyzeSchemaPerformance(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Verificar queries lentas específicas do tenant
    const slowQueries = await db.execute(sql`
      SELECT 
        query,
        mean_exec_time,
        calls,
        total_exec_time,
        (total_exec_time / calls) as avg_time
      FROM pg_stat_statements 
      WHERE query LIKE ${'%' + schemaName + '%'}
      AND mean_exec_time > 200
      ORDER BY mean_exec_time DESC
      LIMIT 15
    `);

    // Verificar índices não utilizados
    const unusedIndexes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = ${schemaName}
      AND idx_scan < 10
      ORDER BY pg_relation_size(indexrelid) DESC
    `);

    // Atualizar estatísticas das tabelas críticas
    const criticalTables = [
      'tickets', 'customers', 'ticket_messages', 'items', 
      'suppliers', 'price_lists', 'ticket_planned_items'
    ];

    for (const table of criticalTables) {
      try {
        await db.execute(sql.raw(`ANALYZE ${schemaName}.${table}`));
      } catch (error) {
        console.warn(`⚠️ Could not analyze table ${table}:`, error.message);
      }
    }

    return {
      slowQueries: slowQueries.rows,
      unusedIndexes: unusedIndexes.rows,
      schemaName,
      timestamp: new Date().toISOString()
    };
  }

  static async generateOptimizationReport(tenantId: string) {
    const performance = await this.analyzeSchemaPerformance(tenantId);
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Verificar fragmentação de tabelas
    const tableStats = await db.execute(sql`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      WHERE schemaname = ${schemaName}
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    return {
      ...performance,
      tableStats: tableStats.rows,
      recommendations: this.generateRecommendations(performance, tableStats.rows)
    };
  }

  private static generateRecommendations(performance: any, tableStats: any[]) {
    const recommendations = [];

    // Recomendações baseadas em queries lentas
    if (performance.slowQueries.length > 0) {
      recommendations.push({
        type: 'SLOW_QUERIES',
        severity: 'HIGH',
        message: `${performance.slowQueries.length} queries executando > 200ms`,
        action: 'Revisar índices e otimizar WHERE clauses'
      });
    }

    // Recomendações baseadas em índices não utilizados
    if (performance.unusedIndexes.length > 3) {
      recommendations.push({
        type: 'UNUSED_INDEXES',
        severity: 'MEDIUM',
        message: `${performance.unusedIndexes.length} índices pouco utilizados`,
        action: 'Considerar remoção de índices desnecessários'
      });
    }

    // Recomendações baseadas em dead tuples
    const tablesWithDeadTuples = tableStats.filter(t => t.dead_tuples > 1000);
    if (tablesWithDeadTuples.length > 0) {
      recommendations.push({
        type: 'DEAD_TUPLES',
        severity: 'MEDIUM',
        message: `${tablesWithDeadTuples.length} tabelas com muitos dead tuples`,
        action: 'Executar VACUUM ANALYZE nas tabelas afetadas'
      });
    }

    return recommendations;
  }
}
