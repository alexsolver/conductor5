
import { Router } from 'express';
import { TicketTemplateController } from './application/controllers/TicketTemplateController';

const router = Router();
const ticketTemplateController = new TicketTemplateController();

// Ticket template routes
router.get('/templates', ticketTemplateController.getTemplates);
router.post('/templates', ticketTemplateController.createTemplate);
router.get('/templates/:id', ticketTemplateController.getTemplateById);

export default router;
