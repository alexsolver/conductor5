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

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const stats = await storage.getDashboardStats(user.tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activity', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const activity = await storage.getRecentActivity(user.tenantId, 20);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

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

  // Customer routes - using clean architecture
  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    const { CustomerController } = await import('./application/controllers/CustomerController');
    const controller = new CustomerController();
    
    // Add user context to request
    const user = await storage.getUser(req.user.claims.sub);
    req.user = user;
    
    await controller.getCustomers(req, res);
  });

  app.get('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    const { CustomerController } = await import('./application/controllers/CustomerController');
    const controller = new CustomerController();
    
    const user = await storage.getUser(req.user.claims.sub);
    req.user = user;
    
    await controller.getCustomer(req, res);
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    const { CustomerController } = await import('./application/controllers/CustomerController');
    const controller = new CustomerController();
    
    const user = await storage.getUser(req.user.claims.sub);
    req.user = user;
    
    await controller.createCustomer(req, res);
  });

  // Ticket routes
  app.get('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const tickets = await storage.getTickets(user.tenantId, limit, offset);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/urgent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const urgentTickets = await storage.getUrgentTickets(user.tenantId);
      res.json(urgentTickets);
    } catch (error) {
      console.error("Error fetching urgent tickets:", error);
      res.status(500).json({ message: "Failed to fetch urgent tickets" });
    }
  });

  app.get('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const ticket = await storage.getTicket(req.params.id, user.tenantId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const ticketData = insertTicketSchema.parse({
        ...req.body,
        tenantId: user.tenantId,
      });

      const ticket = await storage.createTicket(ticketData);
      
      // Log activity
      await storage.createActivityLog({
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'ticket',
        entityId: ticket.id,
        action: 'created',
        details: { subject: ticket.subject },
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.patch('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const updates = req.body;
      const ticket = await storage.updateTicket(req.params.id, user.tenantId, updates);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Log activity
      await storage.createActivityLog({
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'ticket',
        entityId: ticket.id,
        action: 'updated',
        details: { updates },
      });

      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Ticket message routes
  app.post('/api/tickets/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const messageData = insertTicketMessageSchema.parse({
        ...req.body,
        ticketId: req.params.id,
        authorId: user.id,
      });

      const message = await storage.createTicketMessage(messageData);
      
      // Log activity
      await storage.createActivityLog({
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'ticket',
        entityId: req.params.id,
        action: 'message_added',
        details: { messageType: message.type },
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating ticket message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
