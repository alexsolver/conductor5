/**
 * Template Audit Routes Integration
 * Clean Architecture - Integration Layer with main system
 * 
 * @module TemplateAuditRoutesIntegration
 * @created 2025-08-12 - Phase 23 Clean Architecture Implementation
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
    console.log('[TEMPLATE-AUDIT-INTEGRATION] Working routes loaded successfully');
  } catch (error) {
    console.error('[TEMPLATE-AUDIT-INTEGRATION] Failed to load working routes:', error);
    workingRoutes = Router();
  }
}

// Initialize working routes
loadWorkingRoutes();

/**
 * Status endpoint - Check module status
 * GET /api/template-audit-integration/status
 */
router.get('/status', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Template Audit module is active',
      phase: 23,
      module: 'template-audit',
      status: 'active',
      architecture: 'Clean Architecture',
      endpoints: {
        working: '/api/template-audit-integration/working/*',
        status: '/api/template-audit-integration/status',
        health: '/api/template-audit-integration/health'
      },
      features: [
        'Comprehensive Audit Trail',
        'Change Tracking & Monitoring',
        'Risk Assessment & Scoring',
        'Compliance Validation',
        'Anomaly Detection',
        'Audit Reports & Analytics',
        'Chain Integrity Validation',
        'Performance Monitoring',
        'User Activity Tracking',
        'Security Event Logging'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEMPLATE-AUDIT-INTEGRATION] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/template-audit-integration/health
 */
router.get('/health', jwtAuth, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      module: 'template-audit',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        auditTrail: true,
        changeTracking: true,
        riskAssessment: true,
        complianceValidation: true,
        anomalyDetection: true,
        auditReports: true,
        chainIntegrity: true,
        performanceMonitoring: true,
        userActivityTracking: true,
        securityEventLogging: true
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      message: 'Template Audit module is healthy',
      data: health
    });
  } catch (error) {
    console.error('[TEMPLATE-AUDIT-INTEGRATION] Health check error:', error);
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
console.log('[TEMPLATE-AUDIT-INTEGRATION] Mounting Phase 23 working routes at /working');

export default router;