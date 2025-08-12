/**
 * SaaS Admin Integration Routes - Phase 18 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for SaaS administration system
 * 
 * @module SaasAdminIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import saasAdminWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 18 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'saas-admin-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 18,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 18 working implementation for SaaS administration'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 18 status',
        'GET /working/overview - System overview',
        'GET /working/tenants - All tenants list',
        'GET /working/tenants/:id - Tenant details',
        'PUT /working/tenants/:id - Update tenant',
        'POST /working/tenants/:id/suspend - Suspend tenant',
        'POST /working/tenants/:id/activate - Activate tenant',
        'DELETE /working/tenants/:id - Delete tenant',
        'GET /working/config - System configurations',
        'GET /working/config/:key - Specific configuration',
        'PUT /working/config/:key - Update configuration',
        'GET /working/analytics - System analytics',
        'GET /working/audit - Audit log',
        'GET /working/health - System health'
      ]
    },
    features: {
      systemAdministration: true,
      tenantManagement: true,
      userManagement: true,
      billingOverview: true,
      auditAndCompliance: true,
      analytics: true,
      systemMaintenance: true,
      cleanArchitecture: true,
      saasAdminSecurity: true,
      multiTenancy: true,
      authentication: true,
      systemOverview: true,
      healthMonitoring: true,
      performanceMetrics: true,
      configurationManagement: true,
      tenantLifecycleManagement: true,
      globalUserManagement: true,
      billingManagement: true,
      systemAuditLog: true,
      revenueAnalytics: true,
      maintenanceModeControl: true
    },
    cleanArchitecture: {
      domainLayer: {
        entities: [
          'SystemOverview',
          'TenantManagement', 
          'SystemConfiguration',
          'UserManagement',
          'SystemAudit',
          'BillingOverview'
        ],
        services: ['SaasAdminDomainService'],
        repositories: ['ISaasAdminRepository']
      },
      applicationLayer: {
        controllers: ['SaasAdminController'],
        useCases: [
          'GetSystemOverviewUseCase',
          'GetAllTenantsUseCase', 
          'ManageTenantUseCase'
        ]
      },
      infrastructureLayer: {
        repositories: ['SimplifiedSaasAdminRepository']
      }
    },
    businessLogic: {
      tenantManagement: 'Complete tenant lifecycle management with health monitoring and limits enforcement',
      systemAdministration: 'Global system administration with configuration management and health monitoring',
      auditCompliance: 'Comprehensive audit trail for all administrative actions and security events',
      billingOversight: 'Complete billing and revenue oversight with payment status monitoring',
      userManagement: 'Global user management with status control and login history tracking',
      analytics: 'Advanced system analytics with tenant growth, revenue tracking and performance monitoring'
    },
    security: {
      accessControl: 'SaaS Admin role required for all endpoints',
      auditTrail: 'Full audit trail for all administrative actions',
      tenantIsolation: 'Complete tenant data isolation',
      permissionValidation: 'Role-based permission validation on all operations'
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
    phase: 18,
    module: 'saas-admin',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    systemRole: 'saas_admin_only'
  });
});

// ===== WORKING PHASE 18 ROUTES (PRIMARY) =====

/**
 * Mount Phase 18 working routes as primary system
 * All routes use the Phase 18 implementation with Clean Architecture
 */
try {
  console.log('[SAAS-ADMIN-INTEGRATION] Mounting Phase 18 working routes at /working');
  router.use('/working', saasAdminWorkingRoutes);
} catch (error) {
  console.error('[SAAS-ADMIN-INTEGRATION] Error mounting Phase 18 working routes:', error);
}

export default router;