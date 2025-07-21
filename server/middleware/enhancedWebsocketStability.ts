/**
 * Enhanced WebSocket Stability Middleware
 * Advanced WebSocket connection management and stability features
 */

import { Server } from 'http';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface WebSocketStabilityConfig {
  heartbeatInterval: number;
  connectionTimeout: number;
  maxRetries: number;
  retryDelay: number;
  maxConnections: number;
  enableCompression: boolean;
  enablePingPong: boolean;
}

export interface ConnectionMetrics {
  id: string;
  connectedAt: Date;
  lastActivity: Date;
  messagesReceived: number;
  messagesSent: number;
  retryCount: number;
  status: 'active' | 'idle' | 'disconnected';
}

const DEFAULT_CONFIG: WebSocketStabilityConfig = {
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 120000, // 2 minutes
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  maxConnections: 1000,
  enableCompression: true,
  enablePingPong: true
};

export class EnhancedWebSocketStability {
  private static instance: EnhancedWebSocketStability | null = null;
  private config: WebSocketStabilityConfig;
  private connections: Map<string, ConnectionMetrics> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private server: Server | null = null;

  private constructor(config: Partial<WebSocketStabilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startMaintenanceTasks();
  }

  public static getInstance(config?: Partial<WebSocketStabilityConfig>): EnhancedWebSocketStability {
    if (!EnhancedWebSocketStability.instance) {
      EnhancedWebSocketStability.instance = new EnhancedWebSocketStability(config);
    }
    return EnhancedWebSocketStability.instance;
  }

  /**
   * Initialize the enhanced WebSocket stability system
   */
  public initialize(server: Server): void {
    this.server = server;
    this.setupWebSocketHandlers();
    this.setupConnectionLimitHandler();
    
    logInfo('Enhanced WebSocket stability initialized', {
      maxConnections: this.config.maxConnections,
      heartbeatInterval: this.config.heartbeatInterval,
      connectionTimeout: this.config.connectionTimeout
    });
  }

  /**
   * Setup WebSocket upgrade handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.server) return;

    this.server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const connectionId = this.generateConnectionId();
      
      try {
        // Check connection limits
        if (this.connections.size >= this.config.maxConnections) {
          logWarn('Connection limit exceeded', { 
            current: this.connections.size, 
            max: this.config.maxConnections 
          });
          socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
          socket.destroy();
          return;
        }

        // Configure socket for enhanced stability
        this.configureSocket(socket, connectionId);
        
        // Register connection
        this.registerConnection(connectionId, socket);
        
        logInfo('WebSocket connection established', { connectionId });
      } catch (error) {
        logError('Error handling WebSocket upgrade', error);
        socket.destroy();
      }
    });

    // Handle regular HTTP connections for stability
    this.server.on('connection', (socket: Socket) => {
      const connectionId = this.generateConnectionId();
      this.configureHttpSocket(socket, connectionId);
    });
  }

  /**
   * Configure socket for enhanced stability
   */
  private configureSocket(socket: Socket, connectionId: string): void {
    // Basic socket configuration
    socket.setKeepAlive(true, this.config.heartbeatInterval);
    socket.setTimeout(this.config.connectionTimeout);
    socket.setNoDelay(true);
    
    // Increase buffer sizes for better performance
    socket.setMaxListeners(20);

    // Enhanced error handling
    socket.on('error', (error: any) => {
      this.handleSocketError(connectionId, error);
    });

    socket.on('timeout', () => {
      this.handleSocketTimeout(connectionId);
    });

    socket.on('close', (hadError: boolean) => {
      this.handleSocketClose(connectionId, hadError);
    });

    socket.on('end', () => {
      this.handleSocketEnd(connectionId);
    });

    // Data handling for activity tracking
    socket.on('data', (data: Buffer) => {
      this.updateConnectionActivity(connectionId, 'received', data.length);
    });
  }

  /**
   * Configure HTTP socket for stability
   */
  private configureHttpSocket(socket: Socket, connectionId: string): void {
    socket.setKeepAlive(true, 30000);
    socket.setTimeout(60000);
    socket.setNoDelay(true);
    socket.setMaxListeners(15);

    socket.on('error', (error: any) => {
      if (!this.isIgnorableError(error)) {
        logWarn('HTTP socket error', { connectionId, error: error.message });
      }
    });
  }

  /**
   * Register a new connection
   */
  private registerConnection(connectionId: string, socket: Socket): void {
    const metrics: ConnectionMetrics = {
      id: connectionId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      messagesReceived: 0,
      messagesSent: 0,
      retryCount: 0,
      status: 'active'
    };

    this.connections.set(connectionId, metrics);
    
    // Store connection ID in socket for cleanup
    (socket as any)._connectionId = connectionId;
  }

  /**
   * Update connection activity
   */
  private updateConnectionActivity(connectionId: string, type: 'sent' | 'received', size?: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.lastActivity = new Date();
    connection.status = 'active';
    
    if (type === 'sent') {
      connection.messagesSent++;
    } else {
      connection.messagesReceived++;
    }
  }

  /**
   * Handle socket errors
   */
  private handleSocketError(connectionId: string, error: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (this.isIgnorableError(error)) {
      return;
    }

    connection.retryCount++;
    connection.status = 'disconnected';

    logWarn('WebSocket error', {
      connectionId,
      error: error.message,
      retryCount: connection.retryCount
    });

    // Clean up if max retries exceeded
    if (connection.retryCount >= this.config.maxRetries) {
      this.removeConnection(connectionId);
    }
  }

