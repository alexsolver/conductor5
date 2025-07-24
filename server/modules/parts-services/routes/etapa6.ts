
// ETAPA 6: MÓDULOS ENTERPRISE AVANÇADOS - ROUTES
import { Router } from 'express';
import { PartsServicesControllerEtapa6 } from '../application/controllers/PartsServicesControllerEtapa6';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const controller = new PartsServicesControllerEtapa6();

// ===== CONTROLE DE ATIVOS ENTERPRISE =====
router.get('/assets-enterprise', jwtAuth, controller.getAssetsEnterprise);
router.post('/assets-enterprise', jwtAuth, controller.createAssetEnterprise);
router.get('/assets-enterprise/:assetId/maintenance-history', jwtAuth, controller.getAssetMaintenanceHistory);

// ===== LPU ENTERPRISE COM VERSIONAMENTO =====
router.get('/price-lists-enterprise', jwtAuth, controller.getPriceListsEnterprise);
router.post('/price-lists-enterprise', jwtAuth, controller.createPriceListEnterprise);
router.get('/price-lists-enterprise/:priceListId/items', jwtAuth, controller.getPriceListItems);

// ===== MOTOR DE PREÇOS AVANÇADO =====
router.get('/pricing-rules-engine', jwtAuth, controller.getPricingRulesEngine);
router.post('/price-simulations', jwtAuth, controller.createPriceSimulation);

// ===== COMPLIANCE E AUDITORIA =====
router.get('/audit-trails-enterprise', jwtAuth, controller.getAuditTrailsEnterprise);
router.get('/compliance-alerts', jwtAuth, controller.getComplianceAlerts);
router.get('/certifications', jwtAuth, controller.getCertifications);

// ===== MOBILE E OFFLINE =====
router.get('/mobile-devices', jwtAuth, controller.getMobileDevices);
router.get('/offline-sync-queue', jwtAuth, controller.getOfflineSyncQueue);

// ===== DASHBOARD STATS ETAPA 6 =====
router.get('/dashboard-stats-etapa6', jwtAuth, controller.getDashboardStatsEtapa6);

export default router;
