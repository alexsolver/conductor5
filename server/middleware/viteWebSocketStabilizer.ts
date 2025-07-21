/**
 * Vite WebSocket Stabilizer Middleware
 * Enhanced WebSocket stability for Vite development server
 */

import { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import { logInfo, logError, logWarn } from '../utils/logger';

export class ViteWebSocketStabilizer {
  private static instance: ViteWebSocketStabilizer | null = null;
  private connections: Map<string, any> = new Map();
  private healthInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ViteWebSocketStabilizer {
    if (!ViteWebSocketStabilizer.instance) {
      ViteWebSocketStabilizer.instance = new ViteWebSocketStabilizer();
    }
    return ViteWebSocketStabilizer.instance;
  }

  initialize(server: Server): void {
    try {
      logInfo('Initializing Vite WebSocket stabilizer...');

      this.setupWebSocketHandling(server);
      this.startHealthMonitoring();

      logInfo('Vite WebSocket stabilizer initialized successfully');
    } catch (error) {
      logError('Failed to initialize Vite WebSocket stabilizer', error);
    }
  }

  private setupWebSocketHandling(server: Server): void {
    server.on('upgrade', (request, socket, head) => {
      const connectionId = this.generateConnectionId();
      
      // Enhanced socket configuration
      if (typeof socket.setKeepAlive === 'function') {
        socket.setKeepAlive(true, 30000);
      }
      if (typeof socket.setTimeout === 'function') {
        socket.setTimeout(120000);
      }
      if (typeof socket.setNoDelay === 'function') {
        socket.setNoDelay(true);
      }

      this.connections.set(connectionId, {
        socket,
        request,
        created: Date.now(),
        lastPing: Date.now()
      });

      socket.on('error', (error) => {
        this.handleSocketError(connectionId, error);
      });

      socket.on('close', () => {
        this.connections.delete(connectionId);
        logInfo(`WebSocket connection ${connectionId} closed`);
      });

      socket.on('end', () => {
        this.connections.delete(connectionId);
      });
    });

    server.on('connection', (socket) => {
      const connectionId = this.generateConnectionId();
      
      // Apply stability enhancements to HTTP connections
      socket.setKeepAlive(true, 30000);
      socket.setTimeout(120000);
      socket.setNoDelay(true);
      socket.setMaxListeners(20);

      socket.on('error', (error) => {
        if (!this.isIgnorableError(error)) {
          logWarn(`HTTP connection error for ${connectionId}:`, error.message);
        }
      });
    });
  }

  private startHealthMonitoring(): void {
    this.healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  private performHealthCheck(): void {
    const now = Date.now();
    let staleConnections = 0;

    this.connections.forEach((connection, id) => {
      if (now - connection.lastPing > 180000) { // 3 minutes
        staleConnections++;
        connection.socket.destroy();
        this.connections.delete(id);
      }
    });

    if (staleConnections > 0) {
      logInfo(`Health check: cleaned ${staleConnections} stale WebSocket connections`);
    }

    const stats = this.getConnectionStats();
    logInfo('WebSocket health check', stats);
  }

  private handleSocketError(connectionId: string, error: any): void {
    if (this.isIgnorableError(error)) {
      return;
    }

    logWarn(`WebSocket error for connection ${connectionId}`, { error: error.message });
    this.connections.delete(connectionId);
  }

  private isIgnorableError(error: any): boolean {
    const ignorableCodes = ['
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'ECONNABORTED',
      'ENOTFOUND',
      'ENETUNREACH',
      'EHOSTUNREACH'
    ];
    return ignorableCodes.includes(error.code);
  }

  private generateConnectionId(): string {
    return `vite_ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionStats(): {
    activeConnections: number;
    totalManaged: number;
    uptime: number;
    memoryUsage: string;
  } {
    return {
      activeConnections: this.connections.size,
      totalManaged: this.connections.size,
      uptime: Math.round(process.uptime()),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    };
  }

  destroy(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }

    this.connections.forEach((connection) => {
      connection.socket.destroy();
    });

    this.connections.clear();
    ViteWebSocketStabilizer.instance = null;
    logInfo('Vite WebSocket stabilizer destroyed');
  }
}

// Middleware function for Express
export function viteWebSocketStabilizer() {
  return (req: Request, res: Response, next: NextFunction) => {
    // This middleware doesn't need to intercept requests
    // The actual WebSocket handling is done at the server level
    next();
  };
}

// Initialize function
export function initializeViteWebSocketStabilizer(server: Server): ViteWebSocketStabilizer {
  const stabilizer = ViteWebSocketStabilizer.getInstance();
  stabilizer.initialize(server);
  return stabilizer;
}

// Get instance function
export function getViteWebSocketStabilizer(): ViteWebSocketStabilizer {
  return ViteWebSocketStabilizer.getInstance();
}