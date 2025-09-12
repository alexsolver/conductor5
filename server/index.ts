import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { backupService } from "./services/BackupService";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from "cookie-parser";
import { enhancedWebsocketStability, configureServerForStability } from "./middleware/enhancedWebsocketStability";
import { initializeCleanup } from "./utils/temporaryFilesCleaner";
import { connectionStabilizer } from "./utils/connectionStabilizer";
import { productionInitializer } from './utils/productionInitializer';
import {
  databaseSchemaInterceptor,
  databaseQueryMonitor,
  moduleSpecificValidator,
  databaseConnectionCleanup
} from './middleware/simpleDatabaseInterceptor';
import { tenantSchemaManager } from './utils/tenantSchemaValidator';
import { dailySchemaChecker } from './scripts/dailySchemaCheck';
import translationsRoutes from './routes/translations';
import translationCompletionRoutes from './routes/translationCompletion';
import { jwtAuth as authenticateToken, AuthenticatedRequest } from './middleware/jwtAuth'; // Import authenticateToken

// Import routes
import authRoutes from './modules/auth/routes';
import customersRoutes from './modules/customers/routes';
import beneficiariesRoutes from './modules/beneficiaries/routes-working';
import locationsRoutes from './modules/locations/routes';
import ticketsRoutes from './modules/tickets/routes';
import saasAdminRoutes from './modules/saas-admin/routes';
// import timecardRoutes from './modules/timecard/routes-working'; // Duplicate removed

// PostgreSQL Local startup helper - 1qa.md Compliance
async function ensurePostgreSQLRunning() {
  const { spawn } = await import('child_process');

  console.log("🚀 [POSTGRESQL-1QA] Ensuring PostgreSQL local is running...");

  try {
    // Test connection with proper local configuration
    const { Pool } = await import('pg');
    const testPool = new Pool({
      connectionString: 'postgresql://postgres@localhost:5432/postgres',
      connectionTimeoutMillis: 3000,
    });

    await testPool.query('SELECT 1');
    await testPool.end();
    console.log("✅ [POSTGRESQL-1QA] PostgreSQL already running");
    return true;
  } catch (error) {
    console.log("🔄 [POSTGRESQL-1QA] Starting PostgreSQL...");

    // Start PostgreSQL with proper configuration
    const postgresPath = '/nix/store/yz718sizpgsnq2y8gfv8bba8l8r4494l-postgresql-16.3/bin/postgres';
    const dataDir = process.env.HOME + '/postgres_data';

    const postgresProcess = spawn(postgresPath, ['-D', dataDir], {
      detached: true,
      stdio: 'ignore'
    });

    postgresProcess.unref();

    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 8000));

    console.log("✅ [POSTGRESQL-1QA] PostgreSQL started");
    return true;
  }
}

