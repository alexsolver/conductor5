
import express from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { ItemController } from './application/controllers/ItemController';
import { ItemCustomerLinksController } from './application/controllers/ItemCustomerLinksController';
import { LPUController } from './application/controllers/LPUController';
import { StockController } from './application/controllers/StockController';
import { SupplierController } from './application/controllers/SupplierController';
import { AssetManagementController } from './application/controllers/AssetManagementController';
import { ComplianceController } from './application/controllers/ComplianceController';
import { TicketMaterialsController } from './application/controllers/TicketMaterialsController';

const router = express.Router();

// Item Management Routes
const itemController = new ItemController();
router.get('/items', jwtAuth, itemController.getItems.bind(itemController));
router.post('/items', jwtAuth, itemController.createItem.bind(itemController));
router.get('/items/:id', jwtAuth, itemController.getItemById.bind(itemController));
router.put('/items/:id', jwtAuth, itemController.updateItem.bind(itemController));
router.delete('/items/:id', jwtAuth, itemController.deleteItem.bind(itemController));

// Item-Customer Links Routes
const itemCustomerLinksController = new ItemCustomerLinksController();
router.get('/items/:itemId/customer-links', jwtAuth, itemCustomerLinksController.getItemCustomerLinks.bind(itemCustomerLinksController));
router.post('/items/:itemId/customer-links', jwtAuth, itemCustomerLinksController.createItemCustomerLink.bind(itemCustomerLinksController));
router.put('/items/:itemId/customer-links/:linkId', jwtAuth, itemCustomerLinksController.updateItemCustomerLink.bind(itemCustomerLinksController));
router.delete('/items/:itemId/customer-links/:linkId', jwtAuth, itemCustomerLinksController.deleteItemCustomerLink.bind(itemCustomerLinksController));

// LPU (Lista de Preços Unitários) Routes
const lpuController = new LPUController();
router.get('/lpu', jwtAuth, lpuController.getLPUs.bind(lpuController));
router.post('/lpu', jwtAuth, lpuController.createLPU.bind(lpuController));
router.get('/lpu/:id', jwtAuth, lpuController.getLPUById.bind(lpuController));
router.put('/lpu/:id', jwtAuth, lpuController.updateLPU.bind(lpuController));
router.delete('/lpu/:id', jwtAuth, lpuController.deleteLPU.bind(lpuController));

// Stock Management Routes
const stockController = new StockController();
router.get('/stock', jwtAuth, stockController.getStockItems.bind(stockController));
router.post('/stock', jwtAuth, stockController.createStockItem.bind(stockController));
router.get('/stock/:id', jwtAuth, stockController.getStockItemById.bind(stockController));
router.put('/stock/:id', jwtAuth, stockController.updateStockItem.bind(stockController));
router.delete('/stock/:id', jwtAuth, stockController.deleteStockItem.bind(stockController));

// Supplier Management Routes
const supplierController = new SupplierController();
router.get('/suppliers', jwtAuth, supplierController.getSuppliers.bind(supplierController));
router.post('/suppliers', jwtAuth, supplierController.createSupplier.bind(supplierController));
router.get('/suppliers/:id', jwtAuth, supplierController.getSupplierById.bind(supplierController));
router.put('/suppliers/:id', jwtAuth, supplierController.updateSupplier.bind(supplierController));
router.delete('/suppliers/:id', jwtAuth, supplierController.deleteSupplier.bind(supplierController));

// Asset Management Routes
const assetController = new AssetManagementController();
router.get('/assets', jwtAuth, assetController.getAssets.bind(assetController));
router.post('/assets', jwtAuth, assetController.createAsset.bind(assetController));
router.get('/assets/:id', jwtAuth, assetController.getAssetById.bind(assetController));
router.put('/assets/:id', jwtAuth, assetController.updateAsset.bind(assetController));
router.delete('/assets/:id', jwtAuth, assetController.deleteAsset.bind(assetController));

// Compliance Routes
const complianceController = new ComplianceController();
router.get('/compliance', jwtAuth, complianceController.getComplianceReports.bind(complianceController));
router.post('/compliance/audit', jwtAuth, complianceController.createAuditReport.bind(complianceController));

// Ticket Materials Routes
const ticketMaterialsController = new TicketMaterialsController();
router.get('/tickets/:ticketId/materials', jwtAuth, ticketMaterialsController.getTicketMaterials.bind(ticketMaterialsController));
router.post('/tickets/:ticketId/materials', jwtAuth, ticketMaterialsController.addMaterialToTicket.bind(ticketMaterialsController));
router.put('/tickets/:ticketId/materials/:materialId', jwtAuth, ticketMaterialsController.updateTicketMaterial.bind(ticketMaterialsController));
router.delete('/tickets/:ticketId/materials/:materialId', jwtAuth, ticketMaterialsController.removeMaterialFromTicket.bind(ticketMaterialsController));

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', module: 'materials-services' });
});

export default router;
