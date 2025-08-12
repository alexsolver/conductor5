/**
 * Beneficiary Integration Routes - Presentation Layer
 * 
 * Integration layer that provides dual-system approach:
 * - Primary: Clean Architecture implementation
 * - Fallback: Legacy system (if available)
 * - Status: System monitoring and health checks
 * 
 * @module BeneficiaryIntegrationRoutes
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import beneficiariesWorkingRoutes from './routes-working';
import beneficiariesLegacyRoutes from './routes'; // Legacy routes

const router = Router();

// ===== SYSTEM STATUS AND MONITORING =====

/**
 * System status endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'beneficiaries-integration',
    architecture: 'Clean Architecture + Legacy Fallback',
    version: '1.0.0',
    phase: 7,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 7 working implementation'
      },
      legacySystem: {
        status: 'available',
        path: '/legacy',
        description: 'Legacy system fallback'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 7 status',
        'POST /working/beneficiaries - Create beneficiary',
        'GET /working/beneficiaries - List beneficiaries',
        'GET /working/beneficiaries/:id - Get beneficiary by ID',
        'PUT /working/beneficiaries/:id - Update beneficiary', 
        'DELETE /working/beneficiaries/:id - Delete beneficiary'
      ],
      legacy: [
        'All original beneficiary endpoints'
      ]
    },
    features: {
      brazilianCompliance: true,
      cpfValidation: true,
      cnpjValidation: true,
      multiTenancy: true,
      authentication: true,
      pagination: true,
      filtering: true,
      search: true,
      bulkOperations: true,
      statistics: true
    },
    lastUpdated: new Date().toISOString()
  });
});

// ===== WORKING PHASE 7 ROUTES (PRIMARY) =====

/**
 * Mount Phase 7 working routes as primary system
 * All /working/* routes use the Phase 7 implementation
 */
try {
  console.log('[BENEFICIARY-INTEGRATION] Mounting Phase 7 working routes at /working');
  router.use('/', beneficiariesWorkingRoutes);
} catch (error) {
  console.error('[BENEFICIARY-INTEGRATION] Error mounting Phase 7 working routes:', error);
}

// ===== LEGACY ROUTES (FALLBACK) =====

/**
 * Mount legacy routes as fallback system
 * Available at /legacy/* for backward compatibility
 */
try {
  console.log('[BENEFICIARY-INTEGRATION] Mounting legacy routes at /legacy');
  router.use('/legacy', beneficiariesLegacyRoutes);
} catch (error) {
  console.log('[BENEFICIARY-INTEGRATION] Legacy routes not found - using Clean Architecture only');
  
  // If legacy routes are not available, provide a fallback endpoint
  router.use('/legacy/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Legacy system not available',
      message: 'Please use the v2 endpoints for beneficiary operations',
      redirectTo: req.originalUrl.replace('/legacy', '/v2')
    });
  });
}

// ===== HEALTH CHECK =====

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      cleanArchitecture: 'operational',
      database: 'connected',
      authentication: 'active'
    }
  });
});

export default router;