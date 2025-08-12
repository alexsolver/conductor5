/**
 * Timecard Working Routes - Phase 16 Implementation
 * 
 * Working implementation for Phase 16 completion
 * Uses existing controllers with Clean Architecture structure
 * 
 * @module TimecardWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 16 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TimecardController } from './application/controllers/TimecardController';
import { TimecardApprovalController } from './application/controllers/TimecardApprovalController';

const router = Router();

// Initialize controllers
const timecardController = new TimecardController();
const timecardApprovalController = new TimecardApprovalController();

// Apply middleware
router.use(jwtAuth);

/**
 * Phase 16 Status Endpoint
 * GET /working/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    phase: 16,
    module: 'timecard',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      currentStatus: 'GET /working/current-status',
      timecardEntries: {
        create: 'POST /working/timecard-entries',
        list: 'GET /working/entries',
        listByUser: 'GET /working/entries/:userId'
      },
      workSchedules: {
        create: 'POST /working/work-schedules',
        list: 'GET /working/work-schedules',
        update: 'PUT /working/work-schedules/:id',
        delete: 'DELETE /working/work-schedules/:id',
        bulkAssign: 'POST /working/work-schedules/bulk-assign'
      },
      scheduleTemplates: {
        list: 'GET /working/schedule-templates',
        create: 'POST /working/schedule-templates',
        update: 'PUT /working/schedule-templates/:id',
        delete: 'DELETE /working/schedule-templates/:id',
        assign: 'POST /working/work-schedules/assign-template/:templateId'
      },
      hourBank: {
        summary: 'GET /working/hour-bank/summary',
        byUser: 'GET /working/hour-bank/:userId',
        movements: 'GET /working/hour-bank/movements/:userId/:month'
      },
      absenceRequests: {
        pending: 'GET /working/absence-requests/pending'
      },
      reports: {
        attendance: 'GET /working/reports/attendance/:period',
        overtime: 'GET /working/reports/overtime/:period',
        compliance: 'GET /working/reports/compliance/:period'
      },
      users: 'GET /working/users'
    },
    features: {
      timecard: {
        entryManagement: true,
        statusTracking: true,
        automaticCalculations: true,
        breakManagement: true,
        overtimeTracking: true,
        locationTracking: true,
        deviceTracking: true,
        ipTracking: true
      },
      workSchedules: {
        flexibleScheduling: true,
        scheduleTypes: ['5x2', '6x1', '12x36', 'shift', 'flexible', 'intermittent'],
        bulkAssignment: true,
        templateManagement: true
      },
      hourBank: {
        balanceTracking: true,
        movementHistory: true,
        summaryReports: true,
        monthlyBreakdown: true
      },
      compliance: {
        cltCompliance: true,
        brazilianLaborLaw: true,
        auditTrail: true,
        complianceReporting: true
      },
      reports: {
        attendance: true,
        overtime: true,
        compliance: true,
        customPeriods: true
      },
      cleanArchitecture: {
        domainEntities: true,
        useCases: true,
        repositories: true,
        controllers: true
      },
      multiTenancy: true,
      authentication: true
    },
    businessRules: {
      workTimeValidation: 'Automatic validation of work hours and breaks',
      overtimeCalculation: 'Automatic overtime calculation based on schedules',
      complianceChecking: 'CLT compliance validation for Brazilian labor law',
      approvalWorkflow: 'Multi-level approval process for timecard entries',
      hourBankManagement: 'Automated hour bank balance management'
    },
    timestamp: new Date().toISOString()
  });
});

// ===== CURRENT STATUS ROUTES =====

/**
 * Get current timecard status - Working implementation
 * GET /working/current-status
 */
router.get('/current-status', timecardController.getCurrentStatus.bind(timecardController));

// ===== TIMECARD ENTRIES ROUTES =====

/**
 * Create timecard entry - Working implementation
 * POST /working/timecard-entries
 */
router.post('/timecard-entries', timecardController.createTimecardEntry.bind(timecardController));

/**
 * Get timecard entries by user - Working implementation
 * GET /working/entries
 */
