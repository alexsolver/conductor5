import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TimecardApprovalController } from './application/controllers/TimecardApprovalController';

// Create dependencies with proper injection
import { DrizzleTimecardRepository } from './infrastructure/repositories/DrizzleTimecardRepository';
import { ClockInUseCase } from './application/use-cases/ClockInUseCase';
import { ClockOutUseCase } from './application/use-cases/ClockOutUseCase';
import { CreateTimecardUseCase } from './application/use-cases/CreateTimecardUseCase';
import { GetTimecardStatusUseCase } from './application/use-cases/GetTimecardStatusUseCase';
import { GetTimecardReportsUseCase } from './application/use-cases/GetTimecardReportsUseCase';
import { TimecardController } from './application/controllers/TimecardController';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const timecardRouter = Router();

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Initialize repository
const timecardRepository = new DrizzleTimecardRepository(db);

// Initialize use cases
const clockInUseCase = new ClockInUseCase(timecardRepository);
const clockOutUseCase = new ClockOutUseCase(timecardRepository);
const createTimecardUseCase = new CreateTimecardUseCase(timecardRepository);
const getTimecardStatusUseCase = new GetTimecardStatusUseCase(timecardRepository);
const getTimecardReportsUseCase = new GetTimecardReportsUseCase(timecardRepository);

// Initialize controller with proper dependency injection
const timecardController = new TimecardController(
  clockInUseCase,
  clockOutUseCase,
  createTimecardUseCase,
  getTimecardStatusUseCase,
  getTimecardReportsUseCase
);

const timecardApprovalController = new TimecardApprovalController();

// Work Schedules routes - usando TimecardController unificado
timecardRouter.get('/work-schedules', jwtAuth, timecardController.getAllWorkSchedules.bind(timecardController));

timecardRouter.post('/work-schedules', jwtAuth, timecardController.createWorkSchedule.bind(timecardController));

timecardRouter.put('/work-schedules/:id', jwtAuth, timecardController.updateWorkSchedule.bind(timecardController));

timecardRouter.delete('/work-schedules/:id', jwtAuth, timecardController.deleteWorkSchedule.bind(timecardController));

timecardRouter.post('/work-schedules/bulk-assign', jwtAuth, timecardController.createBulkWorkSchedules.bind(timecardController));

// Schedule Templates routes
timecardRouter.get('/schedule-templates', jwtAuth, timecardController.getScheduleTemplates.bind(timecardController));

timecardRouter.post('/schedule-templates', jwtAuth, timecardController.createScheduleTemplate.bind(timecardController));

timecardRouter.put('/schedule-templates/:id', jwtAuth, timecardController.updateScheduleTemplate.bind(timecardController));

timecardRouter.delete('/schedule-templates/:id', jwtAuth, timecardController.deleteScheduleTemplate.bind(timecardController));

// Template Assignment routes
timecardRouter.post('/work-schedules/assign-template/:templateId', jwtAuth, timecardController.assignTemplateToUsers.bind(timecardController));

// Users route for dropdowns
timecardRouter.get('/users', jwtAuth, timecardController.getUsers.bind(timecardController));

// Timecard Entries routes
timecardRouter.get('/entries', jwtAuth, timecardController.getTimecardEntriesByUser.bind(timecardController));

timecardRouter.post('/timecard-entries', jwtAuth, timecardController.createTimecardEntry.bind(timecardController));

// Legacy route for compatibility
timecardRouter.post('/entries', jwtAuth, timecardController.createTimecardEntry.bind(timecardController));

// Hour Bank routes
timecardRouter.get('/hour-bank/summary', jwtAuth, timecardController.getHourBankSummary.bind(timecardController));

timecardRouter.get('/hour-bank/:userId', jwtAuth, timecardController.getHourBankByUser.bind(timecardController));

timecardRouter.get('/hour-bank/movements/:userId/:month', jwtAuth, timecardController.getHourBankMovements.bind(timecardController));

// Absence Requests routes
timecardRouter.get('/absence-requests/pending', jwtAuth, timecardController.getPendingAbsenceRequests.bind(timecardController));

// Reports routes with error handling wrapper
timecardRouter.get('/reports/attendance/:period', jwtAuth, timecardController.getAttendanceReport.bind(timecardController));

timecardRouter.get('/reports/overtime/:period', jwtAuth, timecardController.getOvertimeReport.bind(timecardController));

timecardRouter.get('/reports/compliance/:period', jwtAuth, timecardController.getComplianceReport.bind(timecardController));

// Basic Timecard routes
timecardRouter.post('/clock-in', jwtAuth, timecardController.clockIn.bind(timecardController));
timecardRouter.post('/clock-out', jwtAuth, timecardController.clockOut.bind(timecardController));
timecardRouter.get('/current-status', jwtAuth, timecardController.getCurrentStatus.bind(timecardController));
timecardRouter.get('/reports/:period', jwtAuth, timecardController.getReports.bind(timecardController));

// Approval routes
timecardRouter.post('/approve/:id', jwtAuth, timecardApprovalController.approveTimecard.bind(timecardApprovalController));
timecardRouter.post('/reject/:id', jwtAuth, timecardApprovalController.rejectTimecard.bind(timecardApprovalController));
timecardRouter.get('/pending-approvals', jwtAuth, timecardApprovalController.getPendingApprovals.bind(timecardApprovalController));

export { timecardRouter };