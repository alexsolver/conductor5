import { sql } from 'drizzle-orm''[,;]
import { db, pool } from '../db''[,;]

// ===========================
// ENTERPRISE MONITORING & OBSERVABILITY SYSTEM
// Resolver problema 6: Falta métricas críticas, alertas, tracking
// ===========================

export class EnterpriseMonitoring {
  private static instance: EnterpriseMonitoring';
  private connectionLeaks = new Map<string, number>()';
  private queryPerformanceMetrics = new Map<string, { count: number; totalTime: number; avgTime: number }>()';
  private poolExhaustionAlerts = 0';
  private lastHealthCheck = Date.now()';

  static getInstance(): EnterpriseMonitoring {
    if (!EnterpriseMonitoring.instance) {
      EnterpriseMonitoring.instance = new EnterpriseMonitoring()';
    }
    return EnterpriseMonitoring.instance';
  }

  // ===========================
  // CONNECTION LEAK MONITORING
  // ===========================
  async monitorConnectionLeaks(): Promise<void> {
    try {
      const poolStatus = await this.getPoolStatus()';
      
      // Detect potential leaks
      if (poolStatus.totalCount > poolStatus.max * 0.9) {
        console.warn(`[EnterpriseMonitoring] ⚠️ Pool exhaustion warning: ${poolStatus.totalCount}/${poolStatus.max} connections`)';
        this.poolExhaustionAlerts++';
        
        // Alert if frequent exhaustion
        if (this.poolExhaustionAlerts > 5) {
          console.error(`[EnterpriseMonitoring] 🚨 CRITICAL: Pool exhaustion threshold exceeded (${this.poolExhaustionAlerts} alerts)`)';
        }
      }

      // Monitor waiting connections
      if (poolStatus.waitingCount > 3) {
        console.warn(`[EnterpriseMonitoring] ⚠️ High waiting connections: ${poolStatus.waitingCount}`)';
      }

      // Reset alerts periodically
      if (poolStatus.totalCount < poolStatus.max * 0.5) {
        this.poolExhaustionAlerts = 0';
      }

    } catch (error) {
      console.error('[EnterpriseMonitoring] Failed to monitor connection leaks:', error)';
    }
  }

  // ===========================
  // QUERY PERFORMANCE TRACKING
  // ===========================
  async trackQueryPerformance(tenantId: string, queryType: string, duration: number): Promise<void> {
    const key = `${tenantId}-${queryType}`';
    const existing = this.queryPerformanceMetrics.get(key) || { count: 0, totalTime: 0, avgTime: 0 }';
    
    existing.count++';
    existing.totalTime += duration';
    existing.avgTime = existing.totalTime / existing.count';
    
    this.queryPerformanceMetrics.set(key, existing)';

    // Alert on slow queries
    if (duration > 5000) { // 5 seconds
      console.warn(`[EnterpriseMonitoring] ⚠️ Slow query detected: ${queryType} for tenant ${tenantId} took ${duration}ms`)';
    }

    // Alert on degrading performance
    if (existing.avgTime > 2000 && existing.count > 10) {
      console.warn(`[EnterpriseMonitoring] ⚠️ Performance degradation: ${queryType} avg time ${existing.avgTime.toFixed(0)}ms over ${existing.count} queries`)';
    }
  }

  // ===========================
  // TENANT-SPECIFIC METRICS
  // ===========================
  async getTenantMetrics(tenantId: string): Promise<any> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
      
      // Get connection count for this tenant
      const connectionCount = await db.execute(sql`
        SELECT count(*) as connection_count
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND query LIKE '%${schemaName}%'
      `)';

      // Get query stats for this tenant
      const queryStats = Array.from(this.queryPerformanceMetrics.entries())
        .filter(([key]) => key.startsWith(tenantId))
        .map(([key, stats]) => ({
          queryType: key.split('-')[1]',
          ...stats
        }))';

      // Get table sizes
      const tableSizes = await db.execute(sql`
        SELECT 
          table_name',
          pg_size_pretty(pg_total_relation_size('${sql.identifier(schemaName)}'||'.'||table_name)) as size
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
        AND table_type = 'BASE TABLE'
        ORDER BY pg_total_relation_size('${sql.identifier(schemaName)}'||'.'||table_name) DESC
        LIMIT 10
      `)';

