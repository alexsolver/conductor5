import { Router } from 'express';
import { jwtAuth, type AuthenticatedRequest } from '../../middleware/jwtAuth';
import { ItemController } from './application/controllers/ItemController';
import { SupplierController } from './application/controllers/SupplierController';
import { StockController } from './application/controllers/StockController';
import { ItemRepository } from './infrastructure/repositories/ItemRepository';
import { SupplierRepository } from './infrastructure/repositories/SupplierRepository';
import { StockRepository } from './infrastructure/repositories/StockRepository';
import { schemaManager } from '../../db';

// Create router
const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Helper function to initialize controllers for each request
async function getControllers(tenantId: string) {
  const { db } = await schemaManager.getTenantDb(tenantId);
  const itemRepository = new ItemRepository(db);
  const supplierRepository = new SupplierRepository(db);
  const stockRepository = new StockRepository(db);
  
  return {
    itemController: new ItemController(itemRepository),
    supplierController: new SupplierController(supplierRepository),
    stockController: new StockController(stockRepository)
  };
}

// Items routes
router.post('/items', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.createItem(req, res);
});

router.get('/items', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.getItems(req, res);
});

router.get('/items/stats', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.getStats(req, res);
});

router.get('/items/:id', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.getItem(req, res);
});

router.put('/items/:id', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.updateItem(req, res);
});

router.delete('/items/:id', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.deleteItem(req, res);
});

router.post('/items/:id/attachments', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.addAttachment(req, res);
});

router.post('/items/:id/links', async (req: AuthenticatedRequest, res) => {
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.addLink(req, res);
});

// Suppliers routes
router.post('/suppliers', async (req: AuthenticatedRequest, res) => {
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.createSupplier(req, res);
});

router.get('/suppliers', async (req: AuthenticatedRequest, res) => {
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.getSuppliers(req, res);
});

router.get('/suppliers/stats', async (req: AuthenticatedRequest, res) => {
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.getStats(req, res);
});

router.get('/suppliers/:id', async (req: AuthenticatedRequest, res) => {
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.getSupplier(req, res);
});

router.put('/suppliers/:id', async (req: AuthenticatedRequest, res) => {
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.updateSupplier(req, res);
});

router.delete('/suppliers/:id', async (req: AuthenticatedRequest, res) => {
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.deleteSupplier(req, res);
});

router.post('/suppliers/:id/catalog', async (req: AuthenticatedRequest, res) => {
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.addCatalogItem(req, res);
});

// Stock Management routes
router.get('/stock/items', async (req: AuthenticatedRequest, res) => {
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.getStockItems(req, res);
});

router.get('/stock/stats', async (req: AuthenticatedRequest, res) => {
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.getStockStats(req, res);
});

router.get('/stock/movements', async (req: AuthenticatedRequest, res) => {
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.getStockMovements(req, res);
});

router.post('/stock/movements', async (req: AuthenticatedRequest, res) => {
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.createStockMovement(req, res);
});

router.post('/stock/adjustments', async (req: AuthenticatedRequest, res) => {
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.createStockAdjustment(req, res);
});

router.get('/warehouses', async (req: AuthenticatedRequest, res) => {
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.getWarehouses(req, res);
});

// Dashboard/Overview routes
router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    // This would aggregate data from multiple repositories
    res.json({
      success: true,
      data: {
        items: { total: 0, active: 0 },
        suppliers: { total: 0, active: 0 },
        stock: { locations: 0, movements: 0 },
        services: { types: 0, executions: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

export { router as materialsServicesRoutes };