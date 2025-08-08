
export class QueryOptimizer {
  static async analyzeSlowQueries(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Identificar queries lentas (>100ms)
    const slowQueries = await db.execute(sql`
      SELECT 
        query,
        mean_exec_time,
        calls,
        total_exec_time,
        (total_exec_time / calls) as avg_time
      FROM pg_stat_statements 
      WHERE query LIKE '%${schemaName}%'
      AND mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);

    return slowQueries.rows;
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
