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

// ===== ACTIVITY TYPES =====
router.post('/activity-types', controller.createActivityType);
router.get('/activity-types', controller.getActivityTypes);
router.get('/activity-types/:id', controller.getActivityTypeById);
router.put('/activity-types/:id', controller.updateActivityType);
router.delete('/activity-types/:id', controller.deleteActivityType);

// ===== PARTS =====
router.post('/parts', controller.createPart);
router.get('/parts', controller.getParts);
router.get('/parts/:id', controller.getPartById);
router.put('/parts/:id', controller.updatePart);
router.delete('/parts/:id', controller.deletePart);
router.get('/parts/stats', controller.getPartsStats);

// ===== SERVICE KITS =====
router.post('/service-kits', controller.createServiceKit);
router.get('/service-kits', controller.getServiceKits);
router.get('/service-kits/:id', controller.getServiceKitById);
router.put('/service-kits/:id', controller.updateServiceKit);
router.delete('/service-kits/:id', controller.deleteServiceKit);

// ===== INVENTORY =====
router.post('/inventory', controller.createInventoryItem);
router.get('/inventory', controller.getInventory);
router.put('/inventory/adjust/:partId', controller.adjustInventory);

// ===== SUPPLIERS =====
router.post('/suppliers', controller.createSupplier);
router.get('/suppliers', controller.getSuppliers);
router.get('/suppliers/:id', controller.getSupplierById);
router.put('/suppliers/:id', controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);

// ===== STOCK MOVEMENTS =====
router.post('/stock-movements', controller.createStockMovement);
router.get('/stock-movements', controller.getStockMovements);

// ===== QUOTATIONS =====
router.post('/quotations', controller.createQuotation);
router.get('/quotations', controller.getQuotations);
router.put('/quotations/:id/status', controller.updateQuotationStatus);

// ===== PURCHASE ORDERS =====
router.post('/purchase-orders', controller.createPurchaseOrder);
router.get('/purchase-orders', controller.getPurchaseOrders);
router.put('/purchase-orders/:id/status', controller.updatePurchaseOrderStatus);

// ===== ASSETS =====
router.post('/assets', controller.createAsset);
router.get('/assets', controller.getAssets);
router.put('/assets/:id/status', controller.updateAssetStatus);

// ===== PRICE LISTS =====
router.post('/price-lists', controller.createPriceList);
router.get('/price-lists', controller.getPriceLists);

// ===== SUPPLIER EVALUATIONS =====
router.post('/supplier-evaluations', controller.createSupplierEvaluation);
router.get('/supplier-evaluations', controller.getSupplierEvaluations);

// ===== AUDIT LOGS =====
router.post('/audit-logs', controller.createAuditLog);
router.get('/audit-logs', controller.getAuditLogs);

// ===== DASHBOARD STATS =====
router.get('/dashboard/stats', controller.getDashboardStats);

// =====================================================
// MÓDULOS AVANÇADOS 1-4: NOVAS ROTAS PARA SISTEMA COMPLETO
// =====================================================

// ===== MÓDULO 1: GESTÃO DE PEÇAS AVANÇADA =====
// Categorias de peças
router.post('/part-categories', controller.createPartCategory);
router.get('/part-categories', controller.getPartCategories);

// Especificações técnicas - TODO: implementar
// router.post('/part-specifications', controller.createPartSpecification);
// router.get('/parts/:partId/specifications', controller.getPartSpecifications);

// Códigos de identificação - TODO: implementar
// router.post('/part-identification', controller.createPartIdentification);

// ===== MÓDULO 2: CONTROLE DE ESTOQUE MULTI-LOCALIZAÇÃO =====
// Localizações de estoque
router.post('/stock-locations', controller.createStockLocation);
router.get('/stock-locations', controller.getStockLocations);

// Inventário multi-localização
router.post('/inventory-multi-location', controller.createInventoryMultiLocation);
router.get('/inventory-by-location', controller.getInventoryByLocation);

// Movimentações detalhadas de estoque - TODO: implementar
// router.post('/stock-movements-detailed', controller.createStockMovementDetailed);

// Reservas de estoque
router.post('/stock-reservations', controller.createStockReservation);
router.get('/stock-reservations', controller.getStockReservations);

// ===== MÓDULO 3: GESTÃO DE FORNECEDORES AVANÇADA =====
// Catálogo de produtos dos fornecedores
router.post('/supplier-catalog', controller.createSupplierCatalogItem);
router.get('/supplier-catalog', controller.getSupplierCatalog);

// Histórico de compras - TODO: implementar
// router.post('/purchase-history', controller.createPurchaseHistory);

// Performance de fornecedores
router.post('/supplier-performance', controller.createSupplierPerformance);
router.get('/supplier-performance', controller.getSupplierPerformance);

// ===== MÓDULO 4: PLANEJAMENTO E COMPRAS =====
// Análise de demanda
router.post('/demand-analysis', controller.createDemandAnalysis);
router.get('/demand-analysis', controller.getDemandAnalysis);

// Ordens de compra avançadas
router.post('/purchase-orders-advanced', controller.createPurchaseOrderAdvanced);
router.get('/purchase-orders-advanced', controller.getPurchaseOrdersAdvanced);
router.put('/purchase-orders/:poId/approve', controller.approvePurchaseOrder);

// =====================================================
// MÓDULOS 5-11: ROTAS PARA SISTEMA COMPLETO
// =====================================================

// ===== MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS =====
router.post('/service-integrations', controller.createServiceIntegration);
router.get('/service-integrations-advanced', controller.getServiceIntegrationsAdvanced);
router.post('/work-order-integrations', controller.createWorkOrderIntegration);

// ===== MÓDULO 6: LOGÍSTICA E DISTRIBUIÇÃO =====
router.post('/transfers', controller.createTransfer);
router.get('/transfers', controller.getTransfers);
router.post('/returns', controller.createReturn);

// ===== MÓDULO 7: CONTROLE DE ATIVOS =====
router.post('/assets-complete', controller.createAssetComplete);
router.post('/asset-maintenance', controller.createAssetMaintenance);
router.post('/asset-movements', controller.createAssetMovement);

// ===== MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU) =====
router.post('/price-lists-complete', controller.createPriceListComplete);
router.post('/price-list-items', controller.createPriceListItem);

// ===== MÓDULO 9: FUNCIONALIDADES AVANÇADAS DE PREÇO =====
router.post('/pricing-tables', controller.createPricingTable);
router.post('/pricing-rules', controller.createPricingRule);
router.post('/price-history', controller.createPriceHistory);

// ===== MÓDULO 10: COMPLIANCE E AUDITORIA =====
router.post('/audit-logs-complete', controller.createAuditLogComplete);
router.post('/certifications', controller.createCertification);
router.post('/compliance-alerts', controller.createComplianceAlert);
router.get('/compliance-alerts', controller.getComplianceAlerts);

// ===== MÓDULO 11: DIFERENCIAIS AVANÇADOS =====
router.post('/budget-simulations', controller.createBudgetSimulation);
router.get('/budget-simulations', controller.getBudgetSimulations);
router.post('/dashboard-configs', controller.createDashboardConfig);
router.post('/integration-apis', controller.createIntegrationApi);
router.post('/offline-sync', controller.createOfflineSync);

export default router;