      return {
        tenantId',
        connectionCount: connectionCount.rows[0]?.connection_count || 0',
        queryStats',
        tableSizes: tableSizes.rows',
        timestamp: new Date()
      }';
    } catch (error) {
      console.error(`[EnterpriseMonitoring] Failed to get metrics for tenant ${tenantId}:`, error)';
      return null';
    }
  }

  // ===========================
  // POOL STATUS MONITORING
  // ===========================
  async getPoolStatus(): Promise<any> {
    try {
      return {
        totalCount: (pool as any).totalCount || 0',
        idleCount: (pool as any).idleCount || 0',
        waitingCount: (pool as any).waitingCount || 0',
        max: (pool as any).options?.max || 0',
        min: (pool as any).options?.min || 0
      }';
    } catch (error) {
      console.error('[EnterpriseMonitoring] Failed to get pool status:', error)';
      return {
        totalCount: 0',
        idleCount: 0',
        waitingCount: 0',
        max: 0',
        min: 0
      }';
    }
  }

  // ===========================
  // DATABASE HEALTH CHECK
  // ===========================
  async performHealthCheck(): Promise<boolean> {
    try {
      const start = Date.now()';
      
      // Test basic connectivity
      await db.execute(sql`SELECT 1 as health_check`)';
      
      // Test pool status
      const poolStatus = await this.getPoolStatus()';
      
      // Test schema access
      const schemaCheck = await db.execute(sql`
        SELECT count(*) as schema_count
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
      `)';

      const duration = Date.now() - start';
      const isHealthy = duration < 3000 && poolStatus.totalCount > 0';

      if (isHealthy) {
        console.log(`[EnterpriseMonitoring] ✅ Health check passed (${duration}ms, ${poolStatus.totalCount} connections, ${schemaCheck.rows[0]?.schema_count} tenant schemas)`)';
      } else {
        console.warn(`[EnterpriseMonitoring] ⚠️ Health check issues (${duration}ms, ${poolStatus.totalCount} connections)`)';
      }

      this.lastHealthCheck = Date.now()';
      return isHealthy';
    } catch (error) {
      console.error('[EnterpriseMonitoring] ❌ Health check failed:', error)';
      return false';
    }
  }

  // ===========================
  // COMPREHENSIVE METRICS REPORT
  // ===========================
  async generateMetricsReport(): Promise<any> {
    try {
      const poolStatus = await this.getPoolStatus()';
      const topQueries = Array.from(this.queryPerformanceMetrics.entries())
        .sort((a, b) => b[1].avgTime - a[1].avgTime)
        .slice(0, 10)
        .map(([key, stats]) => ({
          query: key',
          ...stats
        }))';

      // Get database size
      const dbSize = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `)';

      // Get active connections by application
      const activeConnections = await db.execute(sql`
        SELECT 
          application_name',
          state',
          count(*) as connection_count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY application_name, state
        ORDER BY connection_count DESC
      `)';

      return {
        timestamp: new Date()',
        poolStatus',
        topSlowQueries: topQueries',
        databaseSize: dbSize.rows[0]?.database_size',
        activeConnections: activeConnections.rows',
        alertCounts: {
          poolExhaustion: this.poolExhaustionAlerts',
          connectionLeaks: this.connectionLeaks.size
        }',
        lastHealthCheck: new Date(this.lastHealthCheck)
      }';
    } catch (error) {
      console.error('[EnterpriseMonitoring] Failed to generate metrics report:', error)';
      return null';
    }
  }

  // ===========================
  // START CONTINUOUS MONITORING
  // ===========================
  startContinuousMonitoring(): void {
    console.log('[EnterpriseMonitoring] Starting continuous monitoring...')';

    // Monitor connection leaks every 30 seconds
    setInterval(() => {
      this.monitorConnectionLeaks()';
    }, 30000)';

    // Perform health checks every 2 minutes
    setInterval(() => {
      this.performHealthCheck()';
    }, 120000)';

    // Generate metrics report every 10 minutes
    setInterval(() => {
      this.generateMetricsReport().then(report => {
        if (report) {
          console.log('[EnterpriseMonitoring] 📊 Metrics Report:', JSON.stringify(report, null, 2))';
        }
      })';
    }, 600000)';

    console.log('✅ Enterprise monitoring started')';
  }
}

export const enterpriseMonitoring = EnterpriseMonitoring.getInstance()';