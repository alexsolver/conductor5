/**
 * Template Versions Routes Integration
 * Clean Architecture - Integration Layer with main system
 * 
 * @module TemplateVersionsRoutesIntegration
 * @created 2025-08-12 - Phase 24 Clean Architecture Implementation
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
    console.log('[TEMPLATE-VERSIONS-INTEGRATION] Working routes loaded successfully');
  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-INTEGRATION] Failed to load working routes:', error);
    workingRoutes = Router();
  }
}

// Initialize working routes
loadWorkingRoutes();

/**
 * Status endpoint - Check module status
 * GET /api/template-versions-integration/status
 */
router.get('/status', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Template Versions module is active',
      phase: 24,
      module: 'template-versions',
      status: 'active',
      architecture: 'Clean Architecture',
      endpoints: {
        working: '/api/template-versions-integration/working/*',
        status: '/api/template-versions-integration/status',
        health: '/api/template-versions-integration/health'
      },
      features: [
        'Semantic Version Control',
        'Version History & Timeline',
        'Version Comparison & Diff',
        'Approval Workflows',
        'Migration Management',
        'Quality & Performance Metrics',
        'Asset Management',
        'Changelog Generation',
        'Backup & Recovery',
        'Analytics & Reporting'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-INTEGRATION] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/template-versions-integration/health
 */
router.get('/health', jwtAuth, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      module: 'template-versions',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        versionControl: true,
        semanticVersioning: true,
        versionHistory: true,
        versionComparison: true,
        approvalWorkflows: true,
        migrationManagement: true,
        qualityMetrics: true,
        assetManagement: true,
        changelogGeneration: true,
        backupRecovery: true
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      message: 'Template Versions module is healthy',
      data: health
    });
  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-INTEGRATION] Health check error:', error);
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
console.log('[TEMPLATE-VERSIONS-INTEGRATION] Mounting Phase 24 working routes at /working');

export default router;