/**
 * Production Initializer
 * Handles production environment setup and initialization
 */

import { logInfo, logError } from './logger';
import { connectionStabilizer } from './connectionStabilizer';
import { Server } from 'http';

export interface ProductionConfig {
  enableMonitoring: boolean;
  enableHealthChecks: boolean;
  enablePerformanceTracking: boolean;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: ProductionConfig = {
  enableMonitoring: true,
  enableHealthChecks: true,
  enablePerformanceTracking: true,
  cleanupInterval: 300000 // 5 minutes
};

export class ProductionInitializer {
  private config: ProductionConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ProductionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async initialize(server: Server): Promise<void> {
    try {
      logInfo('Initializing production environment...');

      // Initialize connection stabilizer
      if (this.config.enableMonitoring) {
        connectionStabilizer.initialize(server);
        logInfo('Connection stabilizer initialized');
      }

      // Setup health checks
      if (this.config.enableHealthChecks) {
        this.setupHealthChecks();
        logInfo('Health checks initialized');
      }

      // Setup cleanup processes
      this.setupCleanupProcesses();
      logInfo('Cleanup processes initialized');

      // Setup performance tracking
      if (this.config.enablePerformanceTracking) {
        this.setupPerformanceTracking();
        logInfo('Performance tracking initialized');
      }

      logInfo('Production environment initialization completed successfully');
    } catch (error) {
      logError('Failed to initialize production environment', error);
      throw error;
    }
  }

  private setupHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
  }

  private performHealthCheck(): void {
    try {
      const stats = connectionStabilizer.getStats();
      const memoryUsage = process.memoryUsage();
      
      // Log health metrics
      logInfo('Health check', {
        connections: stats,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        },
        uptime: Math.round(process.uptime()) + 's'
      });

      // Check for memory leaks
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        logError('High memory usage detected', {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB'
        });
      }
    } catch (error) {
      logError('Health check failed', error);
    }
  }

  private setupCleanupProcesses(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);

    // Cleanup on process exit
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  private performCleanup(): void {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logInfo('Garbage collection performed');
      }

      // Reset connection stats periodically
      connectionStabilizer.resetStats();
    } catch (error) {
      logError('Cleanup process failed', error);
    }
  }

  private setupPerformanceTracking(): void {
    // Track process performance metrics
    const startTime = process.hrtime.bigint();
    
    setInterval(() => {
      const currentTime = process.hrtime.bigint();
      const uptimeMs = Number(currentTime - startTime) / 1000000;
      
      logInfo('Performance metrics', {
        uptime: Math.round(uptimeMs / 1000) + 's',
        connections: connectionStabilizer.getStats().active,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      });
    }, 300000); // Every 5 minutes
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logInfo(`Received ${signal}, starting graceful shutdown...`);

    try {
      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // Cleanup connection stabilizer
      connectionStabilizer.destroy();

      logInfo('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logError('Error during graceful shutdown', error);
      process.exit(1);
    }
  }

  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
let initializer: ProductionInitializer | null = null;

export function initializeProduction(server: Server, config?: Partial<ProductionConfig>): Promise<void> {
  if (initializer) {
    initializer.destroy();
  }
  
  initializer = new ProductionInitializer(config);
  return initializer.initialize(server);
}

export function getProductionInitializer(): ProductionInitializer | null {
  return initializer;
}