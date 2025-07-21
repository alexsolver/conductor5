/**
 * Vite Stabilizer
 * Enhanced stability for Vite development server
 */

import { logInfo, logError, logWarn } from './logger';
import { Server } from 'http';

export class ViteStabilizer {
  private static instance: ViteStabilizer | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionMap: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ViteStabilizer {
    if (!ViteStabilizer.instance) {
      ViteStabilizer.instance = new ViteStabilizer();
    }
    return ViteStabilizer.instance;
  }

  public initialize(server: Server): void {
    try {
      logInfo('Initializing Vite stabilizer...');

      this.setupConnectionHandling(server);
      this.startHealthChecks();
      this.setupPingMechanism();

      logInfo('Vite stabilizer initialized successfully');
    } catch (error) {
      logError('Failed to initialize Vite stabilizer', error);
    }
  }

  private setupConnectionHandling(server: Server): void {
    server.on('connection', (socket) => {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Configure socket for stability
      socket.setKeepAlive(true, 30000);
      socket.setTimeout(120000);
      socket.setNoDelay(true);
      socket.setMaxListeners(20);

      this.connectionMap.set(connectionId, {
        socket,
        created: Date.now(),
        lastActivity: Date.now()
      });

      socket.on('error', (error) => {
        if (!this.isIgnorableError(error)) {
          logWarn(`Socket error for ${connectionId}:`, { error: error.message });
        }
        this.connectionMap.delete(connectionId);
      });

      socket.on('close', () => {
        this.connectionMap.delete(connectionId);
      });

      socket.on('data', () => {
        const connection = this.connectionMap.get(connectionId);
        if (connection) {
          connection.lastActivity = Date.now();
        }
      });
    });

    server.on('upgrade', (request, socket, head) => {
      const upgradeId = `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Apply socket configuration only if methods exist
      if (typeof socket.setKeepAlive === 'function') {
        socket.setKeepAlive(true, 30000);
      }
      if (typeof socket.setTimeout === 'function') {
        socket.setTimeout(120000);
      }
      if (typeof socket.setNoDelay === 'function') {
        socket.setNoDelay(true);
      }

      socket.on('error', (error) => {
        if (!this.isIgnorableError(error)) {
          logWarn(`WebSocket upgrade error for ${upgradeId}:`, { error: error.message });
        }
      });
    });
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  private setupPingMechanism(): void {
    this.pingInterval = setInterval(() => {
      this.performPingCheck();
    }, 30000); // Every 30 seconds
  }

  private performHealthCheck(): void {
    const now = Date.now();
    const activeConnections = this.connectionMap.size;
    let staleConnections = 0;

    this.connectionMap.forEach((connection, id) => {
      if (now - connection.lastActivity > 120000) { // 2 minutes
        staleConnections++;
        connection.socket.destroy();
        this.connectionMap.delete(id);
      }
    });

    if (staleConnections > 0) {
      logInfo(`Health check: cleaned ${staleConnections} stale connections`);
    }

    logInfo('Vite health check', {
      activeConnections: this.connectionMap.size,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
  }

  private performPingCheck(): void {
    // Ping mechanism for active connections
    let activePings = 0;
    
    this.connectionMap.forEach((connection) => {
      if (connection.socket.readable && connection.socket.writable) {
        activePings++;
      }
    });

    if (activePings > 0) {
      logInfo(`Ping check: ${activePings} active connections`);
    }
  }

  private isIgnorableError(error: any): boolean {
    const ignorableCodes = ['
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'ECONNABORTED',
      'ENOTFOUND',
      'ENETUNREACH'
    ];
    return ignorableCodes.includes(error.code);
  }

  public getStats(): {
    activeConnections: number;
    totalProcessed: number;
    uptime: number;
  } {
    return {
      activeConnections: this.connectionMap.size,
      totalProcessed: this.connectionMap.size,
      uptime: Math.round(process.uptime())
    };
  }

  public destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Close all connections
    this.connectionMap.forEach((connection) => {
      connection.socket.destroy();
    });

    this.connectionMap.clear();
    ViteStabilizer.instance = null;
    
    logInfo('Vite stabilizer destroyed');
  }
}

// Export convenience functions
export function initializeViteStabilizer(server: Server): ViteStabilizer {
  const stabilizer = ViteStabilizer.getInstance();
  stabilizer.initialize(server);
  return stabilizer;
}

export function getViteStabilizer(): ViteStabilizer {
  return ViteStabilizer.getInstance();
}