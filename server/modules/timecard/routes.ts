import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TimecardController } from './application/controllers/TimecardController';
import { TimecardApprovalController } from './application/controllers/TimecardApprovalController';

const timecardRouter = Router();
const timecardController = new TimecardController();
// ✅ 1QA.MD: Instanciar controlador de aprovações para endpoints corretos
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

// Current status route
timecardRouter.get('/current-status', jwtAuth, timecardController.getCurrentStatus.bind(timecardController));

// ✅ 1QA.MD: Endpoints de aprovação usando controlador correto
// Approval routes
timecardRouter.get('/approval/pending', jwtAuth, timecardApprovalController.getPendingApprovals.bind(timecardApprovalController));
timecardRouter.post('/approval/approve/:id', jwtAuth, timecardApprovalController.approveTimecardEntry.bind(timecardApprovalController));
timecardRouter.post('/approval/reject/:id', jwtAuth, timecardApprovalController.rejectTimecardEntry.bind(timecardApprovalController));
timecardRouter.post('/approval/bulk', jwtAuth, timecardApprovalController.bulkApproveEntries.bind(timecardApprovalController));

export { timecardRouter };
export default timecardRouter;