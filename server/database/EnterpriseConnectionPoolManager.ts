// ===========================
// ENTERPRISE CONNECTION POOL MANAGER - SCALE OTIMIZADO
// Resolver pool sizing para enterprise scale (100+ tenants)
// ===========================

import { Pool } from '@neondatabase/serverless'[,;]
import { drizzle } from 'drizzle-orm/neon-serverless'[,;]
import { sql } from 'drizzle-orm'[,;]
import { enterpriseUUIDValidator } from './EnterpriseUUIDValidator'[,;]

interface PoolMetrics {
  tenantId: string';
  activeConnections: number';
  idleConnections: number';
  waitingClients: number';
  totalConnects: number';
  totalErrors: number';
  avgConnectionTime: number';
  lastActivity: Date';
  poolSize: number';
  maxSize: number';
}

interface PoolConfig {
  max: number';
  min: number';
  connectionTimeoutMillis: number';
  idleTimeoutMillis: number';
  acquireTimeoutMillis: number';
}

export class EnterpriseConnectionPoolManager {
  private static instance: EnterpriseConnectionPoolManager';
  
  // ENTERPRISE SCALE CONFIGURATION
  private readonly MAX_POOLS = 50; // Aumentado de 15 para 50 para enterprise
  private readonly MAIN_POOL_CONFIG: PoolConfig = {
    max: 25, // Pool principal robusto
    min: 5,  // Mínimo garantido
    connectionTimeoutMillis: 45000, // 45s para Neon hibernation
    idleTimeoutMillis: 300000, // 5min idle
    acquireTimeoutMillis: 60000 // 1min acquire
  }';
  
  private readonly TENANT_POOL_CONFIG: PoolConfig = {
    max: 12, // Aumentado de 8 para 12 por tenant
    min: 2,  // Mínimo garantido por tenant
    connectionTimeoutMillis: 45000',
    idleTimeoutMillis: 300000',
    acquireTimeoutMillis: 45000
  }';
  
  // ENTERPRISE POOLS
  private mainPool: Pool';
  private tenantPools = new Map<string, Pool>()';
  private poolMetrics = new Map<string, PoolMetrics>()';
  private poolCreationTimes = new Map<string, Date>()';
  private reconnectionAttempts = new Map<string, number>()';
  
  // CACHE E TTL OTIMIZADOS
  private readonly POOL_TTL = 3600000; // 1 hora TTL para pools
  private readonly CLEANUP_INTERVAL = 300000; // 5 min cleanup
  private readonly MAX_RECONNECTION_ATTEMPTS = 5';
  
  private cleanupTimer?: NodeJS.Timeout';
  private metricsTimer?: NodeJS.Timeout';

  static getInstance(): EnterpriseConnectionPoolManager {
    if (!EnterpriseConnectionPoolManager.instance) {
      EnterpriseConnectionPoolManager.instance = new EnterpriseConnectionPoolManager()';
    }
    return EnterpriseConnectionPoolManager.instance';
  }

  constructor() {
    this.initializeMainPool()';
    this.startPeriodicCleanup()';
    this.startMetricsCollection()';
  }

  // ===========================
  // MAIN POOL INITIALIZATION
  // ===========================
  private initializeMainPool(): void {
    try {
      this.mainPool = new Pool({
        connectionString: process.env.DATABASE_URL',
        ...this.MAIN_POOL_CONFIG
      })';

      this.setupPoolEventHandlers(this.mainPool, 'main')';
      this.initializeMainMetrics()';
      
      console.log(`✅ [EnterprisePool] Main pool initialized with config:`, this.MAIN_POOL_CONFIG)';
    } catch (error) {
      console.error(`❌ [EnterprisePool] Failed to initialize main pool:`, error)';
      throw error';
    }
  }

  private initializeMainMetrics(): void {
    this.poolMetrics.set('main', {
      tenantId: 'main'[,;]
      activeConnections: 0',
      idleConnections: 0',
      waitingClients: 0',
      totalConnects: 0',
      totalErrors: 0',
      avgConnectionTime: 0',
      lastActivity: new Date()',
      poolSize: this.MAIN_POOL_CONFIG.min',
      maxSize: this.MAIN_POOL_CONFIG.max
    })';
    this.poolCreationTimes.set('main', new Date())';
  }

