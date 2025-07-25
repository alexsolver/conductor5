import { Router } from 'express';
import { PartsServicesController } from './controller';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const controller = new PartsServicesController();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);

// ============================================
// ITEMS ROUTES - CRUD COMPLETO
// ============================================
router.post('/items', controller.createItem);
router.get('/items', controller.getItems);
router.get('/items/:id', controller.getItemById);
router.put('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.deleteItem);

// ============================================
// SUPPLIERS ROUTES - CRUD COMPLETO
// ============================================
router.post('/suppliers', controller.createSupplier);
router.get('/suppliers', controller.getSuppliers);
router.get('/suppliers/:id', controller.getSupplierById);
router.put('/suppliers/:id', controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);

// ============================================
// STOCK LOCATIONS ROUTES
// ============================================
router.post('/stock-locations', controller.createStockLocation);
router.get('/stock-locations', controller.getStockLocations);
router.get('/stock-locations/:id', controller.getStockLocationById); // added from original
router.put('/stock-locations/:id', controller.updateStockLocation); // added from original
router.delete('/stock-locations/:id', controller.deleteStockLocation); // added from original

// ============================================
// STOCK LEVELS ROUTES
// ============================================
router.get("/stock-levels", controller.getStockLevels); // added from original
router.put("/stock-levels/:itemId/:locationId", controller.updateStockLevel); // added from original

// ============================================
// STOCK MOVEMENTS ROUTES
// ============================================
router.post("/stock-movements", controller.createStockMovement); // added from original
router.get("/stock-movements", controller.getStockMovements); // added from original

// ============================================
// SUPPLIER CATALOG ROUTES
// ============================================
router.post("/supplier-catalog", controller.createSupplierCatalogItem); // added from original
router.get("/supplier-catalog", controller.getSupplierCatalog); // added from original
router.put("/supplier-catalog/:id", controller.updateSupplierCatalogItem); // added from original
router.delete("/supplier-catalog/:id", controller.deleteSupplierCatalogItem); // added from original

// ============================================
// VÍNCULOS E LINKS ROUTES (NOVOS)
// ============================================

// Vínculos item-item
router.post("/items/:itemId/item-links", controller.createItemLink); // added from original
router.get("/items/:itemId/item-links", controller.getItemLinks); // added from original
router.delete("/item-links/:linkId", controller.deleteItemLink); // added from original

// Vínculos item-cliente
router.post("/items/:itemId/customer-links", controller.createItemCustomerLink); // added from original
router.get("/items/:itemId/customer-links", controller.getItemCustomerLinks); // added from original
router.put("/customer-links/:linkId", controller.updateItemCustomerLink); // added from original

// Vínculos item-fornecedor
router.post("/items/:itemId/supplier-links", controller.createItemSupplierLink); // added from original
router.get("/items/:itemId/supplier-links", controller.getItemSupplierLinks); // added from original

// Anexos (upload de arquivos)
router.post("/items/:itemId/attachments", controller.uploadItemAttachment); // added from original
router.get("/items/:itemId/attachments", controller.getItemAttachments); // added from original
router.delete("/attachments/:attachmentId", controller.deleteItemAttachment); // added from original

// Kits de serviço
router.post("/service-kits", controller.createServiceKit); // added from original
router.get("/service-kits", controller.getServiceKits); // added from original
router.post("/service-kits/:kitId/items", controller.addItemToKit); // added from original
router.get("/service-kits/:kitId/items", controller.getKitItems); // added from original

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get('/dashboard/stats', controller.getDashboardStats);

// ============================================
// INVENTÁRIO / CONTROLE DE ESTOQUE ROUTES
// ============================================

// Dashboard de inventário
router.get('/inventory/stats', jwtAuth, controller.getInventoryStats); // added from original

// Stock Locations
router.get('/inventory/locations', jwtAuth, controller.getStockLocations); // added from original
router.post('/inventory/locations', jwtAuth, controller.createStockLocation); // added from original
router.get('/inventory/locations/:id', jwtAuth, controller.getStockLocationById); // added from original
router.put('/inventory/locations/:id', jwtAuth, controller.updateStockLocation); // added from original
router.delete('/inventory/locations/:id', jwtAuth, controller.deleteStockLocation); // added from original

// Stock Levels
router.get('/inventory/stock-levels', jwtAuth, controller.getStockLevels); // added from original
router.put('/inventory/stock-levels/:itemId/:locationId', jwtAuth, controller.updateStockLevel); // added from original

// Stock Movements
router.post('/inventory/movements', jwtAuth, controller.createStockMovement); // added from original
router.get('/inventory/movements', jwtAuth, controller.getStockMovements); // added from original

// Stock Transfers
router.post('/inventory/transfers', jwtAuth, controller.createStockTransfer); // added from original
router.get('/inventory/transfers', jwtAuth, controller.getStockTransfers); // added from original

// Service Kits
router.post('/inventory/service-kits', jwtAuth, controller.createServiceKit); // added from original
router.get('/inventory/service-kits', jwtAuth, controller.getServiceKits); // added from original
router.get('/inventory/service-kits/:id', jwtAuth, controller.getServiceKitById); // added from original

export { router as partsServicesRoutes };