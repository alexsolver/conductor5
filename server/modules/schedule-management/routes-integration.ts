/**
 * Schedule Management Integration Routes - Phase 8 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints and legacy compatibility
 * 
 * @module ScheduleManagementIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 8 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import scheduleWorkingRoutes from './routes-working';
import scheduleCleanRoutes from './infrastructure/routes/scheduleRoutes'; // Legacy routes

const router = Router();

/**
 * Phase 8 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'schedule-management-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 8,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 8 working implementation with simplified functionality'
      },
      cleanArchitectureSystem: {
        status: 'available',
        path: '/clean',
        description: 'Full Clean Architecture implementation with all features'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 8 status',
        'POST /working/schedules - Create schedule',
        'GET /working/schedules - List schedules',
        'GET /working/schedules/:id - Get schedule by ID',
        'PUT /working/schedules/:id - Update schedule',
        'DELETE /working/schedules/:id - Delete schedule',
        'GET /working/activity-types - Get activity types',
        'POST /working/activity-types - Create activity type',
        'GET /working/agent-availability/:agentId - Get agent availability'
      ],
      clean: [
        'All advanced scheduling features',
        'Conflict detection and resolution',
        'Recurring schedules',
        'Advanced analytics',
        'Search and filtering'
      ]
    },
    features: {
      scheduleManagement: true,
      activityTypes: true,
      agentAvailability: true,
      conflictDetection: true,
      multiTenancy: true,
      authentication: true,
      brazilianCompliance: true,
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
    phase: 8,
    module: 'schedule-management',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 8 ROUTES (PRIMARY) =====

/**
 * Mount Phase 8 working routes as primary system
 * All /working/* routes use the Phase 8 implementation
 */
try {
  console.log('[SCHEDULE-INTEGRATION] Mounting Phase 8 working routes at /working');
  router.use('/', scheduleWorkingRoutes);
} catch (error) {
  console.error('[SCHEDULE-INTEGRATION] Error mounting Phase 8 working routes:', error);
}

// ===== CLEAN ARCHITECTURE ROUTES (ADVANCED) =====

/**
 * Mount Clean Architecture routes for advanced features
 * All /clean/* routes use the full implementation
 */
try {
  console.log('[SCHEDULE-INTEGRATION] Mounting Clean Architecture routes at /clean');
  router.use('/clean', scheduleCleanRoutes);
} catch (error) {
  console.error('[SCHEDULE-INTEGRATION] Error mounting Clean Architecture routes:', error);
}

export default router;