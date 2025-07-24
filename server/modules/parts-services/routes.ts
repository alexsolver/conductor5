import { Router } from 'express';
import { DirectPartsServicesRepository } from './infrastructure/repositories/DirectPartsServicesRepository';
import { PartsServicesController } from './application/controllers/PartsServicesController';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

const router = Router();

// Initialize repository and controller
const repository = new DirectPartsServicesRepository();
const controller = new PartsServicesController(repository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== DASHBOARD =====
router.get('/dashboard/stats', controller.getDashboardStats);

// ===== MÓDULO 1: GESTÃO DE PEÇAS =====
router.post('/parts', controller.createPart);
router.get('/parts', controller.getParts);

// ===== MÓDULO 2: CONTROLE DE ESTOQUE =====
router.post('/inventory', controller.createInventoryEntry);
router.get('/inventory', controller.getInventory);

// ===== MÓDULO 3: GESTÃO DE FORNECEDORES =====
router.post('/suppliers', controller.createSupplier);
router.get('/suppliers', controller.getSuppliers);

// ===== MÓDULO 4: PLANEJAMENTO E COMPRAS =====
router.post('/purchase-orders-complete', controller.createPurchaseOrderComplete);
router.get('/purchase-orders-complete', controller.getPurchaseOrdersComplete);
router.post('/purchase-orders', controller.createPurchaseOrderComplete);
router.get('/purchase-orders', controller.getPurchaseOrdersComplete);

// ===== MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS =====
router.post('/service-integrations', controller.createServiceIntegration);
router.get('/service-integrations', controller.getServiceIntegrations);
router.post('/work-order-integrations', controller.createWorkOrderIntegration);

// ===== MÓDULO 6: LOGÍSTICA E DISTRIBUIÇÃO =====
router.post('/transfers', controller.createTransfer);
router.get('/transfers', controller.getTransfers);
router.post('/returns', controller.createReturn);

// ===== MÓDULO 7: CONTROLE DE ATIVOS =====
router.post('/assets-complete', controller.createAssetComplete);
router.get('/assets-complete', controller.getAssetsComplete);
router.post('/asset-maintenance', controller.createAssetMaintenance);
router.post('/asset-movements', controller.createAssetMovement);

// ===== MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU) =====
router.post('/price-lists-complete', controller.createPriceListComplete);
router.get('/price-lists-complete', controller.getPriceListsComplete);
router.post('/price-list-items', controller.createPriceListItem);

// ===== MÓDULO 9: FUNCIONALIDADES AVANÇADAS DE PREÇO =====
router.post('/pricing-tables', controller.createPricingTable);
router.post('/pricing-rules', controller.createPricingRule);
router.post('/price-history', controller.createPriceHistory);

// ===== MÓDULO 10: COMPLIANCE E AUDITORIA =====
router.post('/audit-logs-complete', controller.createAuditLogComplete);
router.post('/certifications', controller.createCertification);
router.post('/compliance-alerts', controller.createComplianceAlert);

// ===== MÓDULO 11: DIFERENCIAIS AVANÇADOS =====
router.post('/budget-simulations', controller.createBudgetSimulation);
router.get('/budget-simulations', controller.getBudgetSimulations);
router.post('/dashboard-configs', controller.createDashboardConfig);
router.post('/integration-apis', controller.createIntegrationApi);
router.post('/offline-sync', controller.createOfflineSync);

export default router;