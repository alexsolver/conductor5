
import { Router } from 'express';
import { MaterialsServicesController } from './application/controllers/MaterialsServicesController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const controller = new MaterialsServicesController();

// Clean route handlers - delegate to controller
router.get('/', jwtAuth, (req, res) => controller.index(req, res));
router.post('/', jwtAuth, (req, res) => controller.create(req, res));
router.get('/:id', jwtAuth, (req, res) => controller.show(req, res));
router.put('/:id', jwtAuth, (req, res) => controller.update(req, res));
router.delete('/:id', jwtAuth, (req, res) => controller.delete(req, res));

export default router;
