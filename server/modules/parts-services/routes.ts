import { Router } from "express";
import { PartsServicesController } from "./controller";
import { jwtAuth } from "../../middleware/jwtAuth";

const router = Router();
const controller = new PartsServicesController();

// Apply authentication middleware to all routes
router.use(jwtAuth);

// ============================================
// ITEMS ROUTES
// ============================================

// Items CRUD
router.post("/items", controller.createItem.bind(controller));
router.get("/items", controller.getItems.bind(controller));
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
router.get("/stock-locations", controller.getStockLocations.bind(controller));
router.get("/stock-locations/:id", controller.getStockLocationById.bind(controller));
router.put("/stock-locations/:id", controller.updateStockLocation.bind(controller));

// ============================================
// STOCK LEVELS ROUTES
// ============================================

router.get("/stock-levels", controller.getStockLevels.bind(controller));
router.put("/stock-levels/:itemId/:locationId", controller.updateStockLevel.bind(controller));

// ============================================
// STOCK MOVEMENTS ROUTES
// ============================================

router.post("/stock-movements", controller.createStockMovement.bind(controller));
router.get("/stock-movements", controller.getStockMovements.bind(controller));

// ============================================
// SUPPLIERS ROUTES
// ============================================

router.post("/suppliers", controller.createSupplier.bind(controller));
router.get("/suppliers", controller.getSuppliers.bind(controller));
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

router.get("/dashboard/stats", controller.getDashboardStats.bind(controller));

export default router;