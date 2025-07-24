
import { Router } from 'express';
import { PartsServicesRepositoryEtapa3 } from '../infrastructure/repositories/PartsServicesRepositoryEtapa3';
import { PartsServicesControllerEtapa3 } from '../application/controllers/PartsServicesControllerEtapa3';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const repository = new PartsServicesRepositoryEtapa3();
const controller = new PartsServicesControllerEtapa3(repository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== TRANSFERÊNCIAS AUTOMATIZADAS =====
router.post('/automated-transfers', controller.createAutomatedTransferRule);
router.get('/automated-transfers', controller.getAutomatedTransferRules);
router.post('/automated-transfers/execute', controller.executeAutomatedTransfers);

// ===== PREVISÃO DE DEMANDA =====
router.post('/demand-forecast', controller.generateDemandForecast);
router.get('/demand-forecasts', controller.getDemandForecasts);

// ===== ALERTAS DE ESTOQUE =====
router.get('/stock-alerts', controller.getStockAlerts);
router.put('/stock-alerts/:alertId/acknowledge', controller.acknowledgeAlert);

// ===== CAPACIDADES DE ARMAZÉM =====
router.post('/warehouse-capacity', controller.updateWarehouseCapacity);
router.get('/warehouse-capacities', controller.getWarehouseCapacities);

// ===== RASTREAMENTO EM TRÂNSITO =====
router.post('/transit-tracking', controller.createTransitTracking);
router.get('/transit-trackings', controller.getTransitTrackings);
router.put('/transit-tracking/:trackingId/status', controller.updateTransitStatus);

// ===== ANÁLISE ABC =====
router.post('/abc-analysis/generate', controller.generateAbcAnalysis);
router.get('/abc-analysis', controller.getAbcAnalysis);

// ===== DASHBOARD ANALYTICS =====
router.get('/analytics/advanced', controller.getAdvancedAnalytics);

export default router;
