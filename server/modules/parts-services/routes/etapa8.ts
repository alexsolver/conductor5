
// ETAPA 8: ANALYTICS AVANÇADOS E OTIMIZAÇÕES - ROUTES
import { Router } from 'express';
import { PartsServicesControllerEtapa8 } from '../application/controllers/PartsServicesControllerEtapa8';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const controller = new PartsServicesControllerEtapa8();

// ===== KPI MANAGEMENT =====
router.get('/kpi-definitions', jwtAuth, controller.getKPIDefinitions);
router.post('/kpi-definitions/:kpiDefinitionId/calculate', jwtAuth, controller.calculateKPIValue);
router.get('/kpi-values/:kpiDefinitionId?', jwtAuth, controller.getKPIValues);

// ===== DASHBOARD MANAGEMENT =====
router.post('/dashboards', jwtAuth, controller.createDashboard);
router.get('/dashboards', jwtAuth, controller.getDashboards);

// ===== PERFORMANCE BENCHMARKS =====
router.post('/benchmarks', jwtAuth, controller.createBenchmark);
router.get('/benchmarks', jwtAuth, controller.getBenchmarks);

// ===== ANALYTICS ALERTS =====
router.post('/analytics-alerts', jwtAuth, controller.createAnalyticsAlert);
router.get('/analytics-alerts', jwtAuth, controller.getAnalyticsAlerts);

// ===== RELATÓRIOS =====
router.get('/reports/inventory-analytics', jwtAuth, controller.generateInventoryAnalyticsReport);

// ===== DASHBOARD STATS ETAPA 8 =====
router.get('/dashboard-stats-etapa8', jwtAuth, controller.getDashboardStatsEtapa8);

// ===== ANOMALY DETECTION =====
router.get('/detect-anomalies', jwtAuth, controller.detectAnomalies);

export default router;
