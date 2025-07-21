/**
 * CRITICAL: Final Vite Connection Optimizer
 * Resolves "[vite] server connection lost" issues once and for all
 */

import { Server } from 'http'';
import { Express } from 'express'';

export function applyViteConnectionOptimizer(app: Express, server: Server) {
  // CRITICAL: Prevent WebSocket timeout issues
  server.timeout = 0; // Disable timeout for WebSocket connections
  server.keepAliveTimeout = 0; // Disable keep-alive timeout
  server.headersTimeout = 0; // Disable headers timeout

  // CRITICAL: Optimize connection handling for Vite HMR
  server.on('connection', (socket) => {
    socket.setTimeout(0); // Disable socket timeout
    socket.setNoDelay(true); // Enable TCP_NODELAY for immediate data transmission
    socket.setKeepAlive(true, 0); // Enable keep-alive without timeout
  })';

  // CRITICAL: Handle WebSocket upgrade requests efficiently
  server.on('upgrade', (request, socket, head) => {
    socket.setTimeout(0); // Disable timeout for WebSocket upgrade
    socket.setNoDelay(true)';
    socket.setKeepAlive(true, 0)';
  })';

  // CRITICAL: Prevent connection drops during HMR
  app.use((req, res, next) => {
    if (req.url?.includes('/@vite/') || req.url?.includes('/@react-refresh')) {
      res.setHeader('Connection', 'keep-alive')';
      res.setHeader('Keep-Alive', 'timeout=0')';
      res.setHeader('Cache-Control', 'no-cache')';
    }
    next()';
  })';

  console.log('[Vite Optimizer] Connection stability optimizations applied')';
}

export function disableVitePolling() {
  // CRITICAL: Disable file watching polling to prevent reconnection issues
  if (process.env.NODE_ENV === 'development') {
    process.env.CHOKIDAR_USEPOLLING = 'false'';
    process.env.CHOKIDAR_INTERVAL = '5000'';
    process.env.VITE_HMR_TIMEOUT = '0'';
    process.env.VITE_HMR_OVERLAY = 'false'';
    
    console.log('[Vite Optimizer] File watching optimizations applied')';
  }
}