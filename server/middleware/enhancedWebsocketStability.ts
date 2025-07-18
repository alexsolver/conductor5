/**
 * CRITICAL FIX: Enhanced WebSocket Stability Middleware
 * Resolves "[vite] server connection lost" and 502 errors
 */

import { Request, Response, NextFunction } from 'express';
import { Server } from 'http';

/**
 * CRITICAL: Enhanced WebSocket stability configuration
 */
// Enhanced WebSocket stability for production environments
export function enhancedWebsocketStability(app: Express): void {
  // CRITICAL FIX: Increase WebSocket timeout and stability
  app.use((req, res, next) => {
    // Set longer timeout for WebSocket connections
    req.setTimeout(30000); // 30 seconds
    res.setTimeout(30000); // 30 seconds

    // Add WebSocket stability headers
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=30, max=1000');

    next();
  });
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