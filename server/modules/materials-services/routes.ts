import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { ItemController } from './application/controllers/ItemController';
import { SupplierController } from './application/controllers/SupplierController';
import { ItemRepository } from './infrastructure/repositories/ItemRepository';
import { SupplierRepository } from './infrastructure/repositories/SupplierRepository';

// Create router
const router = Router();

// Initialize repositories and controllers
// Note: In a real implementation, you would use dependency injection
let itemController: ItemController;
let supplierController: SupplierController;

// Initialize function to be called with database connection
export function initializeMaterialsServicesRoutes(db: any) {
  const itemRepository = new ItemRepository(db);
  const supplierRepository = new SupplierRepository(db);
  
  itemController = new ItemController(itemRepository);
  supplierController = new SupplierController(supplierRepository);
}

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Items routes
router.post('/items', (req, res) => itemController.createItem(req, res));
router.get('/items', (req, res) => itemController.getItems(req, res));
router.get('/items/stats', (req, res) => itemController.getStats(req, res));
router.get('/items/:id', (req, res) => itemController.getItem(req, res));
router.put('/items/:id', (req, res) => itemController.updateItem(req, res));
router.delete('/items/:id', (req, res) => itemController.deleteItem(req, res));
router.post('/items/:id/attachments', (req, res) => itemController.addAttachment(req, res));
router.post('/items/:id/links', (req, res) => itemController.addLink(req, res));

// Suppliers routes
router.post('/suppliers', (req, res) => supplierController.createSupplier(req, res));
router.get('/suppliers', (req, res) => supplierController.getSuppliers(req, res));
router.get('/suppliers/stats', (req, res) => supplierController.getStats(req, res));
router.get('/suppliers/:id', (req, res) => supplierController.getSupplier(req, res));
router.put('/suppliers/:id', (req, res) => supplierController.updateSupplier(req, res));
router.delete('/suppliers/:id', (req, res) => supplierController.deleteSupplier(req, res));
router.post('/suppliers/:id/catalog', (req, res) => supplierController.addCatalogItem(req, res));

// Dashboard/Overview routes
router.get('/dashboard', jwtAuth, async (req, res) => {
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