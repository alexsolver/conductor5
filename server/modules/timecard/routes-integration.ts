/**
 * Timecard Integration Routes - Phase 16 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for timecard management system
 * 
 * @module TimecardIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 16 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import { timecardRouter } from './routes';

const router = Router();

/**
 * Phase 16 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'timecard-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 16,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 16 working implementation for timecard management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 16 status',
        'GET /working/current-status - Current user timecard status',
        'POST /working/timecard-entries - Create timecard entry',
        'GET /working/entries - Get timecard entries',
        'POST /working/work-schedules - Create work schedule',
        'GET /working/work-schedules - List work schedules',
        'PUT /working/work-schedules/:id - Update work schedule',
        'DELETE /working/work-schedules/:id - Delete work schedule',
        'GET /working/hour-bank/summary - Hour bank summary',
        'GET /working/hour-bank/:userId - User hour bank',
        'GET /working/reports/attendance/:period - Attendance report',
        'GET /working/reports/overtime/:period - Overtime report',
        'GET /working/reports/compliance/:period - Compliance report'
      ]
    },
    features: {
      timecardManagement: true,
      workSchedules: true,
      hourBankManagement: true,
      absenceRequests: true,
      complianceReporting: true,
      attendanceTracking: true,
      overtimeCalculation: true,
      breakManagement: true,
      scheduleTemplates: true,
      bulkScheduleAssignment: true,
      locationTracking: true,
      deviceTracking: true,
      ipTracking: true,
      approvalWorkflow: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true,
      cltCompliance: true,
      brazilianLaborLaw: true
    },
    cleanArchitecture: {
      domainLayer: {
        entities: ['TimecardEntry', 'WorkSchedule', 'HourBank', 'AbsenceRequest'],
        services: ['TimecardDomainService'],
        repositories: ['ITimecardRepository']
      },
      applicationLayer: {
        controllers: ['TimecardController', 'TimecardApprovalController'],
        useCases: ['CreateTimecardEntryUseCase', 'GetTimecardEntriesUseCase', 'CreateWorkScheduleUseCase']
      },
      infrastructureLayer: {
        repositories: ['DrizzleTimecardRepository'],
        services: ['TimeCalculationService', 'ComplianceService']
      }
    },
    businessLogic: {
      workTimeCalculation: 'Automatic calculation of worked hours, breaks, and overtime',
      cltCompliance: 'Full compliance with Brazilian CLT labor laws',
      hourBankManagement: 'Comprehensive hour bank tracking and management',
      approvalWorkflow: 'Multi-level approval workflow for timecard entries',
      scheduleFlexibility: 'Support for various work schedule types (5x2, 6x1, 12x36, etc.)',
      reportingCapabilities: 'Comprehensive attendance, overtime, and compliance reports'
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
    phase: 16,
    module: 'timecard',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 16 ROUTES (PRIMARY) =====

/**
 * Mount Phase 16 working routes as primary system
 * All routes use the Phase 16 implementation with Clean Architecture
 */
try {
  console.log('[TIMECARD-INTEGRATION] Mounting Phase 16 working routes at /working');
  router.use('/working', timecardRouter);
} catch (error) {
  console.error('[TIMECARD-INTEGRATION] Error mounting Phase 16 working routes:', error);
}

export default router;