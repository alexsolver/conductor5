import { Router } from 'express';
import { DirectPartsServicesRepository } from '../infrastructure/repositories/DirectPartsServicesRepository';
import { PartsServicesController } from '../application/controllers/PartsServicesController';
import { jwtAuth } from '../../../middleware/jwtAuth';
import partsServicesRoutes from './routes';
import etapa2Routes from './etapa2';
import etapa3Routes from './etapa3';
import etapa4Routes from './etapa4';
import etapa5Routes from './etapa5';
import etapa6Routes from './etapa6';
import etapa7Routes from './etapa7';

const router = Router();

// Initialize repository and controller
const repository = new DirectPartsServicesRepository();
const controller = new PartsServicesController(repository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== ACTIVITY TYPES ROUTES =====
router.post('/activity-types', controller.createActivityType);
router.get('/activity-types', controller.getActivityTypes);
router.get('/activity-types/:id', controller.getActivityTypeById);
router.put('/activity-types/:id', controller.updateActivityType);
router.delete('/activity-types/:id', controller.deleteActivityType);

// ===== PARTS ROUTES =====
router.post('/parts', controller.createPart);
router.get('/parts', controller.getParts);
router.get('/parts/stats', controller.getPartsStats);
router.get('/parts/:id', controller.getPartById);
router.put('/parts/:id', controller.updatePart);
router.delete('/parts/:id', controller.deletePart);

// ===== SUPPLIERS ROUTES =====
router.post('/suppliers', controller.createSupplier);
router.get('/suppliers', controller.getSuppliers);
router.get('/suppliers/:id', controller.getSupplierById);
router.put('/suppliers/:id', controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);

// ===== INVENTORY ROUTES =====
router.post('/inventory', controller.createInventoryItem);
router.get('/inventory', controller.getInventory);
router.put('/inventory/adjust/:partId', controller.adjustInventory);

// ===== SERVICE KITS ROUTES =====
router.post('/service-kits', controller.createServiceKit);
router.get('/service-kits', controller.getServiceKits);
router.get('/service-kits/:id', controller.getServiceKitById);
router.put('/service-kits/:id', controller.updateServiceKit);
router.delete('/service-kits/:id', controller.deleteServiceKit);

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

// Integrar rotas principais do módulo parts-services
router.use('/parts-services', partsServicesRoutes);

// Integrar rotas das etapas específicas
router.use('/parts-services/etapa2', etapa2Routes);
router.use('/parts-services/etapa3', etapa3Routes);
router.use('/parts-services/etapa4', etapa4Routes);
router.use('/parts-services/etapa5', etapa5Routes);
router.use('/parts-services/etapa6', etapa6Routes);
router.use('/parts-services/etapa7', etapa7Routes);

export default router;