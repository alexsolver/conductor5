import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCustomerSchema, insertTicketSchema, insertTicketMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Import microservice routers
  const { dashboardRouter } = await import('./modules/dashboard/routes');
  const { customersRouter } = await import('./modules/customers/routes');
  const { ticketsRouter } = await import('./modules/tickets/routes');
  const { knowledgeBaseRouter } = await import('./modules/knowledge-base/routes');

  // Mount microservice routes
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/knowledge-base', knowledgeBaseRouter);

  // Schema management (admin only)
  app.post("/api/admin/init-schema/:tenantId", isAuthenticated, async (req, res) => {
    try {
      const tenantId = req.params.tenantId;
      const userId = req.user?.claims?.sub;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
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