async function validateDatabaseConnection() {
  const { Pool } = await import('pg');

  // CRITICAL FIX: Enhanced environment detection for external production
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG;
  const isExternalDeploy = isProduction && !isReplit;

  console.log(`🔍 [DATABASE] Environment detection: production=${isProduction}, replit=${isReplit}, external=${isExternalDeploy}`);

  // CRITICAL FIX: Progressive SSL configuration with multiple fallback strategies
  let sslConfig = {};

  if (isExternalDeploy) {
    // External production - completely disable SSL validation
    sslConfig = {
      ssl: false  // Most aggressive SSL disable for external production
    };
    console.log("🔧 [DATABASE] Using external production SSL config: SSL completely disabled");
  } else if (isProduction && isReplit) {
    // Replit production - standard SSL disable
    sslConfig = { ssl: false };
    console.log("🔧 [DATABASE] Using Replit production SSL config");
  } else {
    // Development - no SSL
    sslConfig = { ssl: false };
    console.log("🔧 [DATABASE] Using development SSL config");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000, // Extended timeout for external deployments
    idleTimeoutMillis: 30000,
    allowExitOnIdle: false,
    max: isExternalDeploy ? 20 : 10, // Adjust pool size for external deployments
    ...sslConfig
  });

  try {
    console.log("🔄 [DATABASE] Attempting initial connection...");
    await pool.query('SELECT 1');
    console.log("✅ [DATABASE] Successfully connected to the database.");
    await pool.end();
    return true;
  } catch (error) {
    console.error("❌ [DATABASE] Initial connection failed:", error);

    if (error.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY') {
      console.error("🔒 [SSL ERROR] Certificate validation failed. Applying ultimate SSL bypass...");

      try {
        // ULTIMATE FALLBACK: Complete SSL bypass with all certificates ignored
        const ultimateFallbackPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: false, // Complete SSL disable
          connectionTimeoutMillis: 20000,
          // Remove any SSL-related query parameters from connection string
          options: '--disable-ssl'
        });

        console.log("🔄 [DATABASE] Trying ultimate SSL bypass...");
        await ultimateFallbackPool.query('SELECT 1');
        await ultimateFallbackPool.end();
        console.log("✅ [DATABASE] Connected with ultimate SSL bypass configuration.");
        return true;
      } catch (ultimateError) {
        console.error("❌ [DATABASE] Ultimate fallback also failed:", ultimateError);

        // Final attempt with modified connection string
        try {
          let modifiedUrl = process.env.DATABASE_URL;
          if (modifiedUrl.includes('?')) {
            modifiedUrl = modifiedUrl.split('?')[0]; // Remove all query parameters
          }
          modifiedUrl += '?sslmode=disable'; // Force SSL disable

          const finalPool = new Pool({
            connectionString: modifiedUrl,
            connectionTimeoutMillis: 25000
          });

          console.log("🔄 [DATABASE] Final attempt with modified connection string...");
          await finalPool.query('SELECT 1');
          await finalPool.end();
          console.log("✅ [DATABASE] Connected with modified connection string.");
          return true;
        } catch (finalError) {
          console.error("❌ [DATABASE] All connection attempts failed:", finalError);
        }
      }
    }

    // Enhanced error message for external deployments
    const errorMessage = isExternalDeploy
      ? "Database connection failed in external production. Verify DATABASE_URL and ensure PostgreSQL server accepts non-SSL connections."
      : "Database connection failed. Ensure DATABASE_URL is correctly set and SSL certificates are valid.";

    throw new Error(errorMessage);
  }
}

import { optimizeViteHMR, preventViteReconnections } from './utils/viteStabilizer';
import { applyViteConnectionOptimizer, disableVitePolling } from './utils/viteConnectionOptimizer';
import { viteStabilityMiddleware, viteWebSocketStabilizer } from './middleware/viteWebSocketStabilizer';
import { timecardRoutes } from './routes/timecardRoutes';
import productivityRoutes from './routes/productivityRoutes';
import { db, sql } from "./db";
import { ActivityTrackingService } from './services/ActivityTrackingService';
import { userGroupsRouter } from './routes/userGroups';
import userGroupsByAgentRoutes from './routes/userGroupsByAgent';
import userManagementRoutes from './routes/userManagementRoutes';
import automationRulesRoutes from './routes/automationRules';
// Technical Skills routes moved to routes.ts - 1qa.md compliance

const app = express();

// CRITICAL VITE STABILITY: Apply enhanced WebSocket stability middleware first
app.use(enhancedWebsocketStability);
app.use(viteStabilityMiddleware);

