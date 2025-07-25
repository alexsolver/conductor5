import { Router } from "express";
import { PartsServicesController } from "./controller";
import { tenantPartsServicesController } from "./tenant-controller";
import { jwtAuth } from "../../middleware/jwtAuth";

const router = Router();
const controller = new PartsServicesController();
const tenantController = tenantPartsServicesController;

// Apply authentication middleware to all routes
router.use(jwtAuth);

// ============================================
// ITEMS ROUTES
// ============================================

// Items CRUD (using tenant controller for optimized tenant queries)
router.post("/items", tenantController.createItem.bind(tenantController));
router.get("/items", tenantController.getItems.bind(tenantController));
router.get("/items/:id", controller.getItemById.bind(controller));
router.put("/items/:id", controller.updateItem.bind(controller));
router.delete("/items/:id", controller.deleteItem.bind(controller));

// Item Links
router.post("/items/:itemId/links", controller.createItemLink.bind(controller));
router.get("/items/:itemId/links", controller.getItemLinks.bind(controller));
router.delete("/item-links/:id", controller.deleteItemLink.bind(controller));

// ============================================
// STOCK LOCATIONS ROUTES
// ============================================

router.post("/stock-locations", controller.createStockLocation.bind(controller));
router.get("/stock-locations", tenantController.getStockLocations.bind(tenantController));
router.get("/stock-locations/:id", controller.getStockLocationById.bind(controller));
router.put("/stock-locations/:id", controller.updateStockLocation.bind(controller));

// ============================================
// STOCK LEVELS ROUTES
// ============================================

router.get("/stock-levels", tenantController.getStockLevels.bind(tenantController));
router.put("/stock-levels/:itemId/:locationId", controller.updateStockLevel.bind(controller));

// ============================================
// STOCK MOVEMENTS ROUTES
// ============================================

router.post("/stock-movements", controller.createStockMovement.bind(controller));
router.get("/stock-movements", controller.getStockMovements.bind(controller));

// ============================================
// SUPPLIERS ROUTES
// ============================================

router.post("/suppliers", tenantController.createSupplier.bind(tenantController));
router.get("/suppliers", tenantController.getSuppliers.bind(tenantController));
router.get("/suppliers/:id", controller.getSupplierById.bind(controller));
router.put("/suppliers/:id", controller.updateSupplier.bind(controller));
router.delete("/suppliers/:id", controller.deleteSupplier.bind(controller));

// ============================================
// SUPPLIER CATALOG ROUTES
// ============================================

router.post("/supplier-catalog", controller.createSupplierCatalogItem.bind(controller));
router.get("/supplier-catalog", controller.getSupplierCatalog.bind(controller));
router.put("/supplier-catalog/:id", controller.updateSupplierCatalogItem.bind(controller));
router.delete("/supplier-catalog/:id", controller.deleteSupplierCatalogItem.bind(controller));

// ============================================
// DASHBOARD ROUTES
// ============================================

router.get("/dashboard/stats", tenantController.getDashboardStats.bind(tenantController));

export default router;