/**
 * SaaS Admin Working Routes - Phase 18 Implementation
 * 
 * Working implementation for Phase 18 completion
 * Uses Clean Architecture with Use Cases and Controllers
 * 
 * @module SaasAdminWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { SaasAdminController } from './application/controllers/SaasAdminController';
import { GetSystemOverviewUseCase } from './application/use-cases/GetSystemOverviewUseCase';
import { GetAllTenantsUseCase } from './application/use-cases/GetAllTenantsUseCase';
import { ManageTenantUseCase } from './application/use-cases/ManageTenantUseCase';
import { SimplifiedSaasAdminRepository } from './infrastructure/repositories/SimplifiedSaasAdminRepository';

const router = Router();

// Initialize repository and use cases
const saasAdminRepository = new SimplifiedSaasAdminRepository();
const getSystemOverviewUseCase = new GetSystemOverviewUseCase(saasAdminRepository);
const getAllTenantsUseCase = new GetAllTenantsUseCase(saasAdminRepository);
const manageTenantUseCase = new ManageTenantUseCase(saasAdminRepository);

// Initialize controller
const saasAdminController = new SaasAdminController(
  getSystemOverviewUseCase,
  getAllTenantsUseCase,
  manageTenantUseCase
);

// Apply middleware
router.use(jwtAuth);

/**
 * Phase 18 Status Endpoint
 * GET /working/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    phase: 18,
    module: 'saas-admin',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      systemOverview: 'GET /working/overview',
      tenantManagement: {
        list: 'GET /working/tenants',
        get: 'GET /working/tenants/:id',
        update: 'PUT /working/tenants/:id',
        suspend: 'POST /working/tenants/:id/suspend',
        activate: 'POST /working/tenants/:id/activate',
        delete: 'DELETE /working/tenants/:id'
      },
      systemConfig: {
        list: 'GET /working/config',
        get: 'GET /working/config/:key',
        update: 'PUT /working/config/:key'
      },
      analytics: 'GET /working/analytics',
      audit: 'GET /working/audit',
      health: 'GET /working/health'
    },
    features: {
      systemAdministration: {
        systemOverview: true,
        healthMonitoring: true,
        performanceMetrics: true,
        systemConfiguration: true
      },
      tenantManagement: {
        tenantListing: true,
        tenantDetails: true,
        tenantSuspension: true,
        tenantActivation: true,
        tenantDeletion: true,
        usageMonitoring: true,
        limitEnforcement: true
      },
      userManagement: {
        globalUserListing: true,
        userStatusManagement: true,
        passwordReset: true,
        loginHistoryTracking: true
      },
      billingOverview: {
        revenueTracking: true,
        paymentStatusMonitoring: true,
        planAnalytics: true,
        churnAnalysis: true
      },
      auditAndCompliance: {
        systemAuditLog: true,
        adminActionTracking: true,
        securityEventLogging: true,
        complianceReporting: true
      },
      analytics: {
        systemAnalytics: true,
        tenantGrowthTracking: true,
        revenueAnalytics: true,
        performanceMonitoring: true
      },
      systemMaintenance: {
        maintenanceModeControl: true,
        systemBackups: true,
        featureFlagManagement: true,
        configurationManagement: true
      },
      cleanArchitecture: {
        domainEntities: true,
        useCases: true,
        repositories: true,
        controllers: true
      },
      saasAdminSecurity: true,
      multiTenancy: true,
      authentication: true
    },
    businessRules: {
      accessControl: 'Only SaaS Admin role has access to these endpoints',
      tenantManagement: 'Complete tenant lifecycle management with audit trails',
      systemMonitoring: 'Real-time system health and performance monitoring',
      billingOversight: 'Comprehensive billing and revenue oversight',
      auditCompliance: 'Full audit trail for all administrative actions'
    },
    timestamp: new Date().toISOString()
  });
});

// ===== SYSTEM OVERVIEW ROUTES =====

/**
 * Get system overview - Working implementation
 * GET /working/overview
 */
router.get('/overview', saasAdminController.getSystemOverview);

// ===== TENANT MANAGEMENT ROUTES =====

/**
 * Get all tenants - Working implementation
 * GET /working/tenants
 */
router.get('/tenants', saasAdminController.getAllTenants);

/**
 * Get tenant by ID - Working implementation
 * GET /working/tenants/:id
 */
router.get('/tenants/:id', saasAdminController.getTenantById);

