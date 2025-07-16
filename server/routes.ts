import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { jwtAuth, AuthenticatedRequest } from "./middleware/jwtAuth";
import cookieParser from "cookie-parser";
import { insertCustomerSchema, insertTicketSchema, insertTicketMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

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
