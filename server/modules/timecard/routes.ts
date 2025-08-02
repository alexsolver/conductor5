
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TimecardController } from './application/controllers/TimecardController';

const timecardRouter = Router();
const timecardController = new TimecardController();

// Work Schedules routes - usando TimecardController unificado
timecardRouter.get('/work-schedules', jwtAuth, (req, res) => 
  timecardController.getAllWorkSchedules(req, res)
);

timecardRouter.post('/work-schedules', jwtAuth, (req, res) => 
  timecardController.createWorkSchedule(req, res)
);

timecardRouter.put('/work-schedules/:id', jwtAuth, (req, res) => 
  timecardController.updateWorkSchedule(req, res)
);

timecardRouter.delete('/work-schedules/:id', jwtAuth, (req, res) => 
  timecardController.deleteWorkSchedule(req, res)
);

// Schedule Templates routes
timecardRouter.get('/schedule-templates', jwtAuth, (req, res) => 
  timecardController.getScheduleTemplates(req, res)
);

timecardRouter.post('/schedule-templates', jwtAuth, (req, res) => 
  timecardController.createScheduleTemplate(req, res)
);

// Users route for dropdowns
timecardRouter.get('/users', jwtAuth, async (req, res) => {
  try {
    const { tenantId } = (req as any).user;
    const users = await timecardController.getUsers(req, res);
  } catch (error) {
    console.error('[TIMECARD-ROUTES] Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Timecard Entries routes
timecardRouter.get('/entries', jwtAuth, (req, res) => 
  timecardController.getTimecardEntriesByUser(req, res)
);

timecardRouter.post('/entries', jwtAuth, (req, res) => 
  timecardController.createTimecardEntry(req, res)
);

// Hour Bank routes
timecardRouter.get('/hour-bank/summary', jwtAuth, (req, res) => 
  timecardController.getHourBankSummary(req, res)
);

// Absence Requests routes
timecardRouter.get('/absence-requests/pending', jwtAuth, (req, res) => 
  timecardController.getPendingAbsenceRequests(req, res)
);

// Reports routes
timecardRouter.get('/reports/attendance/:period', jwtAuth, (req, res) => 
  timecardController.getAttendanceReport(req, res)
);

export { timecardRouter };
