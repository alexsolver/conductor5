// Dashboard Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { unifiedStorage } from "../../storage-master";
import { sendSuccess, sendError } from "../../utils/standardResponse";
import { DashboardController } from './application/controllers/DashboardController';

const dashboardRouter = Router();
const dashboardController = new DashboardController();

// Dashboard statistics endpoint
dashboardRouter.get('/stats', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }

    const stats = await unifiedStorage.getDashboardStats(req.user.tenantId);
    return sendSuccess(res, stats, "Dashboard stats retrieved successfully");
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching dashboard stats", error as any);
    return sendError(res, error as any, "Failed to fetch dashboard stats", 500);
  }
});

// Dashboard activity feed endpoint
dashboardRouter.get('/activity', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await unifiedStorage.getRecentActivity ? await unifiedStorage.getRecentActivity(req.user.tenantId, limit) : [];
    return sendSuccess(res, activity, "Dashboard activity retrieved successfully");
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError("Error fetching dashboard activity", error as any);
    return sendError(res, error as any, "Failed to fetch activity", 500);
  }
});

// Dashboard metrics endpoint
dashboardRouter.get('/metrics', jwtAuth, dashboardController.getMetrics);

export { dashboardRouter };