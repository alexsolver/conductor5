import { Router } from 'express';
import { PartsServicesController } from '../application/controllers/PartsServicesController';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const controller = new PartsServicesController();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', controller.getDashboardStats);

// ==================== ITENS ====================
router.get('/items', controller.getItems);
router.get('/items/:id', controller.getItemById);
router.post('/items', controller.createItem);
router.put('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.deleteItem);

// ==================== FORNECEDORES ====================
router.get('/suppliers', controller.getSuppliers);
router.get('/suppliers/:id', controller.getSupplierById);
router.post('/suppliers', controller.createSupplier);
router.put('/suppliers/:id', controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);

// ==================== CONTROLE DE ESTOQUE ====================
router.get('/stock-locations', controller.getStockLocations);
router.post('/stock-locations', controller.createStockLocation);
router.get('/stock-levels', controller.getStockLevels);
router.post('/stock-movements', controller.createStockMovement);
router.get('/stock-movements', controller.getStockMovements);

// ==================== KITS DE SERVIÇO ====================
router.get('/service-kits', controller.getServiceKits);
router.post('/service-kits', controller.createServiceKit);
router.get('/service-kits/:kitId/items', controller.getServiceKitItems);

// ==================== LISTAS DE PREÇOS ====================
router.get('/price-lists', controller.getPriceLists);
router.post('/price-lists', controller.createPriceList);
router.get('/price-lists/:priceListId/items', controller.getPriceListItems);

// ==================== CONTROLE DE ATIVOS ====================
router.get('/assets', controller.getAssets);
router.post('/assets', controller.createAsset);

export default router;