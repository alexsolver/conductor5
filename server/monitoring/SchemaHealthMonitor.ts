
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

    report.metrics = {
      tableSizes: tableSizes.rows,
      unusedIndexes: unusedIndexes.rows,
      totalTables: tableSizes.rows.length
    };

    return report;
  }
}
