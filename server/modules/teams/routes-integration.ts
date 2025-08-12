/**
 * Teams Integration Routes - Phase 10 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for teams management
 * 
 * @module TeamsIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 10 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import teamsWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 10 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'teams-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 10,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 10 working implementation for teams management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 10 status',
        'POST /working/teams - Create team',
        'GET /working/teams - List teams',
        'GET /working/teams/:id - Get team by ID',
        'PUT /working/teams/:id - Update team',
        'DELETE /working/teams/:id - Delete team',
        'GET /working/teams/statistics - Get team statistics',
        'GET /working/teams/types - Get team types'
      ]
    },
    features: {
      teamsManagement: true,
      teamTypes: true,
      workingHours: true,
      teamStatistics: true,
      teamValidation: true,
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
    phase: 10,
    module: 'teams',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 10 ROUTES (PRIMARY) =====

/**
 * Mount Phase 10 working routes as primary system
 * All routes use the Phase 10 implementation
 */
try {
  console.log('[TEAMS-INTEGRATION] Mounting Phase 10 working routes at /working');
  router.use('/', teamsWorkingRoutes);
} catch (error) {
  console.error('[TEAMS-INTEGRATION] Error mounting Phase 10 working routes:', error);
}

export default router;