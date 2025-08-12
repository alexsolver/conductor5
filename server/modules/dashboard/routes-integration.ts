/**
 * Dashboard Integration Routes - Phase 17 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for dashboard management system
 * 
 * @module DashboardIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import dashboardWorkingRoutes from './routes';

const router = Router();

/**
 * Phase 17 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'dashboard-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 17,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 17 working implementation for dashboard management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 17 status',
        'GET /working/stats - Dashboard statistics',
        'GET /working/activity - Recent activity feed',
        'POST /working/activity - Create activity item',
        'GET /working/performance - Performance metrics',
        'GET /working/widgets - Dashboard widgets',
        'POST /working/widgets - Create widget',
        'PUT /working/widgets/:id - Update widget',
        'DELETE /working/widgets/:id - Delete widget'
      ]
    },
    features: {
      dashboardStats: true,
      activityTracking: true,
      performanceMonitoring: true,
      widgetManagement: true,
      realTimeMetrics: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true,
      ticketAnalytics: true,
      userAnalytics: true,
      customerAnalytics: true,
      companyAnalytics: true,
      locationAnalytics: true,
      timecardAnalytics: true
    },
    cleanArchitecture: {
      domainLayer: {
        entities: ['DashboardStats', 'ActivityItem', 'PerformanceMetrics', 'DashboardWidget'],
        services: ['DashboardDomainService'],
        repositories: ['IDashboardRepository']
      },
      applicationLayer: {
        controllers: ['DashboardController'],
        useCases: ['GetDashboardStatsUseCase', 'GetRecentActivityUseCase', 'CreateActivityItemUseCase']
      },
      infrastructureLayer: {
        repositories: ['SimplifiedDashboardRepository']
      }
    },
    businessLogic: {
      statisticsAggregation: 'Real-time aggregation of system statistics',
      activityTracking: 'Comprehensive activity tracking across all modules',
      performanceMonitoring: 'System performance metrics and health monitoring',
      widgetSystem: 'Customizable dashboard widget system',
      realTimeUpdates: 'Real-time dashboard updates and notifications'
    },
    lastUpdated: new Date().toISOString()
  });
});

/**
 * Health Check Endpoint
 * GET /health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    phase: 17,
    module: 'dashboard',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 17 ROUTES (PRIMARY) =====

/**
 * Mount Phase 17 working routes as primary system
 * All routes use the Phase 17 implementation with Clean Architecture
 */
try {
  console.log('[DASHBOARD-INTEGRATION] Mounting Phase 17 working routes at /working');
  router.use('/working', dashboardWorkingRoutes);
} catch (error) {
  console.error('[DASHBOARD-INTEGRATION] Error mounting Phase 17 working routes:', error);
}

export default router;