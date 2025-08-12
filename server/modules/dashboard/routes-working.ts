/**
 * Dashboard Working Routes - Phase 17 Implementation
 * 
 * Working implementation for Phase 17 completion
 * Uses Clean Architecture with Use Cases and Controllers
 * 
 * @module DashboardWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { DashboardController } from './application/controllers/DashboardController';
import { GetDashboardStatsUseCase } from './application/use-cases/GetDashboardStatsUseCase';
import { GetRecentActivityUseCase } from './application/use-cases/GetRecentActivityUseCase';
import { CreateActivityItemUseCase } from './application/use-cases/CreateActivityItemUseCase';
import { SimplifiedDashboardRepository } from './infrastructure/repositories/SimplifiedDashboardRepository';

const router = Router();

// Initialize repository and use cases
const dashboardRepository = new SimplifiedDashboardRepository();
const getDashboardStatsUseCase = new GetDashboardStatsUseCase(dashboardRepository);
const getRecentActivityUseCase = new GetRecentActivityUseCase(dashboardRepository);
const createActivityItemUseCase = new CreateActivityItemUseCase(dashboardRepository);

// Initialize controller
const dashboardController = new DashboardController(
  getDashboardStatsUseCase,
  getRecentActivityUseCase,
  createActivityItemUseCase
);

// Apply middleware
router.use(jwtAuth);

/**
 * Phase 17 Status Endpoint
 * GET /working/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    phase: 17,
    module: 'dashboard',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      dashboardStats: 'GET /working/stats',
      recentActivity: {
        get: 'GET /working/activity',
        create: 'POST /working/activity'
      },
      performance: 'GET /working/performance',
      widgets: {
        list: 'GET /working/widgets',
        create: 'POST /working/widgets',
        update: 'PUT /working/widgets/:id',
        delete: 'DELETE /working/widgets/:id'
      }
    },
    features: {
      dashboardSystem: {
        statisticsAggregation: true,
        realTimeUpdates: true,
        customTimeRanges: true,
        multiModuleStats: true
      },
      activityTracking: {
        realTimeActivity: true,
        userActivityTracking: true,
        entityActivityTracking: true,
        activityFiltering: true,
        timeRangeFiltering: true
      },
      performanceMonitoring: {
        systemMetrics: true,
        responseTimeTracking: true,
        resourceMonitoring: true,
        healthChecking: true
      },
      widgetSystem: {
        customWidgets: true,
        widgetPositioning: true,
        widgetConfiguration: true,
        permissionBasedWidgets: true
      },
      analytics: {
        ticketAnalytics: true,
        userAnalytics: true,
        customerAnalytics: true,
        companyAnalytics: true,
        locationAnalytics: true,
        timecardAnalytics: true
      },
      cleanArchitecture: {
        domainEntities: true,
        useCases: true,
        repositories: true,
        controllers: true
      },
      multiTenancy: true,
      authentication: true
    },
    businessRules: {
      statisticsCalculation: 'Real-time calculation of system statistics',
      activityAggregation: 'Comprehensive activity tracking and aggregation',
      performanceMonitoring: 'Continuous system performance monitoring',
      widgetManagement: 'Dynamic widget configuration and management'
    },
    timestamp: new Date().toISOString()
  });
});

// ===== DASHBOARD STATISTICS ROUTES =====

/**
 * Get dashboard statistics - Working implementation
 * GET /working/stats
 */
router.get('/stats', dashboardController.getDashboardStats);

// ===== ACTIVITY MANAGEMENT ROUTES =====

/**
 * Get recent activity - Working implementation
 * GET /working/activity
 */
router.get('/activity', dashboardController.getRecentActivity);

/**
 * Create activity item - Working implementation
 * POST /working/activity
 */
router.post('/activity', dashboardController.createActivityItem);

// ===== PERFORMANCE MONITORING ROUTES =====

/**
 * Get performance metrics - Working implementation
 * GET /working/performance
 */
router.get('/performance', dashboardController.getPerformanceMetrics);

// ===== WIDGET MANAGEMENT ROUTES =====

/**
 * Get dashboard widgets - Working implementation
 * GET /working/widgets
 */
router.get('/widgets', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.query.userId as string;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const widgets = await dashboardRepository.getDashboardWidgets(tenantId, userId);

    return res.json({
      success: true,
      message: 'Dashboard widgets retrieved successfully',
      data: widgets
    });

  } catch (error) {
    console.error('[DashboardWorkingRoutes] getWidgets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Create dashboard widget - Working implementation
 * POST /working/widgets
 */
router.post('/widgets', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const widget = await dashboardRepository.createDashboardWidget({
      tenantId,
      userId: userId || null,
      ...req.body,
      isVisible: true,
      permissions: req.body.permissions || [],
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Dashboard widget created successfully',
      data: widget
    });

  } catch (error) {
    console.error('[DashboardWorkingRoutes] createWidget error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Update dashboard widget - Working implementation
 * PUT /working/widgets/:id
 */
router.put('/widgets/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const widgetId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const widget = await dashboardRepository.updateDashboardWidget(widgetId, req.body, tenantId);

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    return res.json({
      success: true,
      message: 'Dashboard widget updated successfully',
      data: widget
    });

  } catch (error) {
    console.error('[DashboardWorkingRoutes] updateWidget error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Delete dashboard widget - Working implementation
 * DELETE /working/widgets/:id
 */
router.delete('/widgets/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const widgetId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const success = await dashboardRepository.deleteDashboardWidget(widgetId, tenantId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    return res.json({
      success: true,
      message: 'Dashboard widget deleted successfully'
    });

  } catch (error) {
    console.error('[DashboardWorkingRoutes] deleteWidget error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;