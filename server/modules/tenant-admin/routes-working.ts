/**
 * Tenant Admin Working Routes
 * Clean Architecture - Presentation Layer
 * 
 * @module TenantAdminWorkingRoutes
 * @created 2025-08-12 - Phase 22 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

// Domain
import { SimplifiedTenantAdminRepository } from './infrastructure/repositories/SimplifiedTenantAdminRepository';

// Application
import { GetTenantAdminUseCase } from './application/use-cases/GetTenantAdminUseCase';
import { UpdateTenantConfigurationUseCase } from './application/use-cases/UpdateTenantConfigurationUseCase';
import { TenantAdminController } from './application/controllers/TenantAdminController';

const router = Router();

// Initialize repository
const tenantAdminRepository = new SimplifiedTenantAdminRepository();

// Initialize use cases
const getTenantAdminUseCase = new GetTenantAdminUseCase(tenantAdminRepository);
const updateTenantConfigurationUseCase = new UpdateTenantConfigurationUseCase(tenantAdminRepository);

// Initialize controller
const tenantAdminController = new TenantAdminController(
  getTenantAdminUseCase,
  updateTenantConfigurationUseCase
);

/**
 * Working status endpoint
 * GET /working/status
 */
router.get('/status', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Tenant Admin working routes are operational',
      phase: 22,
      module: 'tenant-admin',
      status: 'working',
      architecture: 'Clean Architecture',
      layers: {
        domain: 'TenantAdmin entities and business rules',
        application: 'Use cases and controllers',
        infrastructure: 'Repository implementations',
        presentation: 'HTTP routes and responses'
      },
      features: {
        configurationManagement: 'Complete tenant configuration management',
        billingManagement: 'Subscription and billing tracking',
        usageTracking: 'Real-time usage monitoring and alerts',
        healthMonitoring: 'System health and performance tracking',
        permissionManagement: 'Granular permission control',
        securityConfiguration: 'Advanced security settings',
        featureLimits: 'Configurable feature limits and quotas',
        complianceControls: 'Regulatory compliance management',
        integrationSettings: 'API and webhook configuration',
        advancedAnalytics: 'Comprehensive tenant analytics and insights'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed'
    });
  }
});

// ===========================
// TENANT ADMIN ROUTES
// ===========================

/**
 * Get current user's tenant admin information
 * GET /working/me
 */
router.get('/me', jwtAuth, tenantAdminController.getMyTenantAdmin);

/**
 * Get tenant admin by ID or tenant ID
 * GET /working/tenant/:tenantId
 */
router.get('/tenant/:tenantId', jwtAuth, tenantAdminController.getTenantAdmin);

/**
 * Get tenant admin by user ID
 * GET /working/user/:userId
 */
router.get('/user/:userId', jwtAuth, tenantAdminController.getTenantAdmin);

/**
 * Get all tenant admins (system admin only)
 * GET /working/all
 */
router.get('/all', jwtAuth, tenantAdminController.getTenantAdmin);

// ===========================
// CONFIGURATION MANAGEMENT
// ===========================

/**
 * Get tenant configuration
 * GET /working/tenant/:tenantId/configuration
 */
router.get('/tenant/:tenantId/configuration', jwtAuth, tenantAdminController.getConfiguration);

/**
 * Get current tenant configuration
 * GET /working/configuration
 */
router.get('/configuration', jwtAuth, tenantAdminController.getConfiguration);

/**
 * Update tenant configuration
 * PUT /working/tenant/:tenantId/configuration
 */
router.put('/tenant/:tenantId/configuration', jwtAuth, tenantAdminController.updateConfiguration);

/**
 * Update current tenant configuration
 * PUT /working/configuration
 */
router.put('/configuration', jwtAuth, tenantAdminController.updateConfiguration);

/**
 * Validate configuration without saving
 * POST /working/tenant/:tenantId/configuration/validate
 */
router.post('/tenant/:tenantId/configuration/validate', jwtAuth, tenantAdminController.validateConfiguration);

/**
 * Validate current tenant configuration
 * POST /working/configuration/validate
 */
router.post('/configuration/validate', jwtAuth, tenantAdminController.validateConfiguration);

// ===========================
// ANALYTICS & INSIGHTS
// ===========================

/**
 * Get tenant analytics
 * GET /working/tenant/:tenantId/analytics
 */
router.get('/tenant/:tenantId/analytics', jwtAuth, tenantAdminController.getAnalytics);

/**
 * Get current tenant analytics
 * GET /working/analytics
 */
router.get('/analytics', jwtAuth, tenantAdminController.getAnalytics);

/**
 * Get tenant health status
 * GET /working/tenant/:tenantId/health
 */
router.get('/tenant/:tenantId/health', jwtAuth, tenantAdminController.getHealth);

/**
 * Get current tenant health
 * GET /working/health
 */
router.get('/health', jwtAuth, tenantAdminController.getHealth);

/**
 * Get tenant usage information
 * GET /working/tenant/:tenantId/usage
 */
