// Dashboard Microservice Routes - JWT Authentication
import { Router, Response } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { unifiedStorage } from "../../storage-master";
import { sendSuccess, sendError, createErrorResponse, createSuccessResponse } from "../../utils/standardResponse";
import { DashboardController } from './application/controllers/DashboardController';
import { GetDashboardMetricsUseCase } from './application/use-cases/GetDashboardMetricsUseCase';
import { DrizzleDashboardRepository } from './infrastructure/repositories/DrizzleDashboardRepository';

const dashboardRouter = Router();

// Injeção de dependências
const dashboardRepository = new DrizzleDashboardRepository();
const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(dashboardRepository);
const dashboardController = new DashboardController(getDashboardMetricsUseCase);

// Dashboard statistics endpoint
dashboardRouter.get('/stats', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json(createErrorResponse('Tenant ID é obrigatório'));
    }

    const stats = await dashboardController.getStats(tenantId);
    res.json(createSuccessResponse(stats, 'Dashboard stats retrieved successfully'));
  } catch (error) {
    console.error('Error fetching dashboard stats', { error });
    res.status(500).json(createErrorResponse('Failed to fetch dashboard stats'));
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

// Dashboard metrics endpoint - Usar controller ao invés de lógica direta
dashboardRouter.get('/metrics', (req, res) => dashboardController.getMetrics(req, res));
dashboardRouter.get('/overview', (req, res) => dashboardController.getOverview(req, res));


export { dashboardRouter };