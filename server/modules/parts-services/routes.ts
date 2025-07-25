import { Router } from "express";
import { PartsServicesController } from "./controller";
import { tenantPartsServicesController } from "./tenant-controller";
import { linksController, uploadAttachment } from "./links-controller";
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
// VÍNCULOS E LINKS ROUTES (NOVOS)
// ============================================

// Vínculos item-item
router.post("/items/:itemId/item-links", linksController.createItemLink.bind(linksController));
router.get("/items/:itemId/item-links", linksController.getItemLinks.bind(linksController));
router.delete("/item-links/:linkId", linksController.deleteItemLink.bind(linksController));

// Vínculos item-cliente
router.post("/items/:itemId/customer-links", linksController.createItemCustomerLink.bind(linksController));
router.get("/items/:itemId/customer-links", linksController.getItemCustomerLinks.bind(linksController));
router.put("/customer-links/:linkId", linksController.updateItemCustomerLink.bind(linksController));

// Vínculos item-fornecedor
router.post("/items/:itemId/supplier-links", linksController.createItemSupplierLink.bind(linksController));
router.get("/items/:itemId/supplier-links", linksController.getItemSupplierLinks.bind(linksController));

// Anexos (upload de arquivos)
router.post("/items/:itemId/attachments", uploadAttachment, linksController.uploadItemAttachment.bind(linksController));
router.get("/items/:itemId/attachments", linksController.getItemAttachments.bind(linksController));
router.delete("/attachments/:attachmentId", linksController.deleteItemAttachment.bind(linksController));

// Kits de serviço
router.post("/service-kits", linksController.createServiceKit.bind(linksController));
router.get("/service-kits", linksController.getServiceKits.bind(linksController));
router.post("/service-kits/:kitId/items", linksController.addItemToKit.bind(linksController));
router.get("/service-kits/:kitId/items", linksController.getKitItems.bind(linksController));

// ============================================
// DASHBOARD ROUTES
// ============================================

router.get("/dashboard/stats", tenantController.getDashboardStats.bind(tenantController));

export default router;