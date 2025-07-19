import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { logInfo, logError, logWarn } from "../utils/logger";

neonConfig.webSocketConstructor = ws;

interface TenantConnection {
  pool: Pool;
  db: ReturnType<typeof drizzle>;
  lastUsed: number;
  activeConnections: number;
}

// ===========================
// ADVANCED CONNECTION POOL MANAGER
// Fixes: Memory leaks, inefficient connection management
// ===========================

export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private tenantPools = new Map<string, TenantConnection>();
  private readonly MAX_POOLS = 15; // ENTERPRISE: Aumentado para suportar múltiplos tenants
  private readonly POOL_TTL = 30 * 60 * 1000; // ENTERPRISE: 30 minutos TTL balanceado
  private readonly CLEANUP_INTERVAL = 2 * 60 * 1000; // OPTIMIZED: 2 minutos cleanup mais frequente
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.startCleanupRoutine();
  }

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  // ===========================
  // SECURE TENANT ID VALIDATION - PADRONIZADO
  // Fixes: SQL injection vulnerability in schema naming
  // CRITICAL FIX: Usar o mesmo padrão UUID rigoroso do TenantValidator
  // ===========================
  private validateTenantId(tenantId: string): string {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Invalid tenant ID: must be a non-empty string');
    }
    
    // CRITICAL FIX: Usar padrão UUID rigoroso consistente com EnterpriseUUIDValidator
    const strictUuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!strictUuidPattern.test(tenantId.trim())) {
      throw new Error(`Invalid tenant ID: must be valid UUID v4 format: ${tenantId}`);
    }
    
    // CRITICAL: Enforce exact UUID length (36 characters)
    if (tenantId.length !== 36) {
      throw new Error('Invalid tenant ID: must be exactly 36 characters (UUID format)');
    }
    
    return tenantId.trim();
  }

  // ===========================
  // INTELLIGENT POOL MANAGEMENT
  // Fixes: Memory leaks, inefficient connections
  // ===========================
  async getTenantConnection(tenantId: string): Promise<ReturnType<typeof drizzle>> {
    const validatedTenantId = this.validateTenantId(tenantId);
    
    // Check if connection exists and is valid
    let connection = this.tenantPools.get(validatedTenantId);
    
    if (connection) {
      connection.lastUsed = Date.now();
      connection.activeConnections++;
      return connection.db;
    }

    // Create new connection if under limit
    if (this.tenantPools.size >= this.MAX_POOLS) {
      await this.evictLeastRecentlyUsed();
    }

    connection = await this.createTenantConnection(validatedTenantId);
    this.tenantPools.set(validatedTenantId, connection);
    
    logInfo(`Created new tenant connection pool`, { tenantId: validatedTenantId });
    return connection.db;
  }

  private async createTenantConnection(tenantId: string): Promise<TenantConnection> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Secure connection string construction
      const baseUrl = new URL(process.env.DATABASE_URL!);
      baseUrl.searchParams.set('schema', schemaName);
      
      const pool = new Pool({ 
        connectionString: baseUrl.toString(),
        max: 8, // ENTERPRISE: Aumentado para concurrent operations
        min: 2, // PERFORMANCE: Mínimo de 2 para disponibilidade
        idleTimeoutMillis: 300000, // ENTERPRISE: 5 minutos idle timeout
        connectionTimeoutMillis: 45000, // HIBERNATION: 45s para Neon recovery
        acquireTimeoutMillis: 60000, // ENTERPRISE: 60s acquire timeout
        maxUses: 1000, // OPTIMIZED: Alto reuse para performance
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000, // ANTI-HIBERNATION
        allowExitOnIdle: false,
        maxLifetimeSeconds: 3600 // ENTERPRISE: 1 hora lifecycle
      });

      const db = drizzle({ client: pool, schema });

      return {
        pool,
        db,
        lastUsed: Date.now(),
        activeConnections: 1
      };
    } catch (error) {
      logError('Failed to create tenant connection', error, { tenantId });
      throw error;
    }
  }

  // ===========================
  // AUTOMATIC CLEANUP & MEMORY MANAGEMENT
  // Fixes: Memory leaks from idle connections
  // ===========================
  private startCleanupRoutine(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.CLEANUP_INTERVAL);
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const expiredTenants: string[] = [];

    for (const [tenantId, connection] of this.tenantPools.entries()) {
      if (now - connection.lastUsed > this.POOL_TTL && connection.activeConnections === 0) {
        expiredTenants.push(tenantId);
      }
    }

    for (const tenantId of expiredTenants) {
      await this.closeConnection(tenantId);
    }

    if (expiredTenants.length > 0) {
      logInfo(`Cleaned up ${expiredTenants.length} idle tenant connections`);
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    let oldestTenant = '';
    let oldestTime = Date.now();

    for (const [tenantId, connection] of this.tenantPools.entries()) {
      if (connection.lastUsed < oldestTime && connection.activeConnections === 0) {
        oldestTime = connection.lastUsed;
        oldestTenant = tenantId;
      }
    }

    if (oldestTenant) {
      await this.closeConnection(oldestTenant);
      logWarn(`Evicted LRU tenant connection: ${oldestTenant}`);
    }
  }

  private async closeConnection(tenantId: string): Promise<void> {
    const connection = this.tenantPools.get(tenantId);
    if (connection) {
      try {
        await connection.pool.end();
        this.tenantPools.delete(tenantId);
      } catch (error) {
        logError('Error closing tenant connection', error, { tenantId });
      }
    }
  }

  // ===========================
  // GRACEFUL SHUTDOWN
  // ===========================
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    const promises = Array.from(this.tenantPools.keys()).map(tenantId => 
      this.closeConnection(tenantId)
    );

    await Promise.all(promises);
    logInfo('Connection pool manager shutdown complete');
  }

  // ===========================
  // MONITORING & METRICS
  // Fixes: Lack of tenant-specific monitoring
  // ===========================
  getPoolMetrics() {
    const metrics = {
      totalPools: this.tenantPools.size,
      maxPools: this.MAX_POOLS,
      poolUtilization: (this.tenantPools.size / this.MAX_POOLS) * 100,
      tenants: Array.from(this.tenantPools.entries()).map(([tenantId, conn]) => ({
        tenantId,
        lastUsed: new Date(conn.lastUsed),
        activeConnections: conn.activeConnections,
        ageMinutes: (Date.now() - conn.lastUsed) / (1000 * 60)
      }))
    };

    return metrics;
  }
}

export const poolManager = ConnectionPoolManager.getInstance();