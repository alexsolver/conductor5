import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { jwtAuth, AuthenticatedRequest } from "./middleware/jwtAuth";
import { requirePermission, requireTenantAccess } from "./middleware/rbacMiddleware";
import createCSPMiddleware, { createCSPReportingEndpoint, createCSPManagementRoutes } from "./middleware/cspMiddleware";
import { createRedisRateLimitMiddleware, RATE_LIMIT_CONFIGS } from "./services/redisRateLimitService";
import { createFeatureFlagMiddleware } from "./services/featureFlagService";
import cookieParser from "cookie-parser";
import { insertCustomerSchema, insertTicketSchema, insertTicketMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());
  
  // Apply CSP middleware
  app.use(createCSPMiddleware({
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    nonce: true
  }));
  
  // Apply rate limiting middleware
  app.use('/api/auth/login', createRedisRateLimitMiddleware(RATE_LIMIT_CONFIGS.LOGIN));
  app.use('/api/auth/register', createRedisRateLimitMiddleware(RATE_LIMIT_CONFIGS.REGISTRATION));
  app.use('/api/auth/password-reset', createRedisRateLimitMiddleware(RATE_LIMIT_CONFIGS.PASSWORD_RESET));
  app.use('/api', createRedisRateLimitMiddleware(RATE_LIMIT_CONFIGS.API_GENERAL));
  
  // Apply feature flag middleware
  app.use(createFeatureFlagMiddleware());
  
  // CSP reporting endpoint
  app.post('/api/csp-report', createCSPReportingEndpoint());
  
  // CSP management routes (admin only)
  app.use('/api/csp', requirePermission('platform', 'manage_security'), createCSPManagementRoutes());
  
  // Feature flags routes
  app.get('/api/feature-flags', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { featureFlagService } = await import('./services/featureFlagService');
      const context = {
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        userAttributes: req.user,
        tenantAttributes: req.tenant
      };
      
      const flags = await featureFlagService.getAllFlags(context);
      res.json({ flags });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });
  
  app.get('/api/feature-flags/:flagId', jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { featureFlagService } = await import('./services/featureFlagService');
      const context = {
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        userAttributes: req.user,
        tenantAttributes: req.tenant
      };
      
      const isEnabled = await featureFlagService.isEnabled(req.params.flagId, context);
      res.json({ flagId: req.params.flagId, enabled: isEnabled });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check feature flag' });
    }
  });

  // RBAC management routes
  app.get('/api/rbac/permissions', jwtAuth, requirePermission('platform', 'manage_security'), async (req: AuthenticatedRequest, res) => {
    try {
      const { PERMISSIONS } = await import('./middleware/rbacMiddleware');
      res.json({ permissions: PERMISSIONS });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });
  
  app.get('/api/rbac/roles', jwtAuth, requirePermission('platform', 'manage_security'), async (req: AuthenticatedRequest, res) => {
    try {
      const { ROLE_PERMISSIONS } = await import('./middleware/rbacMiddleware');
      res.json({ roles: ROLE_PERMISSIONS });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });
  
  app.get('/api/rbac/user-permissions/:userId', jwtAuth, requirePermission('platform', 'manage_users'), async (req: AuthenticatedRequest, res) => {
    try {
      const { rbacService } = await import('./middleware/rbacMiddleware');
      const permissions = await rbacService.getUserPermissions(req.params.userId, req.user?.tenantId);
      res.json({ permissions });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user permissions' });
    }
  });

  // Import and mount authentication routes
  const { authRouter } = await import('./modules/auth/routes');
  app.use('/api/auth', authRouter);

  // Import microservice routers
  const { dashboardRouter } = await import('./modules/dashboard/routes');
  const { customersRouter } = await import('./modules/customers/routes');
  const { ticketsRouter } = await import('./modules/tickets/routes');
  const { knowledgeBaseRouter } = await import('./modules/knowledge-base/routes');
  const { peopleRouter } = await import('./modules/people/routes');
  
  // Initialize clean architecture (for future migration)
  // await setupCustomerDependencies();

  // Mount microservice routes
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/knowledge-base', knowledgeBaseRouter);
  app.use('/api/people', peopleRouter);

  // Import and mount localization routes
  const localizationRoutes = await import('./routes/localization');
  app.use('/api/localization', localizationRoutes.default);

  // Import and mount tenant provisioning routes
  const tenantProvisioningRoutes = await import('./routes/tenant-provisioning');
  app.use('/api/tenant-provisioning', tenantProvisioningRoutes.default);

  // Import and mount translations routes
  const translationsRoutes = await import('./routes/translations');
  app.use('/api/translations', translationsRoutes.default);

  // Import and mount validation routes
  const validationRoutes = await import('./routes/validation');
  app.use('/api/validation', validationRoutes.default);

  // Import and mount auth security routes
  const authSecurityRoutes = await import('./routes/authSecurity');
  app.use('/api/auth-security', authSecurityRoutes.default);

  // Import and mount admin routes
  const saasAdminRoutes = await import('./modules/saas-admin/routes');
  const tenantAdminRoutes = await import('./modules/tenant-admin/routes');
  app.use('/api/saas-admin', saasAdminRoutes.default);
  app.use('/api/tenant-admin', tenantAdminRoutes.default);

  // Schema management (admin only)
  app.post("/api/admin/init-schema/:tenantId", jwtAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { tenantId } = req.params;
      
      // Initialize tenant schema
      await storage.initializeTenantSchema(tenantId);
      
      res.json({ message: `Schema initialized for tenant ${tenantId}` });
    } catch (error) {
      console.error("Error initializing schema:", error);
      res.status(500).json({ message: "Failed to initialize schema" });
    }
  });

  // All routes now handled by dedicated microservices

  const httpServer = createServer(app);
  return httpServer;
}
