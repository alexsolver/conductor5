
export class PoolMonitoringDashboard {
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
}
