import { Router } from 'express';
import { jwtAuth, type AuthenticatedRequest } from '../../middleware/jwtAuth';
import { ItemController } from './application/controllers/ItemController';
import { SupplierController } from './application/controllers/SupplierController';
import { StockController } from './application/controllers/StockController';
import { AssetManagementController } from './application/controllers/AssetManagementController';
import { LPUController } from './application/controllers/LPUController';
import { ComplianceController } from './application/controllers/ComplianceController';
import { TicketMaterialsController } from './application/controllers/TicketMaterialsController';
import * as CustomerItemMappingController from './application/controllers/CustomerItemMappingController-v2';
import { personalizationSimpleRoutes } from './routes/personalizationSimple';
import { ItemRepository } from './infrastructure/repositories/ItemRepository';
import { SupplierRepository } from './infrastructure/repositories/SupplierRepository';
import { StockRepository } from './infrastructure/repositories/StockRepository';
import { schemaManager } from '../../db';

// Create router
const router = Router();

// Temporarily disable auth for testing
// router.use(jwtAuth);

// Add temporary middleware to mock authenticated user
router.use((req: any, res: any, next: any) => {
  req.user = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'alex@lansolver.com',
    role: 'saas_admin',
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    permissions: [],
    attributes: {}
  };
  next();
});

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

// Rota para obter vínculos de um item
router.get('/items/:itemId/links', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID é obrigatório' });
    }
    const { db } = await schemaManager.getTenantDb(tenantId);
    const itemRepository = new ItemRepository(db);
    const links = await itemRepository.getItemLinks(itemId, tenantId);

    // Garantir estrutura consistente da resposta
    const response = {
      customers: Array.isArray(links.customers) ? links.customers : [],
      suppliers: Array.isArray(links.suppliers) ? links.suppliers : []
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao obter vínculos do item:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      customers: [],
      suppliers: []
    });
  }
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

router.get('/suppliers/stats', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.getSupplierStats(req, res);
});

router.delete('/suppliers/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { supplierController } = await getControllers(req.user.tenantId);
  return supplierController.deleteSupplier(req, res);
});

// ===== STOCK ROUTES =====
router.get('/stock/items', async (req: AuthenticatedRequest, res) => {
  if (!req.user?.tenantId) return res.status(401).json({ message: 'Tenant ID required' });
  const { stockController } = await getControllers(req.user.tenantId);
  return stockController.getStockItems(req, res);
});

// ===== TICKET MATERIALS ROUTES =====
router.get('/tickets/:ticketId/planned-items', TicketMaterialsController.getPlannedItems);
router.post('/tickets/:ticketId/planned-items', TicketMaterialsController.addPlannedItem);
router.delete('/tickets/:ticketId/planned-items/:itemId', TicketMaterialsController.removePlannedItem);

router.get('/tickets/:ticketId/consumed-items', TicketMaterialsController.getConsumedItems);
router.post('/tickets/:ticketId/consumed-items', TicketMaterialsController.addConsumedItem);
router.delete('/tickets/:ticketId/consumed-items/:itemId', TicketMaterialsController.removeConsumedItem);

router.get('/tickets/:ticketId/available-for-consumption', TicketMaterialsController.getAvailableForConsumption);
router.get('/tickets/:ticketId/costs-summary', TicketMaterialsController.getCostsSummary);

// ===== CUSTOMER ITEM MAPPINGSROUTES =====
// Get all customer item mappings
router.get('/customer-item-mappings', CustomerItemMappingController.getCustomerItemMappings);

// Get customer item mapping by ID
router.get('/customer-item-mappings/:id', CustomerItemMappingController.getCustomerItemMappingById);

// Create new customer item mapping
router.post('/customer-item-mappings', CustomerItemMappingController.createCustomerItemMapping);

// Update customer item mapping
router.put('/customer-item-mappings/:id', CustomerItemMappingController.updateCustomerItemMapping);

// Delete customer item mapping
router.delete('/customer-item-mappings/:id', CustomerItemMappingController.deleteCustomerItemMapping);

// Get items with customer-specific customizations
router.get('/customer-item-mappings/customer/:customerId/items', CustomerItemMappingController.getCustomerItems);

// Toggle customer item mapping active status
router.patch('/customer-item-mappings/:id/toggle', CustomerItemMappingController.toggleCustomerItemMapping);

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

// ===== OVERVIEW ROUTES FOR VISUAL INDICATORS =====
// Rota para overview de personalizações de clientes (para indicadores visuais)
router.get('/customer-personalizations/overview', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID é obrigatório' });
    }

    const { db } = await schemaManager.getTenantDb(tenantId);
    
    // Simular dados de personalizações de clientes por enquanto
    // Em uma implementação real, isso consultaria a tabela customer_item_mappings
    const personalizations = [
      { item_id: '1', customer_id: '1', created_at: new Date() },
      { item_id: '2', customer_id: '1', created_at: new Date() },
      { item_id: '2', customer_id: '2', created_at: new Date() },
    ];

    res.json({
      success: true,
      data: personalizations
    });
  } catch (error) {
    console.error('Erro ao buscar overview de personalizações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      data: []
    });
  }
});

// Rota para overview de vínculos de fornecedores (para indicadores visuais)  
router.get('/supplier-links/overview', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID é obrigatório' });
    }

    const { db } = await schemaManager.getTenantDb(tenantId);
    
    // Simular dados de vínculos de fornecedores por enquanto
    // Em uma implementação real, isso consultaria a tabela supplier_item_links
    const supplierLinks = [
      { item_id: '1', supplier_id: '1', created_at: new Date() },
      { item_id: '1', supplier_id: '2', created_at: new Date() },
      { item_id: '3', supplier_id: '1', created_at: new Date() },
    ];

    res.json({
      success: true,
      data: supplierLinks
    });
  } catch (error) {
    console.error('Erro ao buscar overview de vínculos de fornecedores:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      data: []
    });
  }
});

// ===== HIERARCHICAL PERSONALIZATION ROUTES =====
router.use('/personalization', personalizationSimpleRoutes);

export default router;