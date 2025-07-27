// NEW LOCATIONS MODULE - Routes
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { LocationsController } from './LocationsController';

const router = Router();
const controller = new LocationsController();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Core location routes
router.get('/', controller.getLocations.bind(controller));
router.get('/stats', controller.getLocationStats.bind(controller));
router.get('/coverage-analysis', controller.getCoverageAnalysis.bind(controller));
router.get('/nearest', controller.findNearestLocations.bind(controller));
router.get('/:id', controller.getLocation.bind(controller));
router.post('/', controller.createLocation.bind(controller));
router.put('/:id', controller.updateLocation.bind(controller));
router.delete('/:id', controller.deleteLocation.bind(controller));

// Location segments routes
router.get('/:locationId/segments', controller.getLocationSegments.bind(controller));
router.post('/segments', controller.createLocationSegment.bind(controller));

// Location areas routes
router.get('/:locationId/areas', controller.getLocationAreas.bind(controller));
router.post('/areas', controller.createLocationArea.bind(controller));

// Routes management
router.get('/routes/all', controller.getRoutes.bind(controller));
router.post('/routes', controller.createRoute.bind(controller));

// Area groups management
router.get('/groups/all', controller.getAreaGroups.bind(controller));
router.post('/groups', controller.createAreaGroup.bind(controller));

// Sprint 2 Routes - Advanced Features
router.post('/:id/favorite', controller.toggleFavorite.bind(controller));
router.post('/:id/tags', controller.addTag.bind(controller));
router.delete('/:id/tags', controller.removeTag.bind(controller));

export { router as locationsRouter };