  /**
   * Handle socket timeout
   */
  private handleSocketTimeout(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = 'idle';
      logInfo('WebSocket connection timed out', { connectionId });
    }
    this.removeConnection(connectionId);
  }

  /**
   * Handle socket close
   */
  private handleSocketClose(connectionId: string, hadError: boolean): void {
    if (hadError) {
      logWarn('WebSocket connection closed with error', { connectionId });
    } else {
      logInfo('WebSocket connection closed normally', { connectionId });
    }
    this.removeConnection(connectionId);
  }

  /**
   * Handle socket end
   */
  private handleSocketEnd(connectionId: string): void {
    logInfo('WebSocket connection ended', { connectionId });
    this.removeConnection(connectionId);
  }

  /**
   * Remove connection from tracking
   */
  private removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  /**
   * Setup connection limit handler
   */
  private setupConnectionLimitHandler(): void {
    // Monitor connection count and log warnings
    setInterval(() => {
      const currentConnections = this.connections.size;
      const utilizationPercent = (currentConnections / this.config.maxConnections) * 100;

      if (utilizationPercent > 80) {
        logWarn('High connection utilization', {
          current: currentConnections,
          max: this.config.maxConnections,
          utilization: `${utilizationPercent.toFixed(1)}%`
        });
      }
    }, 60000); // Check every minute
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    // Heartbeat/ping task
    if (this.config.enablePingPong) {
      this.heartbeatInterval = setInterval(() => {
        this.performHeartbeatCheck();
      }, this.config.heartbeatInterval);
    }

    // Cleanup task for stale connections
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.connectionTimeout);
  }

  /**
   * Perform heartbeat check
   */
  private performHeartbeatCheck(): void {
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - this.config.connectionTimeout);
    
    let staleConnections = 0;

    this.connections.forEach((connection, connectionId) => {
      if (connection.lastActivity < timeoutThreshold) {
        connection.status = 'idle';
        staleConnections++;
      }
    });

    if (staleConnections > 0) {
      logInfo('Heartbeat check completed', {
        totalConnections: this.connections.size,
        staleConnections,
        activeConnections: this.connections.size - staleConnections
      });
    }
  }

  /**
   * Perform cleanup of stale connections
   */
  private performCleanup(): void {
    const now = new Date();
    const cleanupThreshold = new Date(now.getTime() - (this.config.connectionTimeout * 2));
    const connectionsToRemove: string[] = [];

    this.connections.forEach((connection, connectionId) => {
      if (connection.lastActivity < cleanupThreshold || connection.status === 'disconnected') {
        connectionsToRemove.push(connectionId);
      }
    });

    connectionsToRemove.forEach(connectionId => {
      this.connections.delete(connectionId);
    });

    if (connectionsToRemove.length > 0) {
      logInfo('Cleanup completed', {
        removedConnections: connectionsToRemove.length,
        activeConnections: this.connections.size
      });
    }
  }

  /**
   * Check if error should be ignored
   */
  private isIgnorableError(error: any): boolean {
    const ignorableCodes = [
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'ECONNABORTED',
      'ENOTFOUND',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'EADDRINUSE'
    ];

    return ignorableCodes.includes(error.code) || error.message?.includes('socket hang up');
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ws_${timestamp}_${random}`;
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    disconnectedConnections: number;
    averageConnectionAge: number;
    totalMessagesReceived: number;
    totalMessagesSent: number;
    utilizationPercent: number;
  } {
    let activeCount = 0;
    let idleCount = 0;
    let disconnectedCount = 0;
    let totalAge = 0;
    let totalReceived = 0;
    let totalSent = 0;

    const now = new Date();

    this.connections.forEach((connection) => {
      switch (connection.status) {
        case 'active': activeCount++; break;
        case 'idle': idleCount++; break;
        case 'disconnected': disconnectedCount++; break;
      }

      totalAge += now.getTime() - connection.connectedAt.getTime();
      totalReceived += connection.messagesReceived;
      totalSent += connection.messagesSent;
    });

    const totalConnections = this.connections.size;
    const averageConnectionAge = totalConnections > 0 ? totalAge / totalConnections : 0;
    const utilizationPercent = (totalConnections / this.config.maxConnections) * 100;

    return {
      totalConnections,
      activeConnections: activeCount,
      idleConnections: idleCount,
      disconnectedConnections: disconnectedCount,
      averageConnectionAge: Math.round(averageConnectionAge / 1000), // Convert to seconds
      totalMessagesReceived: totalReceived,
      totalMessagesSent: totalSent,
      utilizationPercent: parseFloat(utilizationPercent.toFixed(2))
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<WebSocketStabilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart maintenance tasks with new config
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.startMaintenanceTasks();

    logInfo('WebSocket stability configuration updated', this.config);
  }

  /**
   * Shutdown and cleanup
   */
  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all connections
    this.connections.clear();
    
    EnhancedWebSocketStability.instance = null;
    logInfo('Enhanced WebSocket stability shutdown completed');
  }
}

// Export convenience functions
export function initializeEnhancedWebSocketStability(
  server: Server,
  config?: Partial<WebSocketStabilityConfig>
): EnhancedWebSocketStability {
  const stability = EnhancedWebSocketStability.getInstance(config);
  stability.initialize(server);
  return stability;
}

export function getEnhancedWebSocketStability(): EnhancedWebSocketStability {
  return EnhancedWebSocketStability.getInstance();
}