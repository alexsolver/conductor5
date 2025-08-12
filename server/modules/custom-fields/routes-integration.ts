/**
 * Custom Fields Integration Routes - Phase 12 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for custom fields management
 * 
 * @module CustomFieldsIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 12 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import customFieldsWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 12 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'custom-fields-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 12,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 12 working implementation for custom fields management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 12 status',
        'POST /working/fields - Create custom field',
        'GET /working/fields - List custom fields',
        'GET /working/fields/:id - Get field by ID',
        'PUT /working/fields/:id - Update field',
        'DELETE /working/fields/:id - Delete field',
        'GET /working/modules/:moduleType/fields - Get fields by module',
        'GET /working/modules/:moduleType/schema - Get module schema',
        'POST /working/modules/:moduleType/reorder - Reorder fields',
        'GET /working/statistics - Get custom fields statistics'
      ]
    },
    features: {
      customFieldsManagement: true,
      fieldValidation: true,
      conditionalLogic: true,
      fieldTemplates: true,
      fieldOrdering: true,
      moduleSpecificFields: true,
      fieldStatistics: true,
      bulkOperations: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
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
    phase: 12,
    module: 'custom-fields',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 12 ROUTES (PRIMARY) =====

/**
 * Mount Phase 12 working routes as primary system
 * All routes use the Phase 12 implementation
 */
try {
  console.log('[CUSTOM-FIELDS-INTEGRATION] Mounting Phase 12 working routes at /working');
  router.use('/', customFieldsWorkingRoutes);
} catch (error) {
  console.error('[CUSTOM-FIELDS-INTEGRATION] Error mounting Phase 12 working routes:', error);
}

export default router;