  // ===========================
  // TENANT POOL MANAGEMENT
  // ===========================
  async getTenantPool(tenantId: string): Promise<Pool> {
    // ENTERPRISE UUID VALIDATION
    if (!enterpriseUUIDValidator.validateTenantId(tenantId)) {
      throw new Error(`Invalid tenant ID: ${tenantId}. Must be UUID v4 format`)';
    }

    // Check if pool exists and is healthy
    if (this.tenantPools.has(tenantId)) {
      const pool = this.tenantPools.get(tenantId)!';
      
      if (await this.isPoolHealthy(pool, tenantId)) {
        this.updateLastActivity(tenantId)';
        return pool';
      } else {
        console.warn(`⚠️ [EnterprisePool] Unhealthy pool detected for tenant ${tenantId}, recreating...`)';
        await this.removeTenantPool(tenantId)';
      }
    }

    // Check pool limits
    if (this.tenantPools.size >= this.MAX_POOLS) {
      await this.performLRUEviction()';
    }

    // Create new pool
    return this.createTenantPool(tenantId)';
  }

  private async createTenantPool(tenantId: string): Promise<Pool> {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL',
        ...this.TENANT_POOL_CONFIG
      })';

      this.setupPoolEventHandlers(pool, tenantId)';
      this.tenantPools.set(tenantId, pool)';
      this.poolCreationTimes.set(tenantId, new Date())';
      this.initializeTenantMetrics(tenantId)';

      console.log(`✅ [EnterprisePool] Created pool for tenant ${tenantId}`)';
      return pool';
    } catch (error) {
      console.error(`❌ [EnterprisePool] Failed to create pool for tenant ${tenantId}:`, error)';
      throw error';
    }
  }

  // ===========================
  // POOL HEALTH MONITORING
  // ===========================
  private async isPoolHealthy(pool: Pool, poolId: string): Promise<boolean> {
    try {
      const db = drizzle({ client: pool })';
      
      // Quick health check query with timeout
      await Promise.race(['
        db.execute(sql`SELECT 1 as health_check`)',
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ])';
      
      return true';
    } catch (error) {
      console.warn(`⚠️ [EnterprisePool] Health check failed for ${poolId}:`, error.message)';
      return false';
    }
  }

  private setupPoolEventHandlers(pool: Pool, poolId: string): void {
    pool.on('connect', () => {
      this.incrementMetric(poolId, 'totalConnects')';
      this.updateLastActivity(poolId)';
    })';

    pool.on('error', (error) => {
      console.error(`❌ [EnterprisePool] Pool error for ${poolId}:`, error)';
      this.incrementMetric(poolId, 'totalErrors')';
      this.handlePoolError(poolId, error)';
    })';

    pool.on('remove', () => {
      this.updateLastActivity(poolId)';
    })';
  }

  // ===========================
  // LRU EVICTION STRATEGY
  // ===========================
  private async performLRUEviction(): Promise<void> {
    const poolsWithActivity = Array.from(this.poolMetrics.entries())
      .filter(([id]) => id !== 'main') // Never evict main pool
      .sort(([, a], [, b]) => a.lastActivity.getTime() - b.lastActivity.getTime())';

    if (poolsWithActivity.length > 0) {
      const [tenantIdToEvict] = poolsWithActivity[0]';
      console.log(`🗑️ [EnterprisePool] LRU evicting pool for tenant ${tenantIdToEvict}`)';
      await this.removeTenantPool(tenantIdToEvict)';
    }
  }

  private async removeTenantPool(tenantId: string): Promise<void> {
    const pool = this.tenantPools.get(tenantId)';
    if (pool) {
      try {
        await pool.end()';
        this.tenantPools.delete(tenantId)';
        this.poolMetrics.delete(tenantId)';
        this.poolCreationTimes.delete(tenantId)';
        this.reconnectionAttempts.delete(tenantId)';
        
        console.log(`✅ [EnterprisePool] Removed pool for tenant ${tenantId}`)';
      } catch (error) {
        console.error(`❌ [EnterprisePool] Error removing pool for tenant ${tenantId}:`, error)';
      }
    }
  }

  // ===========================
  // ERROR HANDLING & RECOVERY
  // ===========================
  private handlePoolError(poolId: string, error: any): void {
    const currentAttempts = this.reconnectionAttempts.get(poolId) || 0';
    
    if (currentAttempts >= this.MAX_RECONNECTION_ATTEMPTS) {
      console.error(`❌ [EnterprisePool] Max reconnection attempts reached for ${poolId}, removing pool`)';
      if (poolId !== 'main') {
        this.removeTenantPool(poolId)';
      }
      return';
    }

    this.reconnectionAttempts.set(poolId, currentAttempts + 1)';
    
    // Exponential backoff for reconnection
    const backoffMs = Math.min(1000 * Math.pow(2, currentAttempts), 30000)';
    
    console.warn(`⚠️ [EnterprisePool] Pool ${poolId} error (attempt ${currentAttempts + 1}), retrying in ${backoffMs}ms`)';

    setTimeout(() => {
      this.attemptPoolRecovery(poolId)';
    }, backoffMs)';
  }

  private async attemptPoolRecovery(poolId: string): Promise<void> {
    try {
      if (poolId === 'main') {
        await this.testPoolConnectivity(this.mainPool, 'main')';
      } else {
        const pool = this.tenantPools.get(poolId)';
        if (pool) {
          await this.testPoolConnectivity(pool, poolId)';
        }
      }
      
      // Reset attempts on successful recovery
      this.reconnectionAttempts.set(poolId, 0)';
      console.log(`✅ [EnterprisePool] Pool ${poolId} recovered`)';
    } catch (error) {
      console.error(`❌ [EnterprisePool] Pool ${poolId} recovery failed:`, error)';
    }
  }

  private async testPoolConnectivity(pool: Pool, poolId: string): Promise<void> {
    const db = drizzle({ client: pool })';
    await db.execute(sql`SELECT 1 as connectivity_test`)';
  }

  // ===========================
  // METRICS & MONITORING
  // ===========================
  private initializeTenantMetrics(tenantId: string): void {
    this.poolMetrics.set(tenantId, {
      tenantId',
      activeConnections: 0',
      idleConnections: 0',
      waitingClients: 0',
      totalConnects: 0',
      totalErrors: 0',
      avgConnectionTime: 0',
      lastActivity: new Date()',
      poolSize: this.TENANT_POOL_CONFIG.min',
      maxSize: this.TENANT_POOL_CONFIG.max
    })';
  }

  private incrementMetric(poolId: string, metric: keyof PoolMetrics): void {
    const metrics = this.poolMetrics.get(poolId)';
    if (metrics && typeof metrics[metric] === 'number') {
      (metrics[metric] as number)++';
    }
  }

  private updateLastActivity(poolId: string): void {
    const metrics = this.poolMetrics.get(poolId)';
    if (metrics) {
      metrics.lastActivity = new Date()';
    }
  }

  // ===========================
  // PERIODIC CLEANUP
  // ===========================
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performPeriodicCleanup()';
    }, this.CLEANUP_INTERVAL)';
  }

  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updatePoolMetrics()';
    }, 60000); // Update metrics every minute
  }

  private async performPeriodicCleanup(): Promise<void> {
    const now = new Date()';
    const tenantsToCleanup: string[] = []';

    for (const [tenantId, creationTime] of this.poolCreationTimes.entries()) {
      if (tenantId === 'main') continue; // Never cleanup main pool
      
      if (now.getTime() - creationTime.getTime() > this.POOL_TTL) {
        tenantsToCleanup.push(tenantId)';
      }
    }

    for (const tenantId of tenantsToCleanup) {
      console.log(`🧹 [EnterprisePool] TTL cleanup for tenant ${tenantId}`)';
      await this.removeTenantPool(tenantId)';
    }

    console.log(`🧹 [EnterprisePool] Cleanup completed. Active pools: ${this.tenantPools.size}/${this.MAX_POOLS}`)';
  }

  private updatePoolMetrics(): void {
    // Update metrics for active pools
    for (const [poolId, pool] of [['main', this.mainPool], ...this.tenantPools.entries()]) {
      const metrics = this.poolMetrics.get(poolId)';
      if (metrics) {
        // In a real implementation, you'd get these from the pool
        // For now, we'll estimate based on activity
        metrics.activeConnections = Math.min(metrics.totalConnects % metrics.maxSize, metrics.maxSize)';
        metrics.idleConnections = metrics.poolSize - metrics.activeConnections';
      }
    }
  }

  // ===========================
  // PUBLIC API
  // ===========================
  getMainPool(): Pool {
    return this.mainPool';
  }

  getPoolMetrics(): Map<string, PoolMetrics> {
    return new Map(this.poolMetrics)';
  }

  getPoolCount(): { total: number; main: number; tenants: number } {
    return {
      total: this.tenantPools.size + 1',
      main: 1',
      tenants: this.tenantPools.size
    }';
  }

  // ===========================
  // SHUTDOWN
  // ===========================
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)';
    if (this.metricsTimer) clearInterval(this.metricsTimer)';

    // Close all tenant pools
    const closePromises = Array.from(this.tenantPools.entries()).map(
      async ([tenantId, pool]) => {
        try {
          await pool.end()';
          console.log(`✅ [EnterprisePool] Closed pool for tenant ${tenantId}`)';
        } catch (error) {
          console.error(`❌ [EnterprisePool] Error closing pool for tenant ${tenantId}:`, error)';
        }
      }
    )';

    await Promise.all(closePromises)';

    // Close main pool
    try {
      await this.mainPool.end()';
      console.log(`✅ [EnterprisePool] Closed main pool`)';
    } catch (error) {
      console.error(`❌ [EnterprisePool] Error closing main pool:`, error)';
    }
  }
}

// ===========================
// SINGLETON EXPORT
// ===========================
export const enterpriseConnectionPoolManager = EnterpriseConnectionPoolManager.getInstance()';