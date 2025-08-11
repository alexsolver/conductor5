// Schedule Routes - Infrastructure Layer
import { Router } from 'express';
import { ScheduleController } from '../../application/controllers/ScheduleController';
import { jwtAuth } from '../../../../middleware/jwtAuth';

const router = Router();
const scheduleController = new ScheduleController();

// Apply authentication middleware to all routes
router.use(jwtAuth);

// Schedule management routes - Using methods that exist in our controller
router.post('/schedules', scheduleController.createSchedule.bind(scheduleController));
router.get('/schedules', scheduleController.getSchedules.bind(scheduleController));
router.get('/schedules/:id', scheduleController.getSchedule.bind(scheduleController));
router.put('/schedules/:id', scheduleController.updateSchedule.bind(scheduleController));
router.delete('/schedules/:id', scheduleController.deleteSchedule.bind(scheduleController));
router.get('/timeline', scheduleController.getTimelineView.bind(scheduleController));
router.get('/agenda', scheduleController.getAgendaView.bind(scheduleController));

export default router;