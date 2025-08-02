
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { WorkScheduleController } from './WorkScheduleController';

const timecardRouter = Router();
const workScheduleController = new WorkScheduleController();

// Work Schedules routes
timecardRouter.get('/work-schedules', jwtAuth, (req, res) => 
  workScheduleController.getAllWorkSchedules(req, res)
);

timecardRouter.post('/work-schedules', jwtAuth, (req, res) => 
  workScheduleController.createWorkSchedule(req, res)
);

timecardRouter.put('/work-schedules/:id', jwtAuth, (req, res) => 
  workScheduleController.updateWorkSchedule(req, res)
);

timecardRouter.delete('/work-schedules/:id', jwtAuth, (req, res) => 
  workScheduleController.deleteWorkSchedule(req, res)
);

timecardRouter.get('/schedule-templates', jwtAuth, (req, res) => 
  workScheduleController.getScheduleTemplates(req, res)
);

export { timecardRouter };