router.get('/entries', timecardController.getTimecardEntriesByUser.bind(timecardController));

/**
 * Legacy route for compatibility - Working implementation
 * POST /working/entries
 */
router.post('/entries', timecardController.createTimecardEntry.bind(timecardController));

// ===== WORK SCHEDULES ROUTES =====

/**
 * Get all work schedules - Working implementation
 * GET /working/work-schedules
 */
router.get('/work-schedules', timecardController.getAllWorkSchedules.bind(timecardController));

/**
 * Create work schedule - Working implementation
 * POST /working/work-schedules
 */
router.post('/work-schedules', timecardController.createWorkSchedule.bind(timecardController));

/**
 * Update work schedule - Working implementation
 * PUT /working/work-schedules/:id
 */
router.put('/work-schedules/:id', timecardController.updateWorkSchedule.bind(timecardController));

/**
 * Delete work schedule - Working implementation
 * DELETE /working/work-schedules/:id
 */
router.delete('/work-schedules/:id', timecardController.deleteWorkSchedule.bind(timecardController));

/**
 * Bulk assign work schedules - Working implementation
 * POST /working/work-schedules/bulk-assign
 */
router.post('/work-schedules/bulk-assign', timecardController.createBulkWorkSchedules.bind(timecardController));

// ===== SCHEDULE TEMPLATES ROUTES =====

/**
 * Get schedule templates - Working implementation
 * GET /working/schedule-templates
 */
router.get('/schedule-templates', timecardController.getScheduleTemplates.bind(timecardController));

/**
 * Create schedule template - Working implementation
 * POST /working/schedule-templates
 */
router.post('/schedule-templates', timecardController.createScheduleTemplate.bind(timecardController));

/**
 * Update schedule template - Working implementation
 * PUT /working/schedule-templates/:id
 */
router.put('/schedule-templates/:id', timecardController.updateScheduleTemplate.bind(timecardController));

/**
 * Delete schedule template - Working implementation
 * DELETE /working/schedule-templates/:id
 */
router.delete('/schedule-templates/:id', timecardController.deleteScheduleTemplate.bind(timecardController));

/**
 * Assign template to users - Working implementation
 * POST /working/work-schedules/assign-template/:templateId
 */
router.post('/work-schedules/assign-template/:templateId', timecardController.assignTemplateToUsers.bind(timecardController));

// ===== HOUR BANK ROUTES =====

/**
 * Get hour bank summary - Working implementation
 * GET /working/hour-bank/summary
 */
router.get('/hour-bank/summary', timecardController.getHourBankSummary.bind(timecardController));

/**
 * Get hour bank by user - Working implementation
 * GET /working/hour-bank/:userId
 */
router.get('/hour-bank/:userId', timecardController.getHourBankByUser.bind(timecardController));

/**
 * Get hour bank movements - Working implementation
 * GET /working/hour-bank/movements/:userId/:month
 */
router.get('/hour-bank/movements/:userId/:month', timecardController.getHourBankMovements.bind(timecardController));

// ===== ABSENCE REQUESTS ROUTES =====

/**
 * Get pending absence requests - Working implementation
 * GET /working/absence-requests/pending
 */
router.get('/absence-requests/pending', timecardController.getPendingAbsenceRequests.bind(timecardController));

// ===== REPORTS ROUTES =====

/**
 * Get attendance report - Working implementation
 * GET /working/reports/attendance/:period
 */
router.get('/reports/attendance/:period', timecardController.getAttendanceReport.bind(timecardController));

/**
 * Get overtime report - Working implementation
 * GET /working/reports/overtime/:period
 */
router.get('/reports/overtime/:period', timecardController.getOvertimeReport.bind(timecardController));

/**
 * Get compliance report - Working implementation
 * GET /working/reports/compliance/:period
 */
router.get('/reports/compliance/:period', timecardController.getComplianceReport.bind(timecardController));

// ===== USERS ROUTES =====

/**
 * Get users for dropdown - Working implementation
 * GET /working/users
 */
router.get('/users', timecardController.getUsers.bind(timecardController));

export default router;