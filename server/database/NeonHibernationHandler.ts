// ===========================
// NEON HIBERNATION HANDLER - RECOVERY COMPLETO
// Resolver timeouts de hibernação com recovery automático
// ===========================

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { logInfo, logError, logWarn } from '../utils/logger';

interface HibernationMetrics {
  hibernationEvents: number;
  recoveryAttempts: number;
  successfulRecoveries: number;
  lastRecoveryTime?: Date;
  averageRecoveryTime: number;
  currentStatus: 'active' | 'hibernating' | 'recovering' | 'failed';
}

interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
  hibernationDetected: boolean;
}

export class NeonHibernationHandler {
  private static instance: NeonHibernationHandler;
  private metrics: HibernationMetrics = {
    hibernationEvents: 0,
    recoveryAttempts: 0,
    successfulRecoveries: 0,
    averageRecoveryTime: 0,
    currentStatus: 'active'
  };
  private healthChecks = new Map<string, ConnectionHealth>();
  private recoveryPromises = new Map<string, Promise<any>>();
  private readonly HIBERNATION_TIMEOUT = 45000; // 45s para detectar hibernação
  private readonly RECOVERY_TIMEOUT = 120000; // 2 minutos para recovery
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly HEALTH_CHECK_INTERVAL = 15000; // 15s health checks
  private healthCheckTimer?: NodeJS.Timeout;

  static getInstance(): NeonHibernationHandler {
    if (!NeonHibernationHandler.instance) {
      NeonHibernationHandler.instance = new NeonHibernationHandler();
    }
    return NeonHibernationHandler.instance;
  }

  constructor() {
    this.startHealthMonitoring();
    this.setupGlobalErrorHandlers();
  }

  // ===========================
  // DETECTION AVANÇADA DE HIBERNAÇÃO
  // ===========================
  private isHibernationError(error: any): boolean {
    const hibernationSignals = [
      'terminating connection due to administrator command',
      'connection terminated',
      'socket timeout',
      'connection closed',
      'ECONNRESET',
      'ETIMEDOUT',
      'connection lost',
      'server closed the connection unexpectedly',
      'database is hibernating'
    ];

    const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || '';
    return hibernationSignals.some(signal => errorMessage.includes(signal));
  }

