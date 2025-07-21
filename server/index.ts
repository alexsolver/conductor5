import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from "cookie-parser";
import { enhancedWebsocketStability, configureServerForStability } from "./middleware/enhancedWebsocketStability";
import { initializeCleanup } from "./utils/temporaryFilesCleaner";
import { connectionStabilizer } from "./utils/connectionStabilizer";
import { productionInitializer } from './utils/productionInitializer';
import { optimizeViteHMR, preventViteReconnections } from './utils/viteStabilizer';
import { applyViteConnectionOptimizer, disableVitePolling } from './utils/viteConnectionOptimizer';
import { viteStabilityMiddleware, viteWebSocketStabilizer } from './middleware/viteWebSocketStabilizer';

const app = express();

// CRITICAL VITE STABILITY: Apply enhanced WebSocket stability middleware first
app.use(enhancedWebsocketStability);
app.use(viteStabilityMiddleware);

app.use(express.json({ limit: '10mb' })); // Increased limit for stability
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// CRITICAL FIX: Optimized logging middleware to reduce I/O operations
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // CRITICAL: Skip logging for health checks, static assets, and Vite HMR to reduce I/O and prevent reconnections
  const skipLogging = path.includes('/health') || 
                     path.includes('/favicon') || 
                     path.includes('.js') || 
                     path.includes('.css') || 
                     path.includes('.png') || 
                     path.includes('.svg') ||
                     path.includes('/assets/') ||
                     path.includes('/@vite/') ||
                     path.includes('/@react-refresh') ||
                     path.includes('/__vite_ping') ||
                     path.includes('/node_modules/') ||
                     path.includes('/@fs/') ||
                     path.includes('/src/') ||
                     req.method === 'HEAD';

  if (skipLogging) {
    return next();
  }

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    // CRITICAL: Only log API requests and reduce verbose logging
    if (path.startsWith("/api") && !path.includes('/csp-report')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // CRITICAL: Skip JSON response logging for performance-sensitive operations
      if (capturedJsonResponse && duration < 1000) { // Only log responses for slow requests
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // CRITICAL: Initialize Vite HMR optimizations
  optimizeViteHMR();
  preventViteReconnections();
  disableVitePolling();
  
  // CRITICAL FIX: Initialize cleanup and stability systems before starting server
  await initializeCleanup();

  const server = await registerRoutes(app);

  // CRITICAL: Initialize connection stabilizer and server stability
  connectionStabilizer.initialize(server);
  configureServerForStability(server);
  applyViteConnectionOptimizer(app, server);

  // Initialize production systems
  await productionInitializer.initialize();



  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // CRITICAL FIX: Enhanced server stability for WebSocket connections
  server.keepAliveTimeout = 120000; // 2 minutes
  server.headersTimeout = 120000; // 2 minutes  
  server.timeout = 120000; // 2 minutes
  server.maxConnections = 1000;

  // CRITICAL: WebSocket connection stability optimizations
  server.on('connection', (socket) => {
    // Enable TCP keep-alive for all connections
    socket.setKeepAlive(true, 60000); // 1 minute intervals
    socket.setTimeout(120000); // 2 minute socket timeout

    // Prevent connection drops during idle periods
    socket.setNoDelay(true);

    // Handle socket errors gracefully
    socket.on('error', (err: any) => {
      if (err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
        console.warn('[Socket Warning]', err.message);
      }
    });
  });

  // CRITICAL: Enhanced error handling for server stability
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    } else if (err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
      console.error('[Server Error]', err);
    }
  });

  // CRITICAL: Enhanced graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    connectionStabilizer.cleanup();
    viteWebSocketStabilizer.cleanup();
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    connectionStabilizer.cleanup();
    viteWebSocketStabilizer.cleanup();
    server.close(() => {
      process.exit(0);
    });
  });

  // CRITICAL STABILITY FIX: Enhanced error handling for WebSocket and database connection issues
  process.on('uncaughtException', (error) => {
    const errorMsg = error.message || '';
    
    // VITE STABILITY: Ignore WebSocket and HMR related errors
    if (errorMsg.includes('WebSocket') || 
        errorMsg.includes('ECONNRESET') || 
        errorMsg.includes('HMR') ||
        errorMsg.includes('terminating connection due to administrator command')) {
      console.log('[Stability] Ignoring transient connection error:', errorMsg.substring(0, 100));
      return;
    }
    
    console.error('[Uncaught Exception]', error);
    connectionStabilizer.cleanup();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    const reasonStr = String(reason);
    
    // VITE STABILITY: Ignore WebSocket rejections and database connection drops
    if (reasonStr.includes('WebSocket') || 
        reasonStr.includes('terminating connection') ||
        reasonStr.includes('HMR') ||
        reasonStr.includes('ECONNRESET')) {
      console.log('[Stability] Ignoring connection rejection:', reasonStr.substring(0, 100));
      return;
    }
    
    console.warn('[Unhandled Rejection]', reason);
  });

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
    keepAlive: true,
    keepAliveInitialDelay: 0
  }, () => {
    log(`serving on port ${port}`);
  });
})();