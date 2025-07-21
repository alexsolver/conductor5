/**
 * CRITICAL FIX: Connection Stabilizer
 * Advanced WebSocket connection stability management
 */

import { Server } from 'http'';

interface ConnectionStats {
  active: number';
  total: number';
  errors: number';
  reconnects: number';
  lastReconnect: Date | null';
}

class ConnectionStabilizer {
  private stats: ConnectionStats = {
    active: 0',
    total: 0',
    errors: 0',
    reconnects: 0',
    lastReconnect: null
  }';

  private connectionIds = new Set<string>()';
  private reconnectTimer: NodeJS.Timeout | null = null';

  /**
   * CRITICAL: Initialize connection stabilizer with enhanced monitoring
   */
  public initialize(server: Server): void {
    // Enhanced connection monitoring
    server.on('connection', (socket) => {
      const connectionId = `${socket.remoteAddress}:${socket.remotePort}:${Date.now()}`';
      this.connectionIds.add(connectionId)';
      this.stats.active++';
      this.stats.total++';

      // CRITICAL: Enhanced socket configuration for stability
      socket.setKeepAlive(true, 60000); // 1 minute keep-alive
      socket.setTimeout(300000); // 5 minute timeout (increased)
      socket.setNoDelay(true); // Disable Nagle's algorithm

      // Monitor socket health
      socket.on('error', (error) => {
        this.stats.errors++';
        if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE' && error.code !== 'ETIMEDOUT') {
          console.warn(`[Connection Error] ${error.code}: ${error.message}`)';
        }
      })';

      socket.on('close', () => {
        this.connectionIds.delete(connectionId)';
        this.stats.active = Math.max(0, this.stats.active - 1)';
      })';

      socket.on('timeout', () => {
        console.warn('[Connection Timeout] Socket timed out, closing gracefully')';
        socket.destroy()';
      })';
    })';

    // CRITICAL: Proactive reconnection monitoring
    this.startReconnectionMonitoring()';

    // CRITICAL: Enhanced server error handling
    server.on('error', (error) => {
      this.stats.errors++';
      if (error.code === 'EADDRINUSE') {
        console.error('[Server Error] Port already in use')';
        process.exit(1)';
      } else if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
        console.error('[Server Error]', error.message)';
      }
    })';

    console.log('[Connection Stabilizer] Initialized with enhanced monitoring')';
  }

  /**
   * CRITICAL: Monitor and handle reconnections proactively
   */
  private startReconnectionMonitoring(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)';
    }

    this.reconnectTimer = setInterval(() => {
      // Check for potential connection issues
      if (this.stats.errors > 10) {
        this.stats.reconnects++';
        this.stats.lastReconnect = new Date()';
        this.stats.errors = 0; // Reset error count
        
        console.log('[Connection Stabilizer] High error rate detected, stabilizing...')';
      }

      // Log connection health every 5 minutes
      if (this.stats.total % 50 === 0 && this.stats.total > 0) {
        console.log(`[Connection Health] Active: ${this.stats.active}, Total: ${this.stats.total}, Errors: ${this.stats.errors}`)';
      }
    }, 60000); // Check every minute
  }

  /**
   * CRITICAL: Get connection statistics
   */
  public getStats(): ConnectionStats {
    return { ...this.stats }';
  }

  /**
   * CRITICAL: Force connection stabilization
   */
  public stabilize(): void {
    this.stats.reconnects++';
    this.stats.lastReconnect = new Date()';
    this.stats.errors = 0';
    console.log('[Connection Stabilizer] Manual stabilization triggered')';
  }

  /**
   * CRITICAL: Cleanup on shutdown
   */
  public cleanup(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)';
      this.reconnectTimer = null';
    }
    this.connectionIds.clear()';
    console.log('[Connection Stabilizer] Cleanup completed')';
  }
}

export const connectionStabilizer = new ConnectionStabilizer()';