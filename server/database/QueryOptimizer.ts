
export class QueryOptimizer {
  static async analyzeSlowQueries(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Identificar queries lentas (>100ms) com análise detalhada
    const slowQueries = await db.execute(sql`
      SELECT 
        query,
        mean_exec_time,
        calls,
        total_exec_time,
        (total_exec_time / calls) as avg_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE query LIKE '%${schemaName}%'
      AND mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 15
    `);

    // Análise adicional de tabelas mais acessadas
    const tableStats = await db.execute(sql`
      SELECT 
        tablename,
        n_tup_ins + n_tup_upd + n_tup_del as modifications,
        n_tup_hot_upd,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch
      FROM pg_stat_user_tables 
      WHERE schemaname = ${schemaName}
      ORDER BY modifications DESC
      LIMIT 10
    `);

    return {
      slowQueries: slowQueries.rows,
      tableStats: tableStats.rows,
      schemaName
    };
  }

  static async optimizeTableStatistics(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Atualizar estatísticas das tabelas principais
    const coreTables = ['tickets', 'customers', 'ticket_messages', 'items'];
    
    for (const table of coreTables) {
      await db.execute(sql`
        ANALYZE ${sql.identifier(schemaName)}.${sql.identifier(table)}
      `);
    }
  }
}
