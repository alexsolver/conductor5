import { sql } from 'drizzle-orm';
import { db } from '../db';

// ===========================
// TENANT RESOURCE MANAGER
// Resolver problema 5: Tenant resource limits não implementados
// ===========================

interface TenantQuota {
  tenantId: string;
  maxConnections: number;
  maxQueriesPerMinute: number;
  maxStorageMB: number;
  maxUsers: number;
  maxTicketsPerDay: number;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
}

interface TenantUsage {
  tenantId: string;
  connections: number;
  queriesLastMinute: number;
  storageMB: number;
  users: number;
  ticketsToday: number;
  lastUpdated: number;
}

export class TenantResourceManager {
  private static instance: TenantResourceManager;
  private tenantQuotas = new Map<string, TenantQuota>();
  private tenantUsage = new Map<string, TenantUsage>();
  private usageHistory = new Map<string, Array<{ timestamp: number; usage: TenantUsage }>>();

  static getInstance(): TenantResourceManager {
    if (!TenantResourceManager.instance) {
      TenantResourceManager.instance = new TenantResourceManager();
    }
    return TenantResourceManager.instance;
  }

  constructor() {
    this.initializeDefaultQuotas();
  }

  // ===========================
  // QUOTAS PADRÃO POR TIER
  // ===========================
  private initializeDefaultQuotas(): void {
    const defaultQuotas = {
      free: {
        maxConnections: 3,
        maxQueriesPerMinute: 100,
        maxStorageMB: 100,
        maxUsers: 5,
        maxTicketsPerDay: 50
      },
      basic: {
        maxConnections: 10,
        maxQueriesPerMinute: 500,
        maxStorageMB: 1000,
        maxUsers: 25,
        maxTicketsPerDay: 500
      },
      premium: {
        maxConnections: 25,
        maxQueriesPerMinute: 2000,
        maxStorageMB: 5000,
        maxUsers: 100,
        maxTicketsPerDay: 2000
      },
      enterprise: {
        maxConnections: 100,
        maxQueriesPerMinute: 10000,
        maxStorageMB: 50000,
        maxUsers: 1000,
        maxTicketsPerDay: 10000
      }
    };

    console.log('[TenantResourceManager] Default quotas initialized for all tiers');
  }

  // ===========================
  // GERENCIAMENTO DE QUOTAS
  // ===========================
  setTenantQuota(tenantId: string, tier: 'free' | 'basic' | 'premium' | 'enterprise'): void {
    const quotaTemplate = this.getQuotaByTier(tier);
    const quota: TenantQuota = {
      tenantId,
      tier,
      ...quotaTemplate
    };

    this.tenantQuotas.set(tenantId, quota);
    console.log(`[TenantResourceManager] Set ${tier} quota for tenant ${tenantId}`);
  }

  private getQuotaByTier(tier: string): any {
    const quotas = {
      free: { maxConnections: 3, maxQueriesPerMinute: 100, maxStorageMB: 100, maxUsers: 5, maxTicketsPerDay: 50 },
      basic: { maxConnections: 10, maxQueriesPerMinute: 500, maxStorageMB: 1000, maxUsers: 25, maxTicketsPerDay: 500 },
      premium: { maxConnections: 25, maxQueriesPerMinute: 2000, maxStorageMB: 5000, maxUsers: 100, maxTicketsPerDay: 2000 },
      enterprise: { maxConnections: 100, maxQueriesPerMinute: 10000, maxStorageMB: 50000, maxUsers: 1000, maxTicketsPerDay: 10000 }
    };
    return quotas[tier as keyof typeof quotas];
  }

  // ===========================
  // MONITORAMENTO DE USO
  // ===========================
  async updateTenantUsage(tenantId: string): Promise<TenantUsage> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Get current connections
      const connectionResult = await db.execute(sql`
        SELECT count(*) as connection_count
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND query LIKE '%${schemaName}%'
        AND state = 'active'
      `);

      // Get storage usage
      const storageResult = await db.execute(sql`
        SELECT 
          COALESCE(
            ROUND(
              sum(pg_total_relation_size(schemaname||'.'||tablename)) / 1024.0 / 1024.0, 2
            ), 0
          ) as storage_mb
        FROM pg_tables 
        WHERE schemaname = ${schemaName}
      `);

