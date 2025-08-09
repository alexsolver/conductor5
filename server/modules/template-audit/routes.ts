
import { Router } from 'express';
import { TemplateAuditController } from './application/controllers/TemplateAuditController';

const router = Router();
const templateAuditController = new TemplateAuditController();

// Template audit routes
router.get('/audits', templateAuditController.getAudits);
router.post('/audits', templateAuditController.createAudit);
router.get('/audits/:id', templateAuditController.getAuditById);

export default router;
