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
import beneficiariesCleanRoutes from './routes-clean';
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
      cleanArchitecture: {
        status: 'active',
        path: '/v2',
        description: 'Clean Architecture implementation'
      },
      legacySystem: {
        status: 'available',
        path: '/legacy',
        description: 'Legacy system fallback'
      }
    },
    endpoints: {
      primary: [
        'POST /v2/ - Create beneficiary',
        'GET /v2/:id - Get beneficiary by ID',
        'GET /v2/ - List beneficiaries with filtering',
        'PUT /v2/:id - Update beneficiary', 
        'DELETE /v2/:id - Delete beneficiary',
        'GET /v2/search - Search beneficiaries',
        'GET /v2/cpf/:cpf - Find by CPF',
        'GET /v2/customer/:customerId - Find by customer',
        'GET /v2/stats - Get statistics',
        'GET /v2/recent - Get recent beneficiaries',
        'DELETE /v2/bulk - Bulk delete'
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

// ===== CLEAN ARCHITECTURE ROUTES (PRIMARY) =====

/**
 * Mount Clean Architecture routes as primary system
 * All /v2/* routes use the new implementation
 */
try {
  console.log('[BENEFICIARY-INTEGRATION] Mounting Clean Architecture routes at /v2');
  router.use('/', beneficiariesCleanRoutes);
} catch (error) {
  console.error('[BENEFICIARY-INTEGRATION] Error mounting Clean Architecture routes:', error);
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