
// ETAPA 7: SISTEMA DE MOVIMENTAÇÕES REAIS E ANALYTICS - ROUTES
import { Router } from 'express';
import { PartsServicesControllerEtapa7 } from '../application/controllers/PartsServicesControllerEtapa7';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const controller = new PartsServicesControllerEtapa7();

// ===== MOVIMENTAÇÕES REAIS =====
router.get('/stock-movements-real', jwtAuth, controller.getStockMovementsReal);
router.post('/stock-movements-real', jwtAuth, controller.createStockMovementReal);
router.put('/stock-movements-real/:movementId/approve', jwtAuth, controller.approveStockMovement);
router.put('/stock-movements-real/:movementId/execute', jwtAuth, controller.executeStockMovement);

// ===== ANÁLISE ABC =====
router.post('/abc-analysis/run', jwtAuth, controller.runABCAnalysis);
router.get('/abc-analysis', jwtAuth, controller.getABCAnalysis);

// ===== PREVISÃO DE DEMANDA =====
router.post('/demand-forecast/generate', jwtAuth, controller.generateDemandForecast);

// ===== ALERTAS DE ESTOQUE =====
router.get('/stock-alerts', jwtAuth, controller.getStockAlerts);
router.post('/stock-alerts', jwtAuth, controller.createStockAlert);

// ===== DASHBOARD STATS ETAPA 7 =====
router.get('/dashboard-stats-etapa7', jwtAuth, controller.getDashboardStatsEtapa7);

export default router;
