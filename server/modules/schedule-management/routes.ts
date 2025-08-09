
import { Router } from 'express';
import { ScheduleController } from './application/controllers/ScheduleController';

const scheduleRouter = Router();
const scheduleController = new ScheduleController();

// Schedule management routes
scheduleRouter.get('/', scheduleController.getAll.bind(scheduleController));
scheduleRouter.post('/', scheduleController.create.bind(scheduleController));
scheduleRouter.get('/:id', scheduleController.getById.bind(scheduleController));
scheduleRouter.put('/:id', scheduleController.update.bind(scheduleController));
scheduleRouter.delete('/:id', scheduleController.delete.bind(scheduleController));

export { scheduleRouter };
