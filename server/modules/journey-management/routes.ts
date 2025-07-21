
import { Router } from 'express';
import { JourneyController } from './application/controllers/JourneyController';
import { jwtAuth } from '../../middleware/jwtAuth';
import { enhancedTenantValidator } from '../../middleware/tenantValidator';

const router = Router();
const journeyController = new JourneyController();

// Todas as rotas requerem autenticação e validação de tenant
router.use(jwtAuth);
router.use(enhancedTenantValidator());

// Gestão de jornada
router.post('/start', journeyController.startJourney.bind(journeyController));
router.post('/end', journeyController.endJourney.bind(journeyController));
router.post('/pause', journeyController.pauseJourney.bind(journeyController));
router.post('/resume', journeyController.resumeJourney.bind(journeyController));

// Consultas
router.get('/current', journeyController.getCurrentJourney.bind(journeyController));
router.get('/history', journeyController.getJourneyHistory.bind(journeyController));
router.get('/metrics/today', journeyController.getTodayMetrics.bind(journeyController));
router.get('/:journeyId/checkpoints', journeyController.getJourneyCheckpoints.bind(journeyController));

// Localização
router.post('/location', journeyController.updateLocation.bind(journeyController));

export default router;
