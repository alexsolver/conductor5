// NEW LOCATIONS MODULE - Routes
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { LocationController } from './application/controllers/LocationController';
import { CreateLocationUseCase } from './application/use-cases/CreateLocationUseCase';
import { FindLocationUseCase } from './application/use-cases/FindLocationUseCase';
import { UpdateLocationUseCase } from './application/use-cases/UpdateLocationUseCase';
import { DeleteLocationUseCase } from './application/use-cases/DeleteLocationUseCase';
import { DrizzleLocationRepository } from './infrastructure/repositories/DrizzleLocationRepository';

const router = Router();

// ✅ CLEAN ARCHITECTURE DEPENDENCY INJECTION per 1qa.md
const locationRepository = new DrizzleLocationRepository();
const createLocationUseCase = new CreateLocationUseCase(locationRepository);
const findLocationUseCase = new FindLocationUseCase(locationRepository);
const updateLocationUseCase = new UpdateLocationUseCase(locationRepository);
const deleteLocationUseCase = new DeleteLocationUseCase(locationRepository);

const controller = new LocationController(
  createLocationUseCase,
  findLocationUseCase,
  updateLocationUseCase,
  deleteLocationUseCase,
  locationRepository
);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Core location routes - ✅ CLEAN ARCHITECTURE per 1qa.md
router.get('/', controller.getLocations.bind(controller));
router.get('/stats', controller.getLocationStats.bind(controller));
router.get('/:id', controller.getLocationById.bind(controller));
router.post('/', controller.createLocation.bind(controller));
router.put('/:id', controller.updateLocation.bind(controller));
router.delete('/:id', controller.deleteLocation.bind(controller));

// ✅ CLEAN ARCHITECTURE - Only implemented methods per 1qa.md

export { router as locationsRouter };
export default router;