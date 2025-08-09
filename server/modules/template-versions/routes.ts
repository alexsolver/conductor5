
import { Router } from 'express';
import { TemplateVersionController } from './application/controllers/TemplateVersionController';

const router = Router();
const templateVersionController = new TemplateVersionController();

// Template version routes
router.get('/versions', templateVersionController.getVersions);
router.post('/versions', templateVersionController.createVersion);
router.get('/versions/:id', templateVersionController.getVersionById);

export default router;
