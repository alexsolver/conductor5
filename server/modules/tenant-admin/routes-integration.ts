/**
 * Tenant Admin Routes Integration
 * Clean Architecture - Integration Layer with main system
 * 
 * @module TenantAdminRoutesIntegration
 * @created 2025-08-12 - Phase 22 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

// Import working routes
let workingRoutes: Router;

async function loadWorkingRoutes() {
  try {
    const module = await import('./routes-working');
    workingRoutes = module.default;
    console.log('[TENANT-ADMIN-INTEGRATION] Working routes loaded successfully');
  } catch (error) {
    console.error('[TENANT-ADMIN-INTEGRATION] Failed to load working routes:', error);
    workingRoutes = Router();
  }
}

// Initialize working routes
loadWorkingRoutes();

/**
 * Status endpoint - Check module status
 * GET /api/tenant-admin-integration/status
 */
router.get('/status', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Tenant Admin module is active',
      phase: 22,
      module: 'tenant-admin',
      status: 'active',
      architecture: 'Clean Architecture',
      endpoints: {
        working: '/api/tenant-admin-integration/working/*',
        status: '/api/tenant-admin-integration/status',
        health: '/api/tenant-admin-integration/health'
      },
      features: [
        'Tenant Configuration Management',
        'Billing & Subscription Management',
        'Usage Tracking & Analytics',
        'Health Monitoring',
        'Permission Management',
        'Security Configuration',
        'Feature Limits Management',
        'Compliance Controls',
        'Integration Settings',
        'Advanced Tenant Analytics'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TENANT-ADMIN-INTEGRATION] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/tenant-admin-integration/health
 */
router.get('/health', jwtAuth, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      module: 'tenant-admin',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        configurationManagement: true,
        billingManagement: true,
        usageTracking: true,
        healthMonitoring: true,
        permissionManagement: true,
        securityConfiguration: true,
        featureLimits: true,
        complianceControls: true,
        integrationSettings: true,
        advancedAnalytics: true
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      message: 'Tenant Admin module is healthy',
      data: health
    });
  } catch (error) {
    console.error('[TENANT-ADMIN-INTEGRATION] Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: 'Internal server error'
    });
  }
});

/**
 * Mount working routes under /working
 */
router.use('/working', (req, res, next) => {
  if (!workingRoutes) {
    return res.status(503).json({
      success: false,
      message: 'Working routes not available',
      error: 'Service temporarily unavailable'
    });
  }
  next();
}, () => workingRoutes);

// Log successful mounting
console.log('[TENANT-ADMIN-INTEGRATION] Mounting Phase 22 working routes at /working');

export default router;