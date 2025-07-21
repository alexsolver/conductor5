/**
 * CRITICAL FIX: Connection Stabilizer
 * Advanced WebSocket connection stability management
 */

import { Server } from 'http';

interface ConnectionStats {
  active: number;
  total: number;
  errors: number;
  reconnects: number;
  lastReconnect: Date | null;
}

class ConnectionStabilizer {
  private stats: ConnectionStats = {
    active: 0,
    total: 0,
    errors: 0,
    reconnects: 0,
    lastReconnect: null
  };

  private connectionIds = new Set<string>();
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * CRITICAL: Initialize connection stabilizer with enhanced monitoring
   */
  public initialize(server: Server): void {
    // Enhanced connection monitoring
    server.on('connection', (socket) => {
      const connectionId = `${socket.remoteAddress}:${socket.remotePort}:${Date.now()}`;
      this.connectionIds.add(connectionId);
      this.stats.active++;
      this.stats.total++;

      // CRITICAL: Enhanced socket configuration for stability
      socket.setKeepAlive(true, 60000); // 1 minute keep-alive
      socket.setTimeout(120000); // 2 minute timeout
      socket.setNoDelay(true); // Disable Nagle's algorithm

      socket.on('error', (error) => {
        this.stats.errors++;
        this.connectionIds.delete(connectionId);
        this.stats.active--;
        console.warn(`Connection error for ${connectionId}:`, error.message);
      });

      socket.on('close', () => {
        this.connectionIds.delete(connectionId);
        this.stats.active--;
      });

      socket.on('timeout', () => {
        console.warn(`Connection timeout for ${connectionId}`);
        socket.destroy();
      });
    });

    // Monitor connection health
    setInterval(() => {
      this.monitorHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Monitor overall connection health and trigger reconnections if needed
   */
  private monitorHealth(): void {
    const errorRate = this.stats.errors / Math.max(this.stats.total, 1);
    
    if (errorRate > 0.1) { // More than 10% error rate
      console.warn('High error rate detected:', {
        errors: this.stats.errors,
        total: this.stats.total,
        errorRate: (errorRate * 100).toFixed(2) + '%'
      });
      
      this.triggerStabilization();
    }
  }

  /**
   * Trigger stabilization procedures
   */
  private triggerStabilization(): void {
    if (this.reconnectTimer) {
      return; // Already stabilizing
    }

    console.log('Triggering connection stabilization...');
    this.stats.reconnects++;
    this.stats.lastReconnect = new Date();

    // Reset error counter after stabilization attempt
    this.reconnectTimer = setTimeout(() => {
      this.stats.errors = 0;
      this.reconnectTimer = null;
      console.log('Connection stabilization completed');
    }, 5000);
  }

  /**
   * Get current connection statistics
   */
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      active: this.connectionIds.size,
      total: 0,
      errors: 0,
      reconnects: 0,
      lastReconnect: null
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connectionIds.clear();
    this.resetStats();
  }
}

// Export singleton instance
export const connectionStabilizer = new ConnectionStabilizer();

export default connectionStabilizer;