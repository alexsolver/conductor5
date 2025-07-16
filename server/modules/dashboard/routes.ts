// Dashboard Microservice Routes
import { Router } from "express";
import { isAuthenticated } from "../../replitAuth";
import { storage } from "../../storage";

const dashboardRouter = Router();

// Dashboard statistics endpoint
dashboardRouter.get('/stats', isAuthenticated, async (req: any, res) => {
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

// Dashboard activity feed endpoint
dashboardRouter.get('/activity', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await storage.getRecentActivity(user.tenantId, limit);
    res.json(activity);
  } catch (error) {
    console.error("Error fetching dashboard activity:", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
});

// Dashboard metrics endpoint
dashboardRouter.get('/metrics', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
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
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

export { dashboardRouter };