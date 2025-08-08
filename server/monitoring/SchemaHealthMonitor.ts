
export class SchemaHealthMonitor {
  static async generateHealthReport(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const report = {
      schemaName,
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    // Tamanho das tabelas
    const tableSizes = await db.execute(sql`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = ${schemaName}
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    // Índices não utilizados
    const unusedIndexes = await db.execute(sql`
      SELECT 
        indexname,
        idx_scan,
        idx_tup_read
      FROM pg_stat_user_indexes 
      WHERE schemaname = ${schemaName}
      AND idx_scan = 0
    `);

    // Verificar bloat de tabelas e índices
    const tablebloat = await db.execute(sql`
      SELECT 
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = ${schemaName}
      AND n_distinct < -0.1
      ORDER BY tablename, attname
    `);

    // Verificar locks ativos
    const activeLocks = await db.execute(sql`
      SELECT 
        pid,
        mode,
        locktype,
        granted
      FROM pg_locks 
      WHERE granted = false
      AND locktype = 'relation'
    `);

    report.metrics = {
      tableSizes: tableSizes.rows,
      unusedIndexes: unusedIndexes.rows,
      tablebloat: tablebloat.rows,
      activeLocks: activeLocks.rows,
      totalTables: tableSizes.rows.length,
      health_score: this.calculateHealthScore(tableSizes.rows, unusedIndexes.rows, activeLocks.rows)
    };

    return report;
  }

  private static calculateHealthScore(tableSizes: any[], unusedIndexes: any[], activeLocks: any[]): number {
    let score = 100;
    
    // Penalizar por índices não utilizados
    score -= Math.min(unusedIndexes.length * 2, 20);
    
    // Penalizar por locks ativos
    score -= Math.min(activeLocks.length * 5, 30);
    
    // Penalizar por tabelas muito grandes sem particionamento
    const largeTables = tableSizes.filter((t: any) => t.size_bytes > 1000000000); // 1GB
    score -= Math.min(largeTables.length * 10, 40);
    
    return Math.max(score, 0);
  }
  }
}
