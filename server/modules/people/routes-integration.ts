/**
 * People Integration Routes - Phase 13 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for people management
 * 
 * @module PeopleIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 13 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import peopleWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 13 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'people-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 13,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 13 working implementation for people management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 13 status',
        'POST /working/people - Create person',
        'GET /working/people - List people',
        'GET /working/people/:id - Get person by ID',
        'PUT /working/people/:id - Update person',
        'DELETE /working/people/:id - Delete person',
        'GET /working/search - Search people',
        'GET /working/statistics - Get people statistics',
        'POST /working/people/:id/tags - Add tag',
        'DELETE /working/people/:id/tags - Remove tag'
      ]
    },
    features: {
      peopleManagement: true,
      naturalPersons: true,
      legalPersons: true,
      brazilianDocuments: true,
      addressManagement: true,
      contactManagement: true,
      tagsSystem: true,
      searchAndFiltering: true,
      duplicateDetection: true,
      peopleStatistics: true,
      bulkOperations: true,
      importExport: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    validations: {
      cpfValidation: true,
      cnpjValidation: true,
      emailValidation: true,
      phoneValidation: true,
      duplicateValidation: true,
      businessRules: true
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
    phase: 13,
    module: 'people',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 13 ROUTES (PRIMARY) =====

/**
 * Mount Phase 13 working routes as primary system
 * All routes use the Phase 13 implementation
 */
try {
  console.log('[PEOPLE-INTEGRATION] Mounting Phase 13 working routes at /working');
  router.use('/', peopleWorkingRoutes);
} catch (error) {
  console.error('[PEOPLE-INTEGRATION] Error mounting Phase 13 working routes:', error);
}

export default router;