
import { Router } from "express";
import { TicketMaterialsController } from "./TicketMaterialsController";
import { jwtAuth } from "../../middleware/jwtAuth";

const router = Router();
const ticketMaterialsController = new TicketMaterialsController();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Routes for ticket materials management
router.get("/tickets/:ticketId/materials", ticketMaterialsController.getTicketMaterials.bind(ticketMaterialsController));
router.post("/tickets/:ticketId/materials/planned", ticketMaterialsController.addPlannedItem.bind(ticketMaterialsController));
router.post("/tickets/:ticketId/materials/consumption", ticketMaterialsController.registerConsumption.bind(ticketMaterialsController));
router.post("/tickets/:ticketId/materials/bulk-consumption", ticketMaterialsController.registerBulkConsumption.bind(ticketMaterialsController));
router.get("/tickets/:ticketId/materials/available-items", ticketMaterialsController.getAvailableItems.bind(ticketMaterialsController));
router.put("/tickets/:ticketId/materials/:materialId", ticketMaterialsController.updateTicketMaterial.bind(ticketMaterialsController));
router.delete("/tickets/:ticketId/materials/:materialId", ticketMaterialsController.removeTicketMaterial.bind(ticketMaterialsController));
router.get("/tickets/:ticketId/materials/history", ticketMaterialsController.getMaterialsHistory.bind(ticketMaterialsController));
router.post("/tickets/:ticketId/materials/:materialId/approve", ticketMaterialsController.approveMaterialConsumption.bind(ticketMaterialsController));

export default router;