  // ===========================
  // RECOVERY AUTOMÁTICO COM EXPONENTIAL BACKOFF
  // ===========================
  async handlePotentialHibernation<T>(
    operation: () => Promise<T>,
    context: string,
    connectionId: string = 'default'
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Verificar se connection está saudável antes da operação
        if (attempt > 1) {
          await this.waitForRecovery(connectionId, attempt);
        }

        const result = await this.executeWithTimeout(operation, this.HIBERNATION_TIMEOUT);
        
        // Sucesso - atualizar métricas
        if (attempt > 1) {
          this.metrics.successfulRecoveries++;
          this.metrics.averageRecoveryTime = 
            (this.metrics.averageRecoveryTime + (Date.now() - startTime)) / 2;
          this.metrics.currentStatus = 'active';
          logInfo(`Hibernation recovery successful for ${context}`, { 
            attempt, 
            recoveryTime: Date.now() - startTime,
            connectionId 
          });
        }

        this.updateConnectionHealth(connectionId, true, Date.now() - startTime);
        return result;

      } catch (error) {
        lastError = error;
        
        if (this.isHibernationError(error)) {
          this.metrics.hibernationEvents++;
          this.metrics.recoveryAttempts++;
          this.metrics.currentStatus = 'recovering';
          
          logWarn(`Hibernation detected in ${context}`, { 
            attempt, 
            error: error.message,
            connectionId 
          });

          this.updateConnectionHealth(connectionId, false, 0, true);

          if (attempt < this.MAX_RETRY_ATTEMPTS) {
            const backoffDelay = this.calculateExponentialBackoff(attempt);
            logInfo(`Attempting hibernation recovery ${attempt}/${this.MAX_RETRY_ATTEMPTS}`, { 
              backoffDelay,
              context,
              connectionId 
            });
            
            // Tentar acordar o banco antes do backoff
            await this.attemptDatabaseWakeup(connectionId);
            await this.sleep(backoffDelay);
            continue;
          }
        } else {
          // Erro não relacionado à hibernação
          this.updateConnectionHealth(connectionId, false, 0, false);
          throw error;
        }
      }
    }

    // Todas as tentativas falharam
    this.metrics.currentStatus = 'failed';
    logError(`Hibernation recovery failed after ${this.MAX_RETRY_ATTEMPTS} attempts`, lastError, { 
      context,
      connectionId,
      totalTime: Date.now() - startTime 
    });
    throw lastError;
  }

  // ===========================
  // WAKEUP PROATIVO DO BANCO
  // ===========================
  private async attemptDatabaseWakeup(connectionId: string): Promise<void> {
    try {
      logInfo(`Attempting proactive database wakeup for ${connectionId}`);
      
      // Criar nova conexão temporária para wakeup
      const wakeupPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 1,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 5000
      });

      const wakeupDb = drizzle({ client: wakeupPool });

      // Executar query simples para acordar o banco
      await Promise.race([
        wakeupDb.execute(sql`SELECT 1 as wakeup_check`),
        this.sleep(15000) // Timeout de 15s para wakeup
      ]);

      await wakeupPool.end();
      logInfo(`Database wakeup completed for ${connectionId}`);

    } catch (error) {
      logWarn(`Database wakeup failed for ${connectionId}`, { error: error.message });
      // Não é crítico se o wakeup falhar
    }
  }

  // ===========================
  // TIMEOUT PROTECTION
  // ===========================
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout - possible hibernation')), timeout)
      )
    ]);
  }

  // ===========================
  // EXPONENTIAL BACKOFF CALCULATION
  // ===========================
  private calculateExponentialBackoff(attempt: number): number {
    const baseDelay = 1000; // 1s base
    const maxDelay = 30000; // 30s max
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Adicionar jitter para evitar thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  // ===========================
  // HEALTH MONITORING CONTÍNUO
  // ===========================
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    logInfo('Neon hibernation health monitoring started');
  }

  private async performHealthChecks(): Promise<void> {
    try {
      // Health check da conexão principal
      await this.checkConnectionHealth('main', process.env.DATABASE_URL!);
      
      // Cleanup de connections que falharam muito
      this.cleanupFailedConnections();
      
    } catch (error) {
      logError('Health check failed', error);
    }
  }

  private async checkConnectionHealth(connectionId: string, connectionString: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const healthPool = new Pool({
        connectionString,
        max: 1,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 5000
      });

      const healthDb = drizzle({ client: healthPool });
      
      await Promise.race([
        healthDb.execute(sql`SELECT 1 as health_check, NOW() as server_time`),
        this.sleep(8000) // 8s timeout para health check
      ]);

      await healthPool.end();

      const latency = Date.now() - startTime;
      this.updateConnectionHealth(connectionId, true, latency, false);

    } catch (error) {
      const isHibernation = this.isHibernationError(error);
      this.updateConnectionHealth(connectionId, false, 0, isHibernation);
      
      if (isHibernation) {
        logWarn(`Hibernation detected during health check`, { connectionId, error: error.message });
      }
    }
  }

  // ===========================
  // CONNECTION HEALTH TRACKING
  // ===========================
  private updateConnectionHealth(
    connectionId: string, 
    isHealthy: boolean, 
    latency: number, 
    hibernationDetected: boolean = false
  ): void {
    const existing = this.healthChecks.get(connectionId);
    
    this.healthChecks.set(connectionId, {
      isHealthy,
      latency,
      lastCheck: new Date(),
      consecutiveFailures: isHealthy ? 0 : (existing?.consecutiveFailures || 0) + 1,
      hibernationDetected
    });
  }

  private cleanupFailedConnections(): void {
    for (const [connectionId, health] of this.healthChecks.entries()) {
      // Remove connections com muitas falhas consecutivas
      if (health.consecutiveFailures > 10) {
        logWarn(`Removing failed connection from monitoring: ${connectionId}`);
        this.healthChecks.delete(connectionId);
      }
    }
  }

  // ===========================
  // WAIT FOR RECOVERY
  // ===========================
  private async waitForRecovery(connectionId: string, attempt: number): Promise<void> {
    const recoveryKey = `${connectionId}_${attempt}`;
    
    // Evitar múltiplos recovery simultâneos
    if (this.recoveryPromises.has(recoveryKey)) {
      await this.recoveryPromises.get(recoveryKey);
      return;
    }

    const recoveryPromise = this.performRecoveryWait(connectionId, attempt);
    this.recoveryPromises.set(recoveryKey, recoveryPromise);
    
    try {
      await recoveryPromise;
    } finally {
      this.recoveryPromises.delete(recoveryKey);
    }
  }

  private async performRecoveryWait(connectionId: string, attempt: number): Promise<void> {
    const maxWaitTime = 60000; // 1 minuto máximo
    const checkInterval = 2000; // Check a cada 2s
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const health = this.healthChecks.get(connectionId);
      
      if (health?.isHealthy && !health.hibernationDetected) {
        logInfo(`Connection recovered for ${connectionId} on attempt ${attempt}`);
        return;
      }

      await this.sleep(checkInterval);
    }

    logWarn(`Recovery wait timeout for ${connectionId} on attempt ${attempt}`);
  }

  // ===========================
  // GLOBAL ERROR HANDLERS
  // ===========================
  private setupGlobalErrorHandlers(): void {
    // Interceptar uncaught exceptions relacionadas à hibernação
    const originalUncaughtException = process.listeners('uncaughtException');
    
    process.removeAllListeners('uncaughtException');
    
    process.on('uncaughtException', (error) => {
      if (this.isHibernationError(error)) {
        logWarn('Intercepted hibernation-related uncaught exception', { error: error.message });
        this.metrics.hibernationEvents++;
        
        // Não deixar o processo morrer por causa de hibernação
        return;
      }
      
      // Re-emit para handlers originais se não for hibernação
      originalUncaughtException.forEach(handler => {
        if (typeof handler === 'function') {
          handler(error);
        }
      });
    });
  }

  // ===========================
  // UTILITIES
  // ===========================
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================
  // METRICS E MONITORING
  // ===========================
  getMetrics(): HibernationMetrics & { connections: Array<{ id: string; health: ConnectionHealth }> } {
    return {
      ...this.metrics,
      connections: Array.from(this.healthChecks.entries()).map(([id, health]) => ({ id, health }))
    };
  }

  getConnectionHealth(connectionId: string): ConnectionHealth | undefined {
    return this.healthChecks.get(connectionId);
  }

  isSystemHealthy(): boolean {
    const unhealthyConnections = Array.from(this.healthChecks.values())
      .filter(health => !health.isHealthy || health.hibernationDetected);
    
    return unhealthyConnections.length === 0 && this.metrics.currentStatus !== 'failed';
  }

  // ===========================
  // SHUTDOWN
  // ===========================
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthChecks.clear();
    this.recoveryPromises.clear();
    
    logInfo('Neon hibernation handler shutdown completed');
  }
}

// ===========================
// WRAPPER FUNCTIONS FOR EASY USAGE
// ===========================
export const withHibernationHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  connectionId?: string
): Promise<T> => {
  const handler = NeonHibernationHandler.getInstance();
  return handler.handlePotentialHibernation(operation, context, connectionId);
};

export const neonHibernationHandler = NeonHibernationHandler.getInstance();