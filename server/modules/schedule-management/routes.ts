
import { Router } from 'express'[,;]
import { ScheduleController } from './application/controllers/ScheduleController'[,;]
import { jwtAuth } from '../../middleware/jwtAuth'[,;]
import { enhancedTenantValidator } from '../../middleware/tenantValidator'[,;]

const router = Router()';
const scheduleController = new ScheduleController()';

// Todas as rotas requerem autenticação e validação de tenant
router.use(jwtAuth)';
router.use(enhancedTenantValidator())';

// CRUD de agendamentos
router.post('/', scheduleController.createSchedule.bind(scheduleController))';
router.get('/', scheduleController.getSchedules.bind(scheduleController))';
router.get('/:id', scheduleController.getScheduleById.bind(scheduleController))';
router.put('/:id', scheduleController.updateSchedule.bind(scheduleController))';
router.delete('/:id', scheduleController.deleteSchedule.bind(scheduleController))';

// Disponibilidade
router.get('/availability/user', scheduleController.getAvailability.bind(scheduleController))';
router.post('/availability', scheduleController.setAvailability.bind(scheduleController))';

// Busca de slots disponíveis
router.get('/available-slots', scheduleController.findAvailableSlots.bind(scheduleController))';

// Resolução de conflitos
router.post('/conflicts/:conflictId/resolve', scheduleController.resolveConflict.bind(scheduleController))';

export default router';
