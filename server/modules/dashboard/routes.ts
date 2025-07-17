// Dashboard Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { storage } from "../../storage";

const dashboardRouter = Router();

// Dashboard statistics endpoint
dashboardRouter.get('/stats', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const stats = await storage.getDashboardStats(req.user.tenantId);
    res.json(stats);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching dashboard stats", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

// Dashboard activity feed endpoint
dashboardRouter.get('/activity', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await storage.getRecentActivity(req.user.tenantId, limit);
    res.json(activity);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching dashboard activity", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
});

// Dashboard metrics endpoint
dashboardRouter.get('/metrics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Additional dashboard metrics
    const metrics = {
      responseTime: {
        average: "2.4h",
        trend: "improving"
      },
      customerSatisfaction: {
        score: 4.8,
        trend: "stable"
      },
      ticketVolume: {
        today: 12,
        trend: "increasing"
      }
    };

    res.json(metrics);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching dashboard metrics", error);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

export { dashboardRouter };