      // Get user count
      const userResult = await db.execute(sql`
        SELECT count(*) as user_count
        FROM users 
        WHERE tenant_id = ${tenantId}
      `);

      // Get tickets today
      const ticketResult = await db.execute(sql`
        SELECT count(*) as ticket_count
        FROM ${sql.identifier(schemaName)}.tickets
        WHERE tenant_id = ${tenantId}
        AND created_at >= CURRENT_DATE
      `);

      const usage: TenantUsage = {
        tenantId,
        connections: parseInt(connectionResult.rows[0]?.connection_count as string) || 0,
        queriesLastMinute: this.getQueryCount(tenantId), // From cache
        storageMB: parseFloat(storageResult.rows[0]?.storage_mb as string) || 0,
        users: parseInt(userResult.rows[0]?.user_count as string) || 0,
        ticketsToday: parseInt(ticketResult.rows[0]?.ticket_count as string) || 0,
        lastUpdated: Date.now()
      };

      this.tenantUsage.set(tenantId, usage);
      this.recordUsageHistory(tenantId, usage);

      return usage;
    } catch (error) {
      console.error(`[TenantResourceManager] Failed to update usage for tenant ${tenantId}:`, error);
      return this.tenantUsage.get(tenantId) || this.getEmptyUsage(tenantId);
    }
  }

  // ===========================
  // VALIDAÇÃO DE LIMITES
  // ===========================
  async checkResourceLimit(
    tenantId: string, 
    resource: 'connections' | 'queries' | 'storage' | 'users' | 'tickets'
  ): Promise<{ allowed: boolean; current: number; limit: number; percentage: number }> {
    const quota = this.tenantQuotas.get(tenantId);
    if (!quota) {
      // Default to enterprise limits if not set
      this.setTenantQuota(tenantId, 'enterprise');
      return this.checkResourceLimit(tenantId, resource);
    }

    const usage = await this.updateTenantUsage(tenantId);
    
    let current: number;
    let limit: number;

    switch (resource) {
      case 'connections':
        current = usage.connections;
        limit = quota.maxConnections;
        break;
      case 'queries':
        current = usage.queriesLastMinute;
        limit = quota.maxQueriesPerMinute;
        break;
      case 'storage':
        current = usage.storageMB;
        limit = quota.maxStorageMB;
        break;
      case 'users':
        current = usage.users;
        limit = quota.maxUsers;
        break;
      case 'tickets':
        current = usage.ticketsToday;
        limit = quota.maxTicketsPerDay;
        break;
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    const percentage = (current / limit) * 100;
    const allowed = current < limit;

    // Log warnings for high usage
    if (percentage > 80) {
      console.warn(`[TenantResourceManager] ⚠️ Tenant ${tenantId} using ${percentage.toFixed(1)}% of ${resource} quota`);
    }

    return { allowed, current, limit, percentage };
  }

  // ===========================
  // ENFORÇAR LIMITES
  // ===========================
  async enforceLimits(tenantId: string): Promise<{ blocked: string[]; warnings: string[] }> {
    const blocked: string[] = [];
    const warnings: string[] = [];

    const resources = ['connections', 'queries', 'storage', 'users', 'tickets'] as const;
    
    for (const resource of resources) {
      const check = await this.checkResourceLimit(tenantId, resource);
      
      if (!check.allowed) {
        blocked.push(`${resource}: ${check.current}/${check.limit} (${check.percentage.toFixed(1)}%)`);
      } else if (check.percentage > 80) {
        warnings.push(`${resource}: ${check.current}/${check.limit} (${check.percentage.toFixed(1)}%)`);
      }
    }

    if (blocked.length > 0) {
      console.error(`[TenantResourceManager] 🚫 Tenant ${tenantId} BLOCKED: ${blocked.join(', ')}`);
    }

    if (warnings.length > 0) {
      console.warn(`[TenantResourceManager] ⚠️ Tenant ${tenantId} WARNINGS: ${warnings.join(', ')}`);
    }

    return { blocked, warnings };
  }

  // ===========================
  // CAPACITY PLANNING
  // ===========================
  async generateCapacityForecast(tenantId: string, days: number = 30): Promise<any> {
    const history = this.usageHistory.get(tenantId) || [];
    
    if (history.length < 7) {
      return {
        message: 'Insufficient data for forecasting (need at least 7 days)',
        recommendation: 'Monitor usage for more days'
      };
    }

    // Simple linear regression for growth prediction
    const recent = history.slice(-days);
    const growthRates = {
      connections: this.calculateGrowthRate(recent, 'connections'),
      storage: this.calculateGrowthRate(recent, 'storageMB'),
      users: this.calculateGrowthRate(recent, 'users'),
      tickets: this.calculateGrowthRate(recent, 'ticketsToday')
    };

    const quota = this.tenantQuotas.get(tenantId);
    if (!quota) {
      return { message: 'No quota defined for tenant' };
    }

    const currentUsage = await this.updateTenantUsage(tenantId);
    
    // Project usage in 30, 60, 90 days
    const projections = [30, 60, 90].map(days => {
      const projected = {
        connections: Math.max(currentUsage.connections + (growthRates.connections * days), 0),
        storage: Math.max(currentUsage.storageMB + (growthRates.storage * days), 0),
        users: Math.max(currentUsage.users + (growthRates.users * days), 0),
        tickets: Math.max(currentUsage.ticketsToday + (growthRates.tickets * days), 0)
      };

      return {
        days,
        projected,
        quotaBreaches: {
          connections: projected.connections > quota.maxConnections,
          storage: projected.storage > quota.maxStorageMB,
          users: projected.users > quota.maxUsers,
          tickets: projected.tickets > quota.maxTicketsPerDay
        }
      };
    });

    return {
      tenantId,
      currentTier: quota.tier,
      growthRates,
      projections,
      recommendations: this.generateRecommendations(projections, quota)
    };
  }

  // ===========================
  // UTILITÁRIOS
  // ===========================
  private getQueryCount(tenantId: string): number {
    // This would be tracked by the query monitoring system
    // For now, return 0 or implement based on your monitoring
    return 0;
  }

  private getEmptyUsage(tenantId: string): TenantUsage {
    return {
      tenantId,
      connections: 0,
      queriesLastMinute: 0,
      storageMB: 0,
      users: 0,
      ticketsToday: 0,
      lastUpdated: Date.now()
    };
  }

  private recordUsageHistory(tenantId: string, usage: TenantUsage): void {
    if (!this.usageHistory.has(tenantId)) {
      this.usageHistory.set(tenantId, []);
    }

    const history = this.usageHistory.get(tenantId)!;
    history.push({ timestamp: Date.now(), usage: { ...usage } });

    // Keep only last 90 days
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    this.usageHistory.set(tenantId, 
      history.filter(h => h.timestamp > ninetyDaysAgo)
    );
  }

  private calculateGrowthRate(history: any[], field: keyof TenantUsage): number {
    if (history.length < 2) return 0;

    const values = history.map(h => h.usage[field] as number);
    const x = history.map((_, i) => i);
    
    // Simple linear regression
    const n = values.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope || 0;
  }

  private generateRecommendations(projections: any[], quota: TenantQuota): string[] {
    const recommendations: string[] = [];
    
    const nearestBreach = projections.find(p => 
      Object.values(p.quotaBreaches).some(breach => breach)
    );

    if (nearestBreach) {
      recommendations.push(`Quota breach expected in ${nearestBreach.days} days`);
      
      const breachedResources = Object.entries(nearestBreach.quotaBreaches)
        .filter(([_, breached]) => breached)
        .map(([resource, _]) => resource);

      if (breachedResources.length > 0) {
        recommendations.push(`Consider upgrading tier for: ${breachedResources.join(', ')}`);
      }
    }

    if (quota.tier === 'free' && projections[0].projected.users > 3) {
      recommendations.push('Consider upgrading from free tier');
    }

    return recommendations;
  }

  // ===========================
  // RELATÓRIOS
  // ===========================
  async getTenantResourceReport(tenantId: string): Promise<any> {
    const quota = this.tenantQuotas.get(tenantId);
    const usage = await this.updateTenantUsage(tenantId);
    const limits = await this.enforceLimits(tenantId);
    const forecast = await this.generateCapacityForecast(tenantId);

    return {
      tenantId,
      tier: quota?.tier || 'undefined',
      quota,
      usage,
      limits,
      forecast,
      timestamp: new Date()
    };
  }
}

export const tenantResourceManager = TenantResourceManager.getInstance();