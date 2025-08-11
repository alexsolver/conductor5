
import { Router } from 'express';
import { MaterialsServicesController } from './application/controllers/MaterialsServicesController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

// TODO: Implement dependency injection properly
// For now, creating a mock controller to prevent errors
const controller = new MaterialsServicesController(
  {} as any, // getMaterialsUseCase
  {} as any, // createMaterialUseCase  
  {} as any, // getServicesUseCase
  {} as any  // createServiceUseCase
);

// Clean route handlers - delegate to controller
router.get('/materials', jwtAuth, (req, res) => controller.getMaterials(req, res));
router.post('/materials', jwtAuth, (req, res) => controller.createMaterial(req, res));
router.get('/services', jwtAuth, (req, res) => controller.getServices(req, res));
router.post('/services', jwtAuth, (req, res) => controller.createService(req, res));

// Legacy routes for compatibility
router.get('/', jwtAuth, (req, res) => controller.index(req, res));
router.post('/', jwtAuth, (req, res) => controller.create(req, res));
router.get('/:id', jwtAuth, (req, res) => controller.show(req, res));
router.put('/:id', jwtAuth, (req, res) => controller.update(req, res));
router.delete('/:id', jwtAuth, (req, res) => controller.delete(req, res));

export default router;