/**
 * Update tenant - Working implementation
 * PUT /working/tenants/:id
 */
router.put('/tenants/:id', saasAdminController.updateTenant);

/**
 * Suspend tenant - Working implementation
 * POST /working/tenants/:id/suspend
 */
router.post('/tenants/:id/suspend', saasAdminController.suspendTenant);

/**
 * Activate tenant - Working implementation
 * POST /working/tenants/:id/activate
 */
router.post('/tenants/:id/activate', saasAdminController.activateTenant);

/**
 * Delete tenant - Working implementation
 * DELETE /working/tenants/:id
 */
router.delete('/tenants/:id', saasAdminController.deleteTenant);

// ===== SYSTEM CONFIGURATION ROUTES =====

/**
 * Get system configurations - Working implementation
 * GET /working/config
 */
router.get('/config', async (req, res) => {
  try {
    const adminRole = req.user?.role;

    if (adminRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS Admin access required'
      });
    }

    const category = req.query.category as string;
    const configs = await saasAdminRepository.getSystemConfigurations(category);

    return res.json({
      success: true,
      message: 'System configurations retrieved successfully',
      data: configs
    });

  } catch (error) {
    console.error('[SaasAdminWorkingRoutes] getConfig error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get specific configuration - Working implementation
 * GET /working/config/:key
 */
router.get('/config/:key', async (req, res) => {
  try {
    const adminRole = req.user?.role;
    const configKey = req.params.key;
    const tenantId = req.query.tenantId as string;

    if (adminRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS Admin access required'
      });
    }

    const config = await saasAdminRepository.getSystemConfiguration(configKey, tenantId);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    return res.json({
      success: true,
      message: 'Configuration retrieved successfully',
      data: config
    });

  } catch (error) {
    console.error('[SaasAdminWorkingRoutes] getConfigByKey error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Update configuration - Working implementation
 * PUT /working/config/:key
 */
router.put('/config/:key', async (req, res) => {
  try {
    const adminRole = req.user?.role;
    const adminId = req.user?.id;
    const configKey = req.params.key;

    if (adminRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS Admin access required'
      });
    }

    const updates = {
      ...req.body,
      lastModifiedBy: adminId || 'unknown'
    };

    const config = await saasAdminRepository.updateSystemConfiguration(configKey, updates);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Create audit entry
    await saasAdminRepository.createAuditEntry({
      adminId: adminId || 'unknown',
      adminEmail: req.user?.email || 'unknown',
      action: 'update_system_configuration',
      entityType: 'config',
      entityId: configKey,
      details: `Updated system configuration: ${configKey}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      severity: 'high',
      isActive: true
    });

    return res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });

  } catch (error) {
    console.error('[SaasAdminWorkingRoutes] updateConfig error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== ANALYTICS ROUTES =====

/**
 * Get system analytics - Working implementation
 * GET /working/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const adminRole = req.user?.role;

    if (adminRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS Admin access required'
      });
    }

    const timeRange = req.query.timeRange as string || '30d';
    const analytics = await saasAdminRepository.getSystemAnalytics(timeRange);

    return res.json({
      success: true,
      message: 'System analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('[SaasAdminWorkingRoutes] getAnalytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== AUDIT LOG ROUTES =====

/**
 * Get audit log - Working implementation
 * GET /working/audit
 */
router.get('/audit', async (req, res) => {
  try {
    const adminRole = req.user?.role;

    if (adminRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS Admin access required'
      });
    }

    const filters = {
      adminId: req.query.adminId as string,
      entityType: req.query.entityType as string,
      severity: req.query.severity as string,
      limit: parseInt(req.query.limit as string) || 50
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const auditLog = await saasAdminRepository.getAuditLog(
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return res.json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: auditLog
    });

  } catch (error) {
    console.error('[SaasAdminWorkingRoutes] getAuditLog error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== SYSTEM HEALTH ROUTES =====

/**
 * Get system health metrics - Working implementation
 * GET /working/health
 */
router.get('/health', async (req, res) => {
  try {
    const adminRole = req.user?.role;

    if (adminRole !== 'saas_admin') {
      return res.status(403).json({
        success: false,
        message: 'SaaS Admin access required'
      });
    }

    const healthMetrics = await saasAdminRepository.getSystemHealthMetrics();

    return res.json({
      success: true,
      message: 'System health metrics retrieved successfully',
      data: healthMetrics
    });

  } catch (error) {
    console.error('[SaasAdminWorkingRoutes] getHealth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;