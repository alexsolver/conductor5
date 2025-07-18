// Dashboard Microservice Routes - JWT Authentication
import { Router, Request } from "express";
import { jwtAuth } from "../../middleware/jwtAuth";
import { schemaManager } from '../../db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { logError } from '../../utils/logger';

// In-memory cache for dashboard stats
const dashboardCache = new Map<string, any>();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

const dashboardRouter = Router();

// Dashboard stats endpoint with caching
dashboardRouter.get('/stats', jwtAuth, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    if (!user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID é obrigatório'
      });
    }

    // Create cache key for tenant
    const cacheKey = `dashboard_stats_${user.tenantId}`;
    const cached = dashboardCache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const { db } = await schemaManager.getTenantDb(user.tenantId);
    const { getTenantSpecificSchema } = await import('@shared/schema/tenant-specific');
    const schema = getTenantSpecificSchema(`tenant_${user.tenantId.replace(/-/g, '_')}`);

    // Get counts with proper error handling and consistent queries
    const [customersResult, ticketsResult, usersResult] = await Promise.allSettled([
      db.select({ count: sql<number>`count(*)` }).from(schema.customers),
      db.select({ count: sql<number>`count(*)` }).from(schema.tickets),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.tenantId, user.tenantId))
    ]);

    const totalCustomers = customersResult.status === 'fulfilled' ? Number(customersResult.value[0]?.count || 0) : 0;
    const totalTickets = ticketsResult.status === 'fulfilled' ? Number(ticketsResult.value[0]?.count || 0) : 0;
    const totalUsers = usersResult.status === 'fulfilled' ? Number(usersResult.value[0]?.count || 0) : 0;

    const stats = {
      totalCustomers,
      totalTickets,
      totalUsers,
      openTickets: totalTickets,
      resolvedTickets: 0,
      avgResponseTime: "2h 30m",
      customerSatisfaction: 4.5,
      timestamp: new Date().toISOString()
    };

    // Cache for 30 seconds to prevent inconsistency
    dashboardCache.set(cacheKey, stats);
    setTimeout(() => dashboardCache.delete(cacheKey), 30000);

    res.json(stats);
  } catch (error) {
    logError('Error getting dashboard stats', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
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