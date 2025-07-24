// ETAPA 5: SISTEMA MULTI-ARMAZÉM ENTERPRISE - ROUTES
import { Router } from 'express';
import { PartsServicesControllerEtapa5 } from '../application/controllers/PartsServicesControllerEtapa5';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const controller = new PartsServicesControllerEtapa5();

// ===== CAPACIDADES DE ARMAZÉM =====
router.get('/warehouse-capacities', jwtAuth, controller.getWarehouseCapacities);
router.post('/warehouse-capacities', jwtAuth, controller.createWarehouseCapacity);

// ===== ORDENS DE TRANSFERÊNCIA =====
router.get('/transfer-orders', jwtAuth, controller.getTransferOrders);
router.post('/transfer-orders', jwtAuth, controller.createTransferOrder);
router.put('/transfer-orders/:orderId/status', jwtAuth, controller.updateTransferOrderStatus);

// ===== GPS TRACKING =====
router.post('/gps-tracking', jwtAuth, controller.createGpsTrackingPoint);
router.get('/gps-tracking/:trackableType/:trackableId', jwtAuth, controller.getGpsTracking);

// ===== ANALYTICS DE ARMAZÉM =====
router.get('/warehouse-analytics', jwtAuth, controller.getWarehouseAnalytics);
router.post('/warehouse-analytics/generate', jwtAuth, controller.generateDailyAnalytics);

// ===== PREVISÃO DE DEMANDA =====
router.get('/demand-forecasting', jwtAuth, controller.getDemandForecasting);
router.post('/demand-forecasting/generate', jwtAuth, controller.generateDemandForecast);

// ===== WORKFLOW DE DEVOLUÇÕES =====
router.get('/return-workflows', jwtAuth, controller.getReturnWorkflows);
router.post('/return-workflows', jwtAuth, controller.createReturnWorkflow);
router.put('/return-workflows/:returnId', jwtAuth, controller.updateReturnWorkflow);

// ===== DASHBOARD MULTI-ARMAZÉM =====
router.get('/multi-warehouse-stats', jwtAuth, controller.getMultiWarehouseStats);

export default router;