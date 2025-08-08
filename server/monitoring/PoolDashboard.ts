import { EnterpriseConnectionManager } from '../database/EnterpriseConnectionManager.js';

export class PoolDashboard {
  static async getSystemHealth() {
    const connectionManager = EnterpriseConnectionManager.getInstance();
    const healthCheck = await connectionManager.healthCheck();

    return {
      timestamp: new Date().toISOString(),
      mainPool: healthCheck.mainPool,
      tenantPools: healthCheck.tenantPools,
      totalPools: healthCheck.totalPools,
      overallHealth: healthCheck.healthy ? 'HEALTHY' : 'DEGRADED'
    };
  }

  static async getMetricsSummary() {
    const connectionManager = EnterpriseConnectionManager.getInstance();
    const metrics = connectionManager.getAllMetrics();

    const summary = {
      totalTenants: metrics.size,
      totalActiveConnections: 0,
      totalErrors: 0,
      avgConnectionTime: 0
    };

    for (const [tenantId, metric] of metrics) {
      summary.totalActiveConnections += metric.activeConnections;
      summary.totalErrors += metric.totalErrors;
      summary.avgConnectionTime += metric.avgConnectionTime;
    }

    summary.avgConnectionTime = summary.avgConnectionTime / metrics.size;

    return summary;
  }

  static async getPoolMetrics() {
    const connectionManager = EnterpriseConnectionManager.getInstance();
    const mainPool = connectionManager.getMainPool();
    const allMetrics = connectionManager.getAllMetrics();

    // Health check de todos os pools
    const healthCheck = await connectionManager.healthCheck();

    return {
      timestamp: new Date().toISOString(),
      mainPool: {
        totalCount: (mainPool as any).totalCount || 0,
        idleCount: (mainPool as any).idleCount || 0,
        waitingCount: (mainPool as any).waitingCount || 0
      },
      tenantPools: {
        count: allMetrics.size,
        healthy: healthCheck.tenantPools.filter(p => p.healthy).length,
        unhealthy: healthCheck.tenantPools.filter(p => !p.healthy).length
      },
      healthStatus: {
        overall: healthCheck.healthy,
        mainPool: healthCheck.mainPool,
        issues: healthCheck.tenantPools.filter(p => !p.healthy)
      },
      recommendations: this.generatePoolRecommendations(healthCheck, allMetrics)
    };
  }

  private static generatePoolRecommendations(healthCheck: any, metrics: any) {
    const recommendations = [];

    if (!healthCheck.healthy) {
      recommendations.push({
        type: 'POOL_HEALTH',
        severity: 'CRITICAL',
        message: 'Um ou mais pools de conexão não estão saudáveis',
        action: 'Verificar logs e reiniciar pools problemáticos'
      });
    }

    if (healthCheck.tenantPools.length > 10) {
      recommendations.push({
        type: 'POOL_COUNT',
        severity: 'INFO',
        message: `${healthCheck.tenantPools.length} pools de tenant ativos`,
        action: 'Monitorar uso de memória e considerar pool cleanup'
      });
    }

    return recommendations;
  }
}