import { Router } from "express";
import { TicketHistoryController } from "./TicketHistoryController";
import { jwtAuth } from "../../middleware/jwtAuth";

const router = Router();

// Aplicar autenticação JWT a todas as rotas
router.use(jwtAuth);

// Rotas para histórico de tickets
router.get("/tickets/:ticketId/history", TicketHistoryController.getTicketHistory);
router.get("/customers/:customerId/tickets", TicketHistoryController.getCustomerTickets);
router.get("/customers/:customerId/stats", TicketHistoryController.getCustomerStats);

export default router;