
import { Router } from 'express';
import { TemplateHierarchyController } from './application/controllers/TemplateHierarchyController';

const router = Router();
const templateHierarchyController = new TemplateHierarchyController();

// Template hierarchy routes
router.get('/hierarchies', templateHierarchyController.getHierarchies);
router.post('/hierarchies', templateHierarchyController.createHierarchy);
router.get('/hierarchies/:id', templateHierarchyController.getHierarchyById);

export default router;
