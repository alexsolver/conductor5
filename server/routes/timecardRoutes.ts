import { Router } from 'express';
import { TimecardController } from '../modules/timecard/application/controllers/TimecardController';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();
const timecardController = new TimecardController();

// Aplicar autenticação JWT em todas as rotas
router.use(jwtAuth);

// Timecard Entries
router.post('/timecard-entries', timecardController.createTimecardEntry);
router.get('/users/:userId/timecard-entries', timecardController.getTimecardEntriesByUser);
router.put('/timecard-entries/:id', timecardController.updateTimecardEntry);
router.delete('/timecard-entries/:id', timecardController.deleteTimecardEntry);

// Work Schedules
router.post('/work-schedules', timecardController.createWorkSchedule);
router.get('/users/:userId/work-schedules', timecardController.getWorkSchedulesByUser);
router.get('/work-schedules', timecardController.getAllWorkSchedules);
router.put('/work-schedules/:id', timecardController.updateWorkSchedule);
router.delete('/work-schedules/:id', timecardController.deleteWorkSchedule);

// Absence Requests
router.post('/absence-requests', timecardController.createAbsenceRequest);
router.get('/users/:userId/absence-requests', timecardController.getAbsenceRequestsByUser);
router.get('/absence-requests/pending', timecardController.getPendingAbsenceRequests);
router.put('/absence-requests/:id/approve', timecardController.approveAbsenceRequest);
router.put('/absence-requests/:id/reject', timecardController.rejectAbsenceRequest);

// Schedule Templates
router.post('/schedule-templates', timecardController.createScheduleTemplate);
router.get('/schedule-templates', timecardController.getScheduleTemplates);
router.put('/schedule-templates/:id', timecardController.updateScheduleTemplate);
router.delete('/schedule-templates/:id', timecardController.deleteScheduleTemplate);

// Hour Bank
router.get('/users/:userId/hour-bank', timecardController.getHourBankByUser);

// Flexible Work Arrangements
router.post('/flexible-work-arrangements', timecardController.createFlexibleWorkArrangement);
router.get('/flexible-work-arrangements', timecardController.getFlexibleWorkArrangements);

// User Notifications
router.get('/users/:userId/notifications', timecardController.getUserNotifications);
router.put('/notifications/:id/read', timecardController.markNotificationAsRead);

// Shift Swap Requests
router.post('/shift-swap-requests', timecardController.createShiftSwapRequest);
router.get('/shift-swap-requests', timecardController.getShiftSwapRequests);

export { router as timecardRoutes };