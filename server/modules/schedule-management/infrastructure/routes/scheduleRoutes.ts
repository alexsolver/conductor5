// Schedule Routes - Infrastructure Layer
import { Router } from 'express';
import { ScheduleController } from '../../application/controllers/ScheduleController';
import { jwtAuth } from '../../../../middleware/jwtAuth';

const router = Router();
const scheduleController = new ScheduleController();

// Apply authentication middleware to all routes
router.use(jwtAuth);

// Schedule management routes
router.post('/schedules', scheduleController.createSchedule);
router.get('/schedules', scheduleController.getSchedulesByDateRange);
router.get('/schedules/agent/:agentId', scheduleController.getSchedulesByAgent);
router.put('/schedules/:id', scheduleController.updateSchedule);
router.delete('/schedules/:id', scheduleController.deleteSchedule);
router.post('/schedules/recurring', scheduleController.createRecurringSchedules);
router.get('/schedules/search', scheduleController.searchSchedules);

// Activity Types routes
router.post('/activity-types', scheduleController.createActivityType);
router.get('/activity-types', scheduleController.getActivityTypes);

// Agent Availability routes
router.post('/agent-availability', scheduleController.createAgentAvailability);
router.get('/agent-availability/:agentId', scheduleController.getAgentAvailability);

// Analytics routes
router.get('/analytics/agent/:agentId/stats', scheduleController.getAgentScheduleStats);
router.get('/analytics/team/overview', scheduleController.getTeamScheduleOverview);

export default router;