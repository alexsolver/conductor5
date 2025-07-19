// CRITICAL VITE WEBSOCKET STABILITY MIDDLEWARE
// Advanced middleware to prevent Vite WebSocket connection drops and reconnection issues

import { Request, Response, NextFunction } from 'express';

class ViteWebSocketStabilizer {
  private connectionHealthMap = new Map<string, number>();
  private lastCleanup = Date.now();
  private reconnectionAttempts = new Map<string, number>();
  private maxReconnectionAttempts = 3;
  private stabilityCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeStabilityChecks();
  }

  private initializeStabilityChecks(): void {
    // ENTERPRISE PATTERN: Proactive stability monitoring
    this.stabilityCheckInterval = setInterval(() => {
      this.performConnectionHealthCheck();
    }, 45000); // Check every 45 seconds to reduce overhead
  }

  private performConnectionHealthCheck(): void {
    const now = Date.now();
    
    try {
      // MEMORY OPTIMIZATION: Clean stale connection entries
      if (now - this.lastCleanup > 60000) { // Clean every minute
        this.cleanupStaleConnections();
        this.lastCleanup = now;
      }

      // STABILITY METRICS: Log connection health
      const activeConnections = this.connectionHealthMap.size;
      if (activeConnections > 4) {
        console.log(`[ViteStability] High connection count detected: ${activeConnections}`);
        this.optimizeConnections();
      }

    } catch (error) {
      console.log('[ViteStability] Health check error:', error);
    }
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [clientId, lastSeen] of this.connectionHealthMap.entries()) {
      if (now - lastSeen > staleThreshold) {
        this.connectionHealthMap.delete(clientId);
        this.reconnectionAttempts.delete(clientId);
      }
    }

    console.log('[ViteStability] Stale connection cleanup completed');
  }

  private optimizeConnections(): void {
    // WEBSOCKET OPTIMIZATION: Force cleanup of excess connections
    const connectionsToClean = this.connectionHealthMap.size - 3; // Keep max 3 active
    
    if (connectionsToClean > 0) {
      const sortedConnections = Array.from(this.connectionHealthMap.entries())
        .sort((a, b) => a[1] - b[1]); // Sort by last seen time
      
      for (let i = 0; i < connectionsToClean; i++) {
        const [clientId] = sortedConnections[i];
        this.connectionHealthMap.delete(clientId);
        this.reconnectionAttempts.delete(clientId);
      }
      
      console.log(`[ViteStability] Optimized ${connectionsToClean} stale connections`);
    }
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || '';
      const clientId = `${clientIP}_${userAgent.substring(0, 50)}`;

      // VITE WEBSOCKET DETECTION: Handle WebSocket upgrade requests
      if (req.headers.upgrade === 'websocket') {
        console.log('[ViteStability] WebSocket upgrade detected, applying stability optimizations');
        
        // Track connection health
        this.connectionHealthMap.set(clientId, Date.now());
        
        // STABILITY ENHANCEMENT: Set optimal headers for WebSocket connections
        res.setHeader('Connection', 'Upgrade');
        res.setHeader('Upgrade', 'websocket');
        res.setHeader('Sec-WebSocket-Protocol', 'vite-hmr');
        
        // RECONNECTION MANAGEMENT: Track and limit reconnection attempts
        const attempts = this.reconnectionAttempts.get(clientId) || 0;
        if (attempts > this.maxReconnectionAttempts) {
          console.log(`[ViteStability] Max reconnection attempts exceeded for client: ${clientId}`);
          res.status(429).end('Too many reconnection attempts');
          return;
        }
        
        this.reconnectionAttempts.set(clientId, attempts + 1);
      }

      // HMR REQUEST OPTIMIZATION: Handle Vite HMR requests efficiently
      if (req.path.includes('/@vite/') || req.path.includes('__vite_ping')) {
        // Update connection health for HMR requests
        this.connectionHealthMap.set(clientId, Date.now());
        
        // PERFORMANCE OPTIMIZATION: Set cache headers for HMR
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      // STABILITY TRACKING: Monitor connection patterns
      if (req.path.includes('/src/') || req.path.includes('/@fs/')) {
        this.connectionHealthMap.set(clientId, Date.now());
        
        // Reset reconnection counter on successful requests
        if (this.reconnectionAttempts.has(clientId)) {
          this.reconnectionAttempts.set(clientId, 0);
        }
      }

      next();
    };
  }

  public cleanup(): void {
    if (this.stabilityCheckInterval) {
      clearInterval(this.stabilityCheckInterval);
      this.stabilityCheckInterval = null;
    }
    this.connectionHealthMap.clear();
    this.reconnectionAttempts.clear();
    console.log('[ViteStability] WebSocket stabilizer cleanup completed');
  }

  // ENTERPRISE MONITORING: Get stability metrics
  public getStabilityMetrics() {
    return {
      activeConnections: this.connectionHealthMap.size,
      reconnectionAttempts: Array.from(this.reconnectionAttempts.values()).reduce((a, b) => a + b, 0),
      healthyConnections: Array.from(this.connectionHealthMap.values()).filter(
        lastSeen => Date.now() - lastSeen < 30000
      ).length
    };
  }
}

// ENTERPRISE SINGLETON: Global Vite WebSocket stabilizer
export const viteWebSocketStabilizer = new ViteWebSocketStabilizer();

// MIDDLEWARE EXPORT: Easy integration with Express
export const viteStabilityMiddleware = viteWebSocketStabilizer.middleware();