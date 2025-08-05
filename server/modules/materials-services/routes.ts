import { Router } from 'express';
import { jwtAuth, type AuthenticatedRequest } from '../../middleware/jwtAuth';
import { ItemController } from './application/controllers/ItemController';
import { SupplierController } from './application/controllers/SupplierController';
import { StockController } from './application/controllers/StockController';
import { AssetManagementController } from './application/controllers/AssetManagementController';
import { LPUController } from './application/controllers/LPUController';
import { ComplianceController } from './application/controllers/ComplianceController';
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
    stockController: new StockController(stockRepository),
    assetController: new AssetManagementController(),
    lpuController: new LPUController(db),
    complianceController: new ComplianceController()
  };
}

// ===== ITEMS ROUTES =====
router.post('/items', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.createItem(req, res);
});

router.get('/items', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.getItems(req, res);
});

router.get('/items/stats', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.getStats(req, res);
});

router.get('/items/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.getItem(req, res);
});

router.put('/items/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.updateItem(req, res);
});

router.delete('/items/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { itemController } = await getControllers(req.user.tenantId);
  return itemController.deleteItem(req, res);
});

// ===== LPU (LISTA DE PREÇOS UNITÁRIOS) ROUTES =====

// Price Lists - Basic CRUD
router.get('/price-lists', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getAllPriceLists(req, res);
});

router.get('/price-lists/stats', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getLPUStats(req, res);
});

router.get('/price-lists/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getPriceList(req, res);
});

router.post('/price-lists', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.createPriceList(req, res);
});

router.put('/price-lists/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.updatePriceList(req, res);
});

router.delete('/price-lists/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.deletePriceList(req, res);
});

// Price List Items Management
router.get('/price-lists/:priceListId/items', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getPriceListItems(req, res);
});

router.post('/price-lists/:priceListId/items', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.addPriceListItem(req, res);
});

router.put('/price-lists/items/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.updatePriceListItem(req, res);
});

router.delete('/price-lists/items/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.deletePriceListItem(req, res);
});

// Pricing Rules - Complete CRUD
router.get('/pricing-rules', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getAllPricingRules(req, res);
});

router.post('/pricing-rules', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.createPricingRule(req, res);
});

router.get('/pricing-rules/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getPricingRule(req, res);
});

router.put('/pricing-rules/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.updatePricingRule(req, res);
});

router.delete('/pricing-rules/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.deletePricingRule(req, res);
});

// Apply pricing rules to price list
router.post('/price-lists/:priceListId/apply-rules', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.applyRulesToPriceList(req, res);
});

// ===== SUPPLIERS ROUTES =====
router.post('/suppliers', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.createSupplier(req, res);
});

router.get('/suppliers', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.getSuppliers(req, res);
});

// ===== STOCK ROUTES =====
router.get('/stock/items', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.getStockItems(req, res);
});

// Dashboard overview
router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      success: true,
      data: {
        items: { total: 0, active: 0 },
        suppliers: { total: 0, active: 0 },
        stock: { locations: 0, movements: 0 },
        priceLists: { total: 0, active: 0 },
        pricingRules: { total: 0, active: 0 }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;