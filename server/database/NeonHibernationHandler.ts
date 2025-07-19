import { sql } from 'drizzle-orm';
import { db, pool } from '../db';

// ===========================
// NEON HIBERNATION RECOVERY SYSTEM
// Sistema robusto para lidar com hibernação e reconexão do Neon PostgreSQL
// ===========================

export class NeonHibernationHandler {
  private static instance: NeonHibernationHandler;
  private reconnectAttempts = new Map<string, number>();
  private lastHibernationCheck = Date.now();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY_BASE = 1000; // 1 segundo base
  private readonly HIBERNATION_CHECK_INTERVAL = 30000; // 30 segundos

  static getInstance(): NeonHibernationHandler {
    if (!NeonHibernationHandler.instance) {
      NeonHibernationHandler.instance = new NeonHibernationHandler();
    }
    return NeonHibernationHandler.instance;
  }

  // HIBERNATION DETECTION: Detectar quando Neon está hibernando
  async detectHibernation(): Promise<boolean> {
    try {
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      const duration = Date.now() - start;
      
      // Se a query demorar mais que 5 segundos, provavelmente hibernação
      return duration > 5000;
    } catch (error: any) {
      const hibernationErrors = [
        'terminating connection due to administrator command',
        'connection terminated',
        'connection lost',
        'server closed the connection unexpectedly',
        'timeout'
      ];
      
      return hibernationErrors.some(errorPattern => 
        error.message?.toLowerCase().includes(errorPattern)
      );
    }
  }

  // ROBUST RECONNECTION: Sistema de reconexão com backoff exponencial
  async attemptReconnection(operationId: string = 'default'): Promise<boolean> {
    const attempts = this.reconnectAttempts.get(operationId) || 0;
    
    if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error(`[HibernationHandler] Max reconnection attempts reached for ${operationId}`);
      this.reconnectAttempts.delete(operationId);
      return false;
    }

    try {
      console.log(`[HibernationHandler] Reconnection attempt ${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS} for ${operationId}`);
      
      // Exponential backoff delay
      const delay = this.RECONNECT_DELAY_BASE * Math.pow(2, attempts);
      await this.sleep(delay);

      // Test connection with simple query
      await db.execute(sql`SELECT 1 as health_check`);
      
      console.log(`[HibernationHandler] ✅ Reconnection successful for ${operationId}`);
      this.reconnectAttempts.delete(operationId);
      return true;
    } catch (error) {
      console.warn(`[HibernationHandler] Reconnection attempt ${attempts + 1} failed:`, error);
      this.reconnectAttempts.set(operationId, attempts + 1);
      return false;
    }
  }

  // EXECUTE WITH HIBERNATION HANDLING: Wrapper para operações críticas
  async executeWithHibernationHandling<T>(
    operation: () => Promise<T>,
    operationId: string = 'query'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`[HibernationHandler] Operation ${operationId} failed, checking hibernation...`);
      
      const isHibernation = await this.detectHibernation();
      
      if (isHibernation) {
        console.log(`[HibernationHandler] Hibernation detected, attempting recovery...`);
        
        const reconnected = await this.attemptReconnection(operationId);
        
        if (reconnected) {
          console.log(`[HibernationHandler] Retrying operation ${operationId} after reconnection...`);
          return await operation();
        } else {
          throw new Error(`Failed to recover from hibernation for operation: ${operationId}`);
        }
      } else {
        // Not hibernation, re-throw original error
        throw error;
      }
    }
  }

  // CONNECTION HEALTH MONITORING: Monitoramento proativo
  async startHealthMonitoring(): Promise<void> {
    setInterval(async () => {
      try {
        const now = Date.now();
        
        // Skip if checked recently
        if (now - this.lastHibernationCheck < this.HIBERNATION_CHECK_INTERVAL) {
          return;
        }

        this.lastHibernationCheck = now;
        
        // Proactive health check
        const isHealthy = await this.performHealthCheck();
        
        if (!isHealthy) {
          console.warn('[HibernationHandler] Health check failed, attempting preemptive reconnection...');
          await this.attemptReconnection('health-check');
        }
      } catch (error) {
        console.error('[HibernationHandler] Health monitoring error:', error);
      }
    }, this.HIBERNATION_CHECK_INTERVAL);

    console.log('[HibernationHandler] Health monitoring started');
  }

  // HEALTH CHECK: Verificação de saúde da conexão
  private async performHealthCheck(): Promise<boolean> {
    try {
      const start = Date.now();
      const result = await db.execute(sql`
        SELECT 
          current_timestamp as db_time,
          pg_backend_pid() as connection_pid,
          version() as postgres_version
      `);
      
      const duration = Date.now() - start;
      
      // Health check passed if query completes in reasonable time
      const isHealthy = duration < 3000 && result.rows.length > 0;
      
      if (isHealthy) {
        console.log(`[HibernationHandler] Health check passed (${duration}ms)`);
      } else {
        console.warn(`[HibernationHandler] Health check slow or failed (${duration}ms)`);
      }
      
      return isHealthy;
    } catch (error) {
      console.error('[HibernationHandler] Health check failed:', error);
      return false;
    }
  }

  // CONNECTION POOL HEALTH: Monitorar saúde do pool
  async checkPoolHealth(): Promise<void> {
    try {
      const poolInfo = {
        totalCount: (pool as any).totalCount || 0,
        idleCount: (pool as any).idleCount || 0,
        waitingCount: (pool as any).waitingCount || 0
      };

      console.log('[HibernationHandler] Pool status:', poolInfo);

      // Alert if pool is struggling
      if (poolInfo.waitingCount > 5) {
        console.warn('[HibernationHandler] High pool waiting count detected:', poolInfo.waitingCount);
      }

      if (poolInfo.totalCount > 20) {
        console.warn('[HibernationHandler] High pool connection count:', poolInfo.totalCount);
      }
    } catch (error) {
      console.error('[HibernationHandler] Failed to check pool health:', error);
    }
  }

  // UTILITY: Sleep function
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // CLEANUP: Reset reconnection attempts
  clearReconnectionAttempts(): void {
    this.reconnectAttempts.clear();
    console.log('[HibernationHandler] Reconnection attempts cleared');
  }
}

export const hibernationHandler = NeonHibernationHandler.getInstance();