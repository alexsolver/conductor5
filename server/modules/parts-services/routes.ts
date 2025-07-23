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

export default router;