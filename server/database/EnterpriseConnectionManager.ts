// ===========================
// ENTERPRISE CONNECTION MANAGER
// Resolver problemas de pool sizing e hibernação Neon
// ===========================

import { Pool } from '@neondatabase/serverless';

interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
  createTimeoutMs: number;
  maxUses: number;
}

interface TenantPoolMetrics {
  tenantId: string;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalConnects: number;
  totalErrors: number;
  avgConnectionTime: number;
  lastError?: string;
  lastErrorTime?: Date;
}

export class EnterpriseConnectionManager {
  private static instance: EnterpriseConnectionManager;
  private tenantPools = new Map<string, Pool>();
  private poolMetrics = new Map<string, TenantPoolMetrics>();
  private mainPool: Pool;
  
  // CONFIGURAÇÃO ENTERPRISE OTIMIZADA PARA NEON
  private readonly enterpriseConfig: ConnectionPoolConfig = {
    maxConnections: 15,        // Otimizado para Neon limits
    minConnections: 3,         // Reduzido para eficiência
    idleTimeoutMs: 300000,     // 5 minutos
    acquireTimeoutMs: 60000,   // 1 minuto timeout
    createTimeoutMs: 30000,    // 30s para criar conexão
    maxUses: 7500              // Recycle connection após uses
  };

  // CONFIGURAÇÃO PER-TENANT OTIMIZADA
  private readonly tenantConfig: ConnectionPoolConfig = {
    maxConnections: 8,         // Otimizado para Neon serverless
    minConnections: 1,         // Mínimo reduzido para eficiência
    idleTimeoutMs: 600000,     // 10 minutos para tenant pools
    acquireTimeoutMs: 45000,   // 45s timeout
    createTimeoutMs: 25000,    // 25s para criar
    maxUses: 5000              // Recycle mais cedo para tenants
  };

  private hibernationRecoveryActive = false;
  private reconnectionAttempts = new Map<string, number>();

  static getInstance(): EnterpriseConnectionManager {
    if (!EnterpriseConnectionManager.instance) {
      EnterpriseConnectionManager.instance = new EnterpriseConnectionManager();
    }
    return EnterpriseConnectionManager.instance;
  }

  constructor() {
    this.initializeMainPool();
    this.setupHibernationHandling();
    this.startConnectionMonitoring();
  }

