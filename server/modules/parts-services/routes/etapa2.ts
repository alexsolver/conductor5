
import { Router } from 'express';
import { PartsServicesRepositoryEtapa2 } from '../infrastructure/repositories/PartsServicesRepositoryEtapa2';
import { PartsServicesControllerEtapa2 } from '../application/controllers/PartsServicesControllerEtapa2';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const repository = new PartsServicesRepositoryEtapa2();
const controller = new PartsServicesControllerEtapa2(repository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== MOVIMENTAÇÕES DE ESTOQUE =====
router.post('/movements', controller.createMovement);
router.get('/movements', controller.getMovements);
router.put('/movements/:movementId/approve', controller.approveMovement);

// ===== ENTRADA DE ESTOQUE =====
router.post('/stock/entry', controller.createStockEntry);

// ===== SAÍDA DE ESTOQUE =====
router.post('/stock/exit', controller.createStockExit);

// ===== TRANSFERÊNCIA ENTRE LOCAIS =====
router.post('/stock/transfer', controller.createStockTransfer);

// ===== LOTES E RASTREABILIDADE =====
router.get('/lots', controller.getLots);
router.get('/lots/expiring', controller.getExpiringLots);

// ===== RELATÓRIOS =====
router.get('/reports/turnover', controller.getStockTurnoverReport);
router.get('/reports/valuation', controller.getInventoryValuation);

export default router;
