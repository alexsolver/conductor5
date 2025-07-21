/**
 * Vite Connection Optimizer
 * Optimizes Vite development server connections and WebSocket stability
 */

import { logInfo, logError, logWarn } from './logger';
import { Server } from 'http';

export interface ViteOptimizationConfig {
  enableWebSocketStabilization: boolean;
  connectionTimeout: number;
  maxRetries: number;
  retryDelay: number;
  pingInterval: number;
  enableCompression: boolean;
}

const DEFAULT_CONFIG: ViteOptimizationConfig = {
  enableWebSocketStabilization: true,
  connectionTimeout: 60000, // 1 minute
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  pingInterval: 30000, // 30 seconds
  enableCompression: true
};

export class ViteConnectionOptimizer {
  private config: ViteOptimizationConfig;
  private pingInterval: NodeJS.Timeout | null = null;
  private connections: Map<string, any> = new Map();

  constructor(config: Partial<ViteOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public initialize(server: Server): void {
    try {
      logInfo('Initializing Vite connection optimizer...');

      if (this.config.enableWebSocketStabilization) {
        this.setupWebSocketStabilization(server);
      }

      this.setupConnectionMonitoring(server);

      if (this.config.pingInterval > 0) {
        this.startPingInterval();
      }

      logInfo('Vite connection optimizer initialized successfully');
    } catch (error) {
      logError('Failed to initialize Vite connection optimizer', error);
    }
  }

  private setupWebSocketStabilization(server: Server): void {
    server.on('upgrade', (request, socket, head) => {
      const connectionId = this.generateConnectionId();
      
      // Configure socket for better stability
      socket.setKeepAlive(true, this.config.pingInterval);
      socket.setTimeout(this.config.connectionTimeout);
      socket.setNoDelay(true);

      // Store connection
      this.connections.set(connectionId, {
        socket,
        lastActivity: Date.now(),
        retryCount: 0
      });

      socket.on('error', (error) => {
        logWarn(`WebSocket error for connection ${connectionId}:`, error.message);
        this.handleConnectionError(connectionId, error);
      });

      socket.on('close', () => {
        this.connections.delete(connectionId);
        logInfo(`WebSocket connection ${connectionId} closed`);
      });

      socket.on('timeout', () => {
        logWarn(`WebSocket connection ${connectionId} timed out`);
        this.handleConnectionTimeout(connectionId);
      });
    });
  }

  private setupConnectionMonitoring(server: Server): void {
    server.on('connection', (socket) => {
      const connectionId = this.generateConnectionId();

      // Apply optimizations to HTTP connections as well
      socket.setKeepAlive(true, this.config.pingInterval);
      socket.setTimeout(this.config.connectionTimeout);
      socket.setNoDelay(true);

      // Increase max listeners to prevent memory leak warnings
      socket.setMaxListeners(20);

      socket.on('error', (error) => {
        if (!this.isIgnorableError(error)) {
          logWarn(`HTTP connection error for ${connectionId}:`, error.message);
        }
      });

      socket.on('close', () => {
        // Clean close, no logging needed
      });
    });
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.pingInterval);
  }

  private performHealthCheck(): void {
    const now = Date.now();
    const staleConnections: string[] = [];

    this.connections.forEach((connection, id) => {
      if (now - connection.lastActivity > this.config.connectionTimeout) {
        staleConnections.push(id);
      }
    });

    // Clean up stale connections
    staleConnections.forEach(id => {
      const connection = this.connections.get(id);
      if (connection) {
        logInfo(`Cleaning up stale connection ${id}`);
        connection.socket.destroy();
        this.connections.delete(id);
      }
    });

    if (staleConnections.length > 0) {
      logInfo(`Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  private handleConnectionError(connectionId: string, error: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.retryCount++;

    if (connection.retryCount <= this.config.maxRetries) {
      setTimeout(() => {
        if (this.connections.has(connectionId)) {
          logInfo(`Attempting to recover connection ${connectionId} (attempt ${connection.retryCount})`);
          // Connection recovery logic would go here
        }
      }, this.config.retryDelay * connection.retryCount);
    } else {
      logWarn(`Connection ${connectionId} exceeded max retries, removing`);
      this.connections.delete(connectionId);
    }
  }

  private handleConnectionTimeout(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.socket.destroy();
      this.connections.delete(connectionId);
    }
  }

  private generateConnectionId(): string {
    return `vite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isIgnorableError(error: any): boolean {
    const ignorableCodes = ['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNABORTED];
    return ignorableCodes.includes(error.code);
  }

  public getConnectionStats(): {
    activeConnections: number;
    totalConnections: number;
    averageRetries: number;
  } {
    let totalRetries = 0;
    const activeConnections = this.connections.size;

    this.connections.forEach(connection => {
      totalRetries += connection.retryCount;
    });

    return {
      activeConnections,
      totalConnections: activeConnections,
      averageRetries: activeConnections > 0 ? totalRetries / activeConnections : 0
    };
  }

  public destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all connections
    this.connections.forEach((connection, id) => {
      connection.socket.destroy();
    });

    this.connections.clear();
    logInfo('Vite connection optimizer destroyed');
  }
}

// Export singleton instance
let optimizer: ViteConnectionOptimizer | null = null;

export function initializeViteOptimizer(server: Server, config?: Partial<ViteOptimizationConfig>): ViteConnectionOptimizer {
  if (optimizer) {
    optimizer.destroy();
  }

  optimizer = new ViteConnectionOptimizer(config);
  optimizer.initialize(server);
  return optimizer;
}

export function getViteOptimizer(): ViteConnectionOptimizer | null {
  return optimizer;
}