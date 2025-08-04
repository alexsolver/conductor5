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
    lpuController: new LPUController(),
    complianceController: new ComplianceController()
  };
}

// Items routes
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

// ===================================
// ASSET MANAGEMENT ROUTES
// ===================================

// Assets CRUD
router.get('/assets', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAllAssets(req, res);
});

router.get('/assets/stats', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAssetStats(req, res);
});

router.get('/assets/hierarchy', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAssetHierarchy(req, res);
});

router.get('/assets/:id', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAssetById(req, res);
});

router.post('/assets', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.createAsset(req, res);
});

router.put('/assets/:id', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.updateAsset(req, res);
});

router.delete('/assets/:id', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.deleteAsset(req, res);
});

// Asset Hierarchy
router.get('/assets/:parentId/children', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAssetChildren(req, res);
});

// Asset Maintenance
router.get('/assets/maintenance', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAllMaintenance(req, res);
});

router.post('/assets/maintenance', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.createMaintenance(req, res);
});

router.put('/assets/maintenance/:id', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.updateMaintenance(req, res);
});

// Asset Meters
router.get('/assets/:assetId/meters', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAssetMeters(req, res);
});

router.post('/assets/meters', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.addMeterReading(req, res);
});

// Asset Location & Geolocation
router.get('/assets/:assetId/location', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAssetLocation(req, res);
});

router.put('/assets/:assetId/location', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.updateAssetLocation(req, res);
});

// QR Code Management
router.post('/assets/:assetId/qr-code', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.generateQRCode(req, res);
});

router.get('/assets/qr/:qrCode', async (req: AuthenticatedRequest, res) => {
  const { assetController } = await getControllers(req.user.tenantId);
  return assetController.getAssetByQRCode(req, res);
});

// ===================================
// LPU - LISTA DE PREÇOS UNIFICADA ROUTES
// ===================================

// Price Lists CRUD
router.get('/price-lists', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getAllPriceLists(req, res);
});

router.get('/price-lists/stats', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getLPUStats(req, res);
});

router.get('/price-lists/:id', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getPriceListById(req, res);
});

router.post('/price-lists', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.createPriceList(req, res);
});

router.put('/price-lists/:id', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.updatePriceList(req, res);
});

// Price List Versions & Workflow
router.get('/price-lists/:priceListId/versions', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getPriceListVersions(req, res);
});

router.post('/price-lists/versions', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.createPriceListVersion(req, res);
});

router.post('/price-lists/versions/:versionId/submit', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.submitForApproval(req, res);
});

router.post('/price-lists/versions/:versionId/approve', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.approvePriceList(req, res);
});

router.post('/price-lists/versions/:versionId/reject', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.rejectPriceList(req, res);
});

// Price List Items
router.get('/price-lists/:priceListId/items', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getPriceListItems(req, res);
});

router.post('/price-lists/items', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.addPriceListItem(req, res);
});

router.put('/price-lists/items/:id', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.updatePriceListItem(req, res);
});

router.delete('/price-lists/items/:id', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.deletePriceListItem(req, res);
});

// Pricing Rules
router.get('/pricing-rules', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getAllPricingRules(req, res);
});

router.post('/pricing-rules', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.createPricingRule(req, res);
});

router.put('/pricing-rules/:id', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.updatePricingRule(req, res);
});

router.delete('/pricing-rules/:id', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.deletePricingRule(req, res);
});

// Dynamic Pricing
router.get('/price-lists/:priceListId/dynamic-pricing', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.getDynamicPricing(req, res);
});

router.put('/dynamic-pricing', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.updateDynamicPricing(req, res);
});

// Margin Control
router.put('/price-lists/:priceListId/margins', async (req: AuthenticatedRequest, res) => {
  const { lpuController } = await getControllers(req.user.tenantId);
  return lpuController.bulkUpdateMargins(req, res);
});

// ===================================
// COMPLIANCE MANAGEMENT ROUTES
// ===================================

// Audits CRUD
router.get('/compliance/audits', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getAllAudits(req, res);
});

router.get('/compliance/audits/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getAuditById(req, res);
});

router.post('/compliance/audits', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.createAudit(req, res);
});

router.put('/compliance/audits/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.updateAudit(req, res);
});

router.delete('/compliance/audits/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.deleteAudit(req, res);
});

// Certifications CRUD
router.get('/compliance/certifications', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getAllCertifications(req, res);
});

router.get('/compliance/certifications/expiring', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getExpiringCertifications(req, res);
});

router.get('/compliance/certifications/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getCertificationById(req, res);
});

router.post('/compliance/certifications', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.createCertification(req, res);
});

router.put('/compliance/certifications/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.updateCertification(req, res);
});

router.delete('/compliance/certifications/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.deleteCertification(req, res);
});

// Evidence Management
router.get('/compliance/evidence', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getAllEvidence(req, res);
});

router.post('/compliance/evidence', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.createEvidence(req, res);
});

router.put('/compliance/evidence/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.updateEvidence(req, res);
});

router.delete('/compliance/evidence/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.deleteEvidence(req, res);
});

router.post('/compliance/evidence/:id/verify', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.verifyEvidence(req, res);
});

// Alerts Management
router.get('/compliance/alerts', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getAllAlerts(req, res);
});

router.post('/compliance/alerts', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.createAlert(req, res);
});

router.post('/compliance/alerts/:id/acknowledge', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.acknowledgeAlert(req, res);
});

router.post('/compliance/alerts/:id/resolve', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.resolveAlert(req, res);
});

router.post('/compliance/alerts/generate-expiration', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.generateExpirationAlerts(req, res);
});

// Compliance Scores
router.get('/compliance/scores', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getAllScores(req, res);
});

router.get('/compliance/scores/:entityType/:entityId', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getScoreByEntity(req, res);
});

router.post('/compliance/scores', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.createScore(req, res);
});

router.put('/compliance/scores/:id', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.updateScore(req, res);
});

router.post('/compliance/scores/:entityType/:entityId/calculate', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.calculateComplianceScore(req, res);
});

// Compliance Statistics
router.get('/compliance/stats', async (req: AuthenticatedRequest, res) => {
  const { complianceController } = await getControllers(req.user.tenantId);
  return complianceController.getComplianceStats(req, res);
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
        assets: { total: 0, active: 0, maintenance: 0 },
        priceLists: { total: 0, active: 0, pendingApproval: 0 },
        compliance: { audits: 0, certifications: 0, activeAlerts: 0 }
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