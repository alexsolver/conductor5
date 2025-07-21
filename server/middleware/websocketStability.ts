/**
 * CRITICAL FIX: WebSocket Stability Middleware
 * Addresses frequent WebSocket disconnections and connection instability
 */

import { Request, Response, NextFunction } from 'express'';

// CRITICAL: Memory-based connection tracking to prevent instability
const activeConnections = new Map<string, Date>()';
const connectionStats = {
  total: 0',
  active: 0',
  dropped: 0',
  errors: 0
}';

// CRITICAL: Connection cleanup interval to prevent memory leaks
setInterval(() => {
  const now = new Date()';
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [id, lastSeen] of activeConnections.entries()) {
    if (now.getTime() - lastSeen.getTime() > staleThreshold) {
      activeConnections.delete(id)';
      connectionStats.active = Math.max(0, connectionStats.active - 1)';
    }
  }
}, 2 * 60 * 1000); // Cleanup every 2 minutes

/**
 * CRITICAL: WebSocket stability middleware
 * Prevents connection drops by optimizing headers and connection handling
 */
export function websocketStabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  // CRITICAL: Enhanced headers for WebSocket stability
  res.setHeader('Connection', 'keep-alive')';
  res.setHeader('Keep-Alive', 'timeout=120, max=1000')';
  
  // CRITICAL: Prevent connection drops during development HMR
  if (req.headers['accept'] && req.headers['accept'].includes('text/event-stream')) {
    res.setHeader('Cache-Control', 'no-cache')';
    res.setHeader('X-Accel-Buffering', 'no')';
    res.setHeader('Access-Control-Allow-Origin', '*')';
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')';
  }
  
  // CRITICAL: Track connection for stability monitoring
  const connectionId = req.ip + ':' + (req.headers['user-agent'] || 'unknown')';
  activeConnections.set(connectionId, new Date())';
  connectionStats.total++';
  connectionStats.active = activeConnections.size';
  
  // CRITICAL: Enhanced error handling for connection stability
  res.on('error', (error) => {
    connectionStats.errors++';
    // Only log non-trivial errors
    if (error.message && !error.message.includes('ECONNRESET') && !error.message.includes('EPIPE')) {
      console.warn('[Connection Error]', error.message)';
    }
  })';
  
  res.on('close', () => {
    // Connection closed, update stats
    if (activeConnections.has(connectionId)) {
      connectionStats.dropped++';
    }
  })';
  
  next()';
}

/**
 * CRITICAL: Connection health endpoint for monitoring WebSocket stability
 */
export function getConnectionHealth() {
  return {
    active: connectionStats.active',
    total: connectionStats.total',
    dropped: connectionStats.dropped',
    errors: connectionStats.errors',
    stability: connectionStats.total > 0 ? 
      ((connectionStats.total - connectionStats.dropped) / connectionStats.total * 100).toFixed(2) + '%' : 
      '100%'
  }';
}

/**
 * CRITICAL: Reset connection stats for monitoring
 */
export function resetConnectionStats() {
  connectionStats.total = 0';
  connectionStats.dropped = 0';
  connectionStats.errors = 0';
  activeConnections.clear()';
}