
import { Router } from 'express';
import { PartsServicesRepositoryEtapa5 } from '../infrastructure/repositories/PartsServicesRepositoryEtapa5';
import { PartsServicesControllerEtapa5 } from '../application/controllers/PartsServicesControllerEtapa5';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const repository = new PartsServicesRepositoryEtapa5();
const controller = new PartsServicesControllerEtapa5(repository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== MULTI-WAREHOUSES MANAGEMENT =====
router.get('/multi-warehouses', controller.getMultiWarehouses);
router.post('/multi-warehouses', controller.createMultiWarehouse);

// ===== WAREHOUSE TRANSFERS =====
router.get('/warehouse-transfers', controller.getWarehouseTransfers);
router.post('/warehouse-transfers', controller.createWarehouseTransfer);

// ===== GPS TRACKING =====
router.get('/gps-tracking/:transferId', controller.getGpsTracking);
router.post('/gps-tracking', controller.createGpsTracking);

// ===== WAREHOUSE ANALYTICS =====
router.get('/warehouse-analytics', controller.getWarehouseAnalytics);

// ===== DEMAND FORECASTING =====
router.get('/demand-forecasting', controller.getDemandForecasting);

// ===== RETURN WORKFLOWS =====
router.get('/return-workflows', controller.getReturnWorkflows);
router.post('/return-workflows', controller.createReturnWorkflow);

// ===== TRACKING CODES =====
router.get('/tracking-codes', controller.getTrackingCodes);

// ===== DASHBOARD STATS ETAPA 5 =====
router.get('/dashboard/stats', controller.getDashboardStatsEtapa5);

export default router;