  // ===========================
  // INICIALIZAÇÃO DE POOLS
  // ===========================
  private initializeMainPool(): void {
    console.log('[EnterpriseConnectionManager] Initializing main pool with enterprise configuration...');
    
    this.mainPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: this.enterpriseConfig.maxConnections,
      min: this.enterpriseConfig.minConnections,
      idleTimeoutMillis: this.enterpriseConfig.idleTimeoutMs,
      acquireTimeoutMillis: this.enterpriseConfig.acquireTimeoutMs,
      createTimeoutMillis: this.enterpriseConfig.createTimeoutMs,
      maxUses: this.enterpriseConfig.maxUses,
      
      // ENTERPRISE OPTIMIZATIONS
      allowExitOnIdle: false,    // Keep pool alive
      keepAlive: true,           // TCP keepalive
      keepAliveInitialDelayMillis: 10000,
    });

    // Error handling for main pool
    this.mainPool.on('error', (err) => {
      console.error('[EnterpriseConnectionManager] Main pool error:', err);
      this.handleConnectionError('main', err);
    });

    console.log(`✅ Main pool initialized with ${this.enterpriseConfig.maxConnections} max connections`);
  }

  // ===========================
  // TENANT POOL MANAGEMENT
  // ===========================
  getTenantPool(tenantId: string): Pool {
    if (!this.tenantPools.has(tenantId)) {
      this.createTenantPool(tenantId);
    }
    return this.tenantPools.get(tenantId)!;
  }

  private createTenantPool(tenantId: string): void {
    console.log(`[EnterpriseConnectionManager] Creating pool for tenant: ${tenantId}`);
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: this.tenantConfig.maxConnections,
      min: this.tenantConfig.minConnections,
      idleTimeoutMillis: this.tenantConfig.idleTimeoutMs,
      acquireTimeoutMillis: this.tenantConfig.acquireTimeoutMs,
      createTimeoutMillis: this.tenantConfig.createTimeoutMs,
      maxUses: this.tenantConfig.maxUses,
      
      // PER-TENANT OPTIMIZATIONS
      allowExitOnIdle: true,     // Allow tenant pools to idle out
      keepAlive: true,
      keepAliveInitialDelayMillis: 15000,
    });

    // Error handling per tenant
    pool.on('error', (err) => {
      console.error(`[EnterpriseConnectionManager] Tenant ${tenantId} pool error:`, err);
      this.handleConnectionError(tenantId, err);
    });

    this.tenantPools.set(tenantId, pool);
    this.initializeTenantMetrics(tenantId);
    
    console.log(`✅ Tenant pool created for ${tenantId} with ${this.tenantConfig.maxConnections} max connections`);
  }

  // ===========================
  // HIBERNAÇÃO NEON RECOVERY
  // ===========================
  private setupHibernationHandling(): void {
    console.log('[EnterpriseConnectionManager] Setting up Neon hibernation recovery...');
    
    // Handle process-level uncaught exceptions from Neon hibernation
    process.on('uncaughtException', (error) => {
      if (error.message.includes('terminating connection due to administrator command')) {
        console.warn('[HibernationRecovery] Neon hibernation detected, initiating recovery...');
        this.handleHibernationRecovery();
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      if (reason?.message?.includes('terminating connection')) {
        console.warn('[HibernationRecovery] Hibernation rejection detected...');
        this.handleHibernationRecovery();
      }
    });
  }

  private async handleHibernationRecovery(): Promise<void> {
    if (this.hibernationRecoveryActive) {
      console.log('[HibernationRecovery] Recovery already in progress, skipping...');
      return;
    }

    this.hibernationRecoveryActive = true;
    console.log('[HibernationRecovery] Starting hibernation recovery process...');

    try {
      // Wait for potential hibernation to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test main pool connectivity
      await this.testPoolConnectivity(this.mainPool, 'main');

      // Test tenant pools
      for (const [tenantId, pool] of this.tenantPools.entries()) {
        await this.testPoolConnectivity(pool, tenantId);
      }

      console.log('✅ [HibernationRecovery] All pools recovered successfully');
    } catch (error) {
      console.error('[HibernationRecovery] Recovery failed:', error);
    } finally {
      this.hibernationRecoveryActive = false;
    }
  }

  private async testPoolConnectivity(pool: Pool, identifier: string): Promise<void> {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`✅ [HibernationRecovery] Pool ${identifier} connectivity restored`);
    } catch (error) {
      console.error(`❌ [HibernationRecovery] Pool ${identifier} still has issues:`, error);
      throw error;
    }
  }

  // ===========================
  // ERROR HANDLING
  // ===========================
  private handleConnectionError(poolId: string, error: any): void {
    const currentAttempts = this.reconnectionAttempts.get(poolId) || 0;
    this.reconnectionAttempts.set(poolId, currentAttempts + 1);

    // Update metrics if tenant pool
    if (poolId !== 'main') {
      const metrics = this.poolMetrics.get(poolId);
      if (metrics) {
        metrics.totalErrors++;
        metrics.lastError = error.message;
        metrics.lastErrorTime = new Date();
      }
    }

    // Exponential backoff for reconnection
    const backoffMs = Math.min(1000 * Math.pow(2, currentAttempts), 30000);
    
    console.warn(`[ConnectionError] Pool ${poolId} error (attempt ${currentAttempts + 1}), retrying in ${backoffMs}ms`);

    setTimeout(() => {
      this.attemptPoolRecovery(poolId);
    }, backoffMs);
  }

  private async attemptPoolRecovery(poolId: string): Promise<void> {
    try {
      if (poolId === 'main') {
        await this.testPoolConnectivity(this.mainPool, 'main');
      } else {
        const pool = this.tenantPools.get(poolId);
        if (pool) {
          await this.testPoolConnectivity(pool, poolId);
        }
      }
      
      // Reset attempts on successful recovery
      this.reconnectionAttempts.set(poolId, 0);
      console.log(`✅ [PoolRecovery] Pool ${poolId} recovered`);
    } catch (error) {
      console.error(`❌ [PoolRecovery] Pool ${poolId} recovery failed:`, error);
    }
  }

  // ===========================
  // MÉTRICAS E MONITORAMENTO
  // ===========================
  private initializeTenantMetrics(tenantId: string): void {
    this.poolMetrics.set(tenantId, {
      tenantId,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalConnects: 0,
      totalErrors: 0,
      avgConnectionTime: 0
    });
  }

  private startConnectionMonitoring(): void {
    setInterval(() => {
      this.updatePoolMetrics();
      this.logPoolStatus();
    }, 30000); // Every 30 seconds

    console.log('✅ [EnterpriseConnectionManager] Connection monitoring started');
  }

  private updatePoolMetrics(): void {
    for (const [tenantId, pool] of this.tenantPools.entries()) {
      const metrics = this.poolMetrics.get(tenantId);
      if (metrics) {
        // Update metrics from pool internals if available
        metrics.activeConnections = (pool as any).totalCount || 0;
        metrics.idleConnections = (pool as any).idleCount || 0;
        metrics.waitingClients = (pool as any).waitingCount || 0;
      }
    }
  }

  private logPoolStatus(): void {
    const mainPoolInfo = {
      totalCount: (this.mainPool as any).totalCount || 0,
      idleCount: (this.mainPool as any).idleCount || 0,
      waitingCount: (this.mainPool as any).waitingCount || 0
    };

    // Only log if there are active connections or issues
    if (mainPoolInfo.totalCount > 0 || mainPoolInfo.waitingCount > 0) {
      console.log(`[PoolStatus] Main: ${mainPoolInfo.totalCount} total, ${mainPoolInfo.idleCount} idle, ${mainPoolInfo.waitingCount} waiting`);
    }

    // Log tenant pool summary
    const tenantSummary = Array.from(this.poolMetrics.values()).reduce((acc, metrics) => {
      acc.totalActive += metrics.activeConnections;
      acc.totalIdle += metrics.idleConnections;
      acc.totalWaiting += metrics.waitingClients;
      return acc;
    }, { totalActive: 0, totalIdle: 0, totalWaiting: 0 });

    if (this.tenantPools.size > 0) {
      console.log(`[PoolStatus] Tenants (${this.tenantPools.size}): ${tenantSummary.totalActive} active, ${tenantSummary.totalIdle} idle, ${tenantSummary.totalWaiting} waiting`);
    }
  }

  // ===========================
  // PUBLIC API
  // ===========================
  getMainPool(): Pool {
    return this.mainPool;
  }

  getTenantMetrics(tenantId: string): TenantPoolMetrics | undefined {
    return this.poolMetrics.get(tenantId);
  }

  getAllMetrics(): Map<string, TenantPoolMetrics> {
    return new Map(this.poolMetrics);
  }

  async closeAllPools(): Promise<void> {
    console.log('[EnterpriseConnectionManager] Closing all pools...');
    
    // Close tenant pools
    for (const [tenantId, pool] of this.tenantPools.entries()) {
      try {
        await pool.end();
        console.log(`✅ Closed pool for tenant: ${tenantId}`);
      } catch (error) {
        console.error(`❌ Error closing pool for tenant ${tenantId}:`, error);
      }
    }

    // Close main pool
    try {
      await this.mainPool.end();
      console.log('✅ Main pool closed');
    } catch (error) {
      console.error('❌ Error closing main pool:', error);
    }

    this.tenantPools.clear();
    this.poolMetrics.clear();
  }

  // ===========================
  // HEALTH CHECK
  // ===========================
  async healthCheck(): Promise<{
    healthy: boolean;
    mainPool: boolean;
    tenantPools: Array<{ tenantId: string; healthy: boolean }>;
    totalPools: number;
  }> {
    const results = {
      healthy: true,
      mainPool: false,
      tenantPools: [] as Array<{ tenantId: string; healthy: boolean }>,
      totalPools: this.tenantPools.size + 1
    };

    // Test main pool
    try {
      await this.testPoolConnectivity(this.mainPool, 'main');
      results.mainPool = true;
    } catch (error) {
      results.healthy = false;
    }

    // Test tenant pools
    for (const [tenantId, pool] of this.tenantPools.entries()) {
      try {
        await this.testPoolConnectivity(pool, tenantId);
        results.tenantPools.push({ tenantId, healthy: true });
      } catch (error) {
        results.tenantPools.push({ tenantId, healthy: false });
        results.healthy = false;
      }
    }

    return results;
  }
}

// ===========================
// EXPORTAÇÃO SINGLETON
// ===========================
export const enterpriseConnectionManager = EnterpriseConnectionManager.getInstance();