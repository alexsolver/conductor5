/**
 * CRITICAL FIX: Enhanced WebSocket Stability Middleware
 * Resolves "[vite] server connection lost" and 502 errors
 */

import { Request, Response, NextFunction } from 'express';
import { Server } from 'http';

/**
 * CRITICAL: Enhanced WebSocket stability configuration
 */
export function enhancedWebsocketStability(req: Request, res: Response, next: NextFunction) {
  // CRITICAL: Enhanced connection management - more aggressive stability
  if (req.socket) {
    req.socket.setKeepAlive(true, 15000); // 15 second keep-alive (very frequent)
    req.socket.setTimeout(300000); // 5 minute timeout (longer for stability)
    req.socket.setNoDelay(true); // Disable Nagle's algorithm for immediate transmission
    
    // CRITICAL: Enhanced socket error handling to prevent crashes
    req.socket.on('error', (error) => {
      // Filter out common WebSocket noise
      if (error.code !== 'ECONNRESET' && 
          error.code !== 'EPIPE' && 
          error.code !== 'ETIMEDOUT' &&
          error.code !== 'ECONNABORTED') {
        console.warn(`[Socket Error] ${error.code}: ${error.message}`);
      }
    });
    
    // CRITICAL: Monitor socket state for proactive handling
    req.socket.on('close', () => {
      // Silent cleanup - no logging for normal close
    });
    
    req.socket.on('timeout', () => {
      console.warn('[Socket Timeout] Connection timed out, cleaning up');
      req.socket.destroy();
    });
  }

  // CRITICAL: Enhanced response headers for stability
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=300, max=1000');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // CRITICAL: Add server stability headers
  res.setHeader('X-Server-Stability', 'enhanced');
  res.setHeader('X-WebSocket-Config', 'optimized');

  next();
}

/**
 * CRITICAL: Enhanced server configuration for WebSocket stability
 */
export function configureServerForStability(server: Server): void {
  // CRITICAL: Enhanced server-level configurations
  server.keepAliveTimeout = 300000; // 5 minutes
  server.headersTimeout = 305000; // 5 minutes + 5 seconds
  server.maxConnections = 1000; // Limit concurrent connections
  server.timeout = 300000; // 5 minute timeout
  
  // CRITICAL: Enhanced server error handling
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error('[Server Error] Port already in use');
      process.exit(1);
    } else if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
      console.error('[Server Error]', error.message);
    }
  });
  
  // CRITICAL: Connection monitoring
  server.on('connection', (socket) => {
    socket.setKeepAlive(true, 15000); // 15 second keep-alive
    socket.setTimeout(300000); // 5 minute timeout
    socket.setNoDelay(true);
    
    socket.on('error', (error) => {
      if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE' && error.code !== 'ETIMEDOUT') {
        console.warn(`[Connection Error] ${error.code}: ${error.message}`);
      }
    });
  });
  
  // CRITICAL: Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      process.exit(0);
    });
  });
  
  console.log('[Server Stability] Enhanced WebSocket configuration applied');
}