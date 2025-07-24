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

// ==================== EMPRESAS CLIENTES ====================
router.get('/customer-companies', controller.getCustomerCompanies);
router.post('/customer-companies', controller.createCustomerCompany);
router.put('/customer-companies/:id', controller.updateCustomerCompany);
router.delete('/customer-companies/:id', controller.deleteCustomerCompany);

// ==================== LOCALIZAÇÕES DE ESTOQUE ====================
router.get('/stock-locations', controller.getStockLocations);
router.post('/stock-locations', controller.createStockLocation);

// ==================== CONTROLE DE ESTOQUE ====================
router.get('/inventory', controller.getInventory);
router.put('/inventory/:id', controller.updateInventory);

// ==================== MOVIMENTAÇÕES DE ESTOQUE ====================
router.get('/stock-movements', controller.getStockMovements);
router.post('/stock-movements', controller.createStockMovement);

// ==================== KITS DE SERVIÇO ====================
router.get('/service-kits', controller.getServiceKits);
router.post('/service-kits', controller.createServiceKit);

// ==================== LISTAS DE PREÇOS ====================
router.get('/price-lists', controller.getPriceLists);
router.post('/price-lists', controller.createPriceList);

// ==================== ATIVOS ====================
router.get('/assets', controller.getAssets);
router.post('/assets', controller.createAsset);

export default router;