app.use(express.json({ limit: '10mb' })); // Increased limit for stability
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// CRITICAL: Schema validation and tenant isolation middleware
app.use(databaseSchemaInterceptor());
app.use(databaseQueryMonitor());
app.use(moduleSpecificValidator());
app.use(databaseConnectionCleanup());

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

  // Initialize production systems - 1qa.md Compliance
  // CRITICAL FIX: Database connection validation before server startup
  await validateDatabaseConnection();
  await productionInitializer.initialize();

  // Initialize activity tracking cleanup service
  ActivityTrackingService.initializeCleanup();

  // Timecard routes moved to routes.ts to avoid conflicts
  app.use('/api/productivity', productivityRoutes);

  // Employment type detection and terminology routes
  const { default: employmentRoutes } = await import('./routes/employmentRoutes');
  app.use('/api/employment', employmentRoutes);

  app.use('/api/user-groups', userGroupsRouter);
  app.use('/api', userGroupsByAgentRoutes);
  app.use('/api', userManagementRoutes);

  // Tenant integrations routes are now registered in registerRoutes function

  // ✅ Auth Clean Architecture routes eliminated
  // ✅ Users Clean Architecture routes eliminated
  // ✅ Companies Clean Architecture routes registered at /api/companies-integration & /api/companies-integration/v2

  // 🤖 Automation Rules Routes
  app.use('/api/automation-rules', automationRulesRoutes);

  // Technical Skills Integration Routes (Phase 9 - Clean Architecture)
  // Technical Skills routes moved to routes.ts - 1qa.md compliance

  // Technical Skills routes moved to routes.ts - 1qa.md compliance

  // 🚀 Translation Manager routes
  app.use('/api/translations', translationsRoutes);
  app.use('/api/translation-completion', translationCompletionRoutes);

  // CRITICAL: Schema monitoring endpoint for administrators
  app.get('/api/admin/schema-status', async (req, res) => {
    try {
      // Basic authentication check for admin routes
      const user = (req as any).user;
      if (!user || user.role !== 'saas_admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      console.log('🔍 [ADMIN] Schema status check initiated');

      // Get health check for all tenant connections
      const healthCheck = await tenantSchemaManager.healthCheck();

      // Get basic system info
      const systemInfo = {
        timestamp: new Date().toISOString(),
        totalConnections: healthCheck.length,
        healthyConnections: healthCheck.filter(h => h.isHealthy).length,
        unhealthyConnections: healthCheck.filter(h => !h.isHealthy).length
      };

      res.json({
        success: true,
        data: {
          systemInfo,
          connectionHealth: healthCheck
        }
      });
    } catch (error) {
      console.error('❌ [ADMIN] Schema status check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Schema status check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/health', async (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    try {
      const dbStart = Date.now();
      // ✅ SECURITY FIX: Use public schema connection for health check
      // Health check should use system DB, not tenant DB
      const result = await db.execute(sql`SELECT 1 as health_check`);
      const dbLatency = Date.now() - dbStart;

      // Log health check without tenant context (this is system-level)
      console.debug(`🏥 [HEALTH-CHECK] DB latency: ${dbLatency}ms, status: ${dbLatency < 100 ? 'excellent' : 'good'}`);

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        performance: {
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
          },
          database: {
            latency: dbLatency + 'ms',
            status: dbLatency < 100 ? 'excellent' : dbLatency < 500 ? 'good' : 'needs_attention'
          },
          cpu: {
            user: Math.round(cpuUsage.user / 1000) + 'ms',
            system: Math.round(cpuUsage.system / 1000) + 'ms'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PATCH /api/notifications/bulk-read
  app.patch('/api/notifications/bulk-read', authenticateToken, async (req: Request, res: Response) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { notificationIds } = req.body;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Notification IDs array is required'
        });
      }

      // Update notifications in schedule_notifications table
      const query = `
        UPDATE schedule_notifications
        SET read_at = NOW(), updated_at = NOW()
        WHERE tenant_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL
      `;

      const result = await db.execute(query, [tenantId, notificationIds]);

      res.json({
        success: true,
        message: `Marked ${result.rowCount || notificationIds.length} notifications as read`,
        data: {
          updatedCount: result.rowCount || notificationIds.length
        }
      });

    } catch (error) {
      console.error('Error bulk marking notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/beneficiaries', beneficiariesRoutes);
  app.use('/api/locations', locationsRoutes);
  app.use('/api/tickets', ticketsRoutes);
  app.use('/api/timecard', timecardRoutes);

  // ✅ 1QA.MD: Import and register custom fields routes
  console.log('🔥 [SERVER] Registering custom-fields routes...');
  const customFieldsRoutes = (await import('./modules/custom-fields/routes')).default;
  app.use('/api/custom-fields', (req, res, next) => {
    console.log(`🔥 [SERVER] Custom fields route hit: ${req.method} ${req.url}`);
    next();
  }, customFieldsRoutes);
  console.log('🔥 [SERVER] Custom fields routes registered at /api/custom-fields');

  // ✅ 1QA.MD: Import and register Interactive Map routes
  console.log('🗺️ [SERVER] Registering interactive-map routes...');
  const interactiveMapRoutes = (await import('./modules/interactive-map/routes')).default;
  app.use('/api/interactive-map', (req, res, next) => {
    console.log(`🗺️ [SERVER] Interactive Map route hit: ${req.method} ${req.url}`);
    next();
  }, interactiveMapRoutes);
  console.log('🗺️ [SERVER] Interactive Map routes registered at /api/interactive-map');
  console.log('🌤️ [SERVER] Weather integration using SaaS Admin OpenWeather config');

  // Approval routes registration
  try {
    console.log('✅ [APPROVAL-MANAGEMENT] Registering approval routes...');
    const approvalRoutes = (await import('./modules/approvals/routes')).default;

    // ✅ 1QA.MD: Validate router before using it
    if (!approvalRoutes) {
      console.error('❌ [APPROVAL-MANAGEMENT] Approval routes returned undefined');
      throw new Error('Approval routes module returned undefined');
    }

    if (typeof approvalRoutes !== 'function') {
      console.error('❌ [APPROVAL-MANAGEMENT] Approval routes is not a function:', typeof approvalRoutes);
      throw new Error('Approval routes is not a valid Express Router');
    }

    app.use('/api/approvals', approvalRoutes);
    console.log('✅ [APPROVAL-MANAGEMENT] Routes registered successfully at /api/approvals');

  } catch (approvalError) {
    console.error('❌ [APPROVAL-MANAGEMENT] Failed to load approval routes:', approvalError);
    console.log('⚠️ [APPROVAL-MANAGEMENT] Continuing without approval routes for now');
  }

  // SaaS Admin routes
  app.use('/api/saas-admin', (await import('./routes/saasAdminRoutes')).default);

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
    console.log('[SERVER] Setting up API routes before Vite middleware');
    // Setup Vite middleware after all API routes
    console.log('[SERVER] Adding Vite middleware after API routes');
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add a catch-all route for development that serves the index.html
  if (app.get("env") === "development") {
    app.get('*', (req, res, next) => {
      // Skip if it's an API route
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(__dirname, '../client/index.html'));
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // CRITICAL FIX: Enhanced server stability for WebSocket connections + AWS Production
  server.keepAliveTimeout = process.env.NODE_ENV === 'production' ? 300000 : 120000; // 5min prod / 2min dev
  server.headersTimeout = process.env.NODE_ENV === 'production' ? 300000 : 120000;
  server.timeout = process.env.NODE_ENV === 'production' ? 300000 : 120000;
  server.maxConnections = process.env.NODE_ENV === 'production' ? 2000 : 1000;

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
  }, async () => {
    log(`serving on port ${port}`);

    // 🔴 INICIALIZA SERVIÇOS CLT OBRIGATÓRIOS
    console.log('[CLT-COMPLIANCE] Inicializando serviços de compliance...');
    try {
      // Inicia backup automático diário
      backupService.scheduleDaily();
      console.log('✅ [CLT-COMPLIANCE] Backup automático iniciado com sucesso');

      // CRITICAL: Initialize tenant schema monitoring
      console.log('🔍 [SCHEMA-VALIDATION] Inicializando monitoramento de schemas...');

      // Verificar saúde dos schemas na inicialização
      const healthCheck = await tenantSchemaManager.healthCheck();
      console.log(`🏥 [SCHEMA-VALIDATION] Health check: ${healthCheck.length} tenant connections monitored`);

      // Initialize daily schema checker
      console.log('⏰ [SCHEMA-VALIDATION] Configurando verificações diárias...');
      await dailySchemaChecker.scheduleRecurring();

    } catch (error) {
      console.error('❌ [CLT-COMPLIANCE] Erro ao inicializar serviços:', error);
    }
  });
})();