import { Router } from 'express';
import { PartsServicesController } from '../application/controllers/PartsServicesController';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const controller = new PartsServicesController();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== ACTIVITY TYPES ROUTES =====
router.post('/activity-types', controller.createActivityType);
router.get('/activity-types', controller.getActivityTypes);

// ===== PARTS ROUTES =====
router.post('/parts', controller.createPart);
router.get('/parts', controller.getParts);
router.get('/parts/stats', controller.getPartsStats);
router.put('/parts/:id', controller.updatePart);
router.delete('/parts/:id', controller.deletePart);

// ===== SUPPLIERS ROUTES =====
router.post('/suppliers', controller.createSupplier);
router.get('/suppliers', controller.getSuppliers);
router.put('/suppliers/:id', controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);

// ===== INVENTORY ROUTES =====
router.post('/inventory', controller.createInventoryItem);
router.get('/inventory', controller.getInventory);
router.put('/inventory/:id/adjust', controller.adjustInventory);

// ===== SERVICE KITS ROUTES =====
router.post('/service-kits', controller.createServiceKit);
router.get('/service-kits', controller.getServiceKits);
router.put('/service-kits/:id', controller.updateServiceKit);
router.delete('/service-kits/:id', controller.deleteServiceKit);

export default router;