router.get('/tenant/:tenantId/usage', jwtAuth, tenantAdminController.getUsage);

/**
 * Get current tenant usage
 * GET /working/usage
 */
router.get('/usage', jwtAuth, tenantAdminController.getUsage);

/**
 * Get tenant billing information
 * GET /working/tenant/:tenantId/billing
 */
router.get('/tenant/:tenantId/billing', jwtAuth, tenantAdminController.getBilling);

/**
 * Get current tenant billing
 * GET /working/billing
 */
router.get('/billing', jwtAuth, tenantAdminController.getBilling);

// ===========================
// USAGE MONITORING
// ===========================

/**
 * Get usage alerts for tenant
 * GET /working/tenant/:tenantId/usage/alerts
 */
router.get('/tenant/:tenantId/usage/alerts', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.params.tenantId;
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const alerts = await tenantAdminRepository.getUsageAlerts(tenantId);

    res.json({
      success: true,
      message: 'Usage alerts retrieved successfully',
      data: alerts
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Get usage alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get usage recommendations for tenant
 * GET /working/tenant/:tenantId/usage/recommendations
 */
router.get('/tenant/:tenantId/usage/recommendations', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.params.tenantId;
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const recommendations = await tenantAdminRepository.getUsageRecommendations(tenantId);

    res.json({
      success: true,
      message: 'Usage recommendations retrieved successfully',
      data: recommendations
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Get usage recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Record usage metric
 * POST /working/tenant/:tenantId/usage/metrics
 */
router.post('/tenant/:tenantId/usage/metrics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.params.tenantId;
    const userRole = req.user?.role;
    const { metric, value, timestamp } = req.body;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!metric || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Metric name and value are required'
      });
    }

    const success = await tenantAdminRepository.recordUsageMetric(
      tenantId,
      metric,
      value,
      timestamp ? new Date(timestamp) : undefined
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or metric not supported'
      });
    }

    res.json({
      success: true,
      message: 'Usage metric recorded successfully',
      data: {
        metric,
        value,
        timestamp: timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Record usage metric error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// SYSTEM ADMINISTRATION
// ===========================

/**
 * Get system analytics (SaaS admin only)
 * GET /working/system/analytics
 */
router.get('/system/analytics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user?.role;

    if (!userRole || userRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS admin access required'
      });
    }

    const analytics = await tenantAdminRepository.getSystemAnalytics();

    res.json({
      success: true,
      message: 'System analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Get system analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Search tenant admins (SaaS admin only)
 * GET /working/search
 */
router.get('/search', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user?.role;
    const query = req.query.q as string;

    if (!userRole || userRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS admin access required'
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await tenantAdminRepository.search(query, {
      status: req.query.status as string,
      role: req.query.role as string,
      planType: req.query.planType as string
    });

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        results,
        query,
        count: results.length
      }
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Search tenant admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get available features and plans
 * GET /working/features
 */
router.get('/features', jwtAuth, tenantAdminController.getAvailableFeatures);

// ===========================
// HEALTH & MONITORING
// ===========================

/**
 * Run health check for tenant
 * POST /working/tenant/:tenantId/health/check
 */
router.post('/tenant/:tenantId/health/check', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.params.tenantId;
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const healthCheck = await tenantAdminRepository.runHealthCheck(tenantId);

    res.json({
      success: true,
      message: 'Health check completed successfully',
      data: healthCheck
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Run health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get monitoring alerts for tenant
 * GET /working/tenant/:tenantId/monitoring/alerts
 */
router.get('/tenant/:tenantId/monitoring/alerts', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.params.tenantId;
    const userRole = req.user?.role;
    const status = req.query.status as string;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const alerts = await tenantAdminRepository.getMonitoringAlerts(tenantId, status);

    res.json({
      success: true,
      message: 'Monitoring alerts retrieved successfully',
      data: alerts
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Get monitoring alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get performance metrics for tenant
 * GET /working/tenant/:tenantId/performance
 */
router.get('/tenant/:tenantId/performance', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.params.tenantId;
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let timeRange;
    if (req.query.startDate && req.query.endDate) {
      timeRange = {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string)
      };
    }

    const metrics = await tenantAdminRepository.getPerformanceMetrics(tenantId, timeRange);

    res.json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: metrics
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// REPORTING
// ===========================

/**
 * Generate usage report
 * POST /working/tenant/:tenantId/reports/usage
 */
router.post('/tenant/:tenantId/reports/usage', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.params.tenantId;
    const userRole = req.user?.role;
    const { reportType, format } = req.body;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!reportType || !format) {
      return res.status(400).json({
        success: false,
        message: 'Report type and format are required'
      });
    }

    const report = await tenantAdminRepository.generateUsageReport(tenantId, reportType, format);

    res.json({
      success: true,
      message: 'Usage report generated successfully',
      data: report
    });

  } catch (error) {
    console.error('[TENANT-ADMIN-WORKING] Generate usage report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Log successful routes mounting
console.log('[TENANT-ADMIN-WORKING] Phase 22 working routes initialized with Clean Architecture');

export default router;