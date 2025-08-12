/**
 * Location Clean Architecture Routes
 * 
 * RESTful API endpoints for Location management following Clean Architecture.
 * Integrates with existing legacy routes for backward compatibility.
 * 
 * @module LocationCleanRoutes
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { Router } from 'express';
import { LocationController } from './application/controllers/LocationController';
import { CreateLocationUseCase } from './application/use-cases/CreateLocationUseCase';
import { FindLocationUseCase } from './application/use-cases/FindLocationUseCase';
import { UpdateLocationUseCase } from './application/use-cases/UpdateLocationUseCase';
import { DeleteLocationUseCase } from './application/use-cases/DeleteLocationUseCase';
import { SimplifiedLocationRepository } from './infrastructure/repositories/SimplifiedLocationRepository';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

// Initialize dependencies (Dependency Injection)
const locationRepository = new SimplifiedLocationRepository();
const createLocationUseCase = new CreateLocationUseCase(locationRepository);
const findLocationUseCase = new FindLocationUseCase(locationRepository);
const updateLocationUseCase = new UpdateLocationUseCase(locationRepository);
const deleteLocationUseCase = new DeleteLocationUseCase(locationRepository);

const locationController = new LocationController(
  createLocationUseCase,
  findLocationUseCase,
  updateLocationUseCase,
  deleteLocationUseCase,
  locationRepository
);

// Apply authentication middleware to all routes
router.use(jwtAuth);

// === Core CRUD Operations ===

/**
 * Create a new location
 * POST /api/locations-v2
 * 
 * Body: {
 *   name: string,
 *   displayName?: string,
 *   description?: string,
 *   type: LocationType,
 *   address?: string,
 *   city?: string,
 *   state?: string,
 *   zipCode?: string,
 *   country: string,
 *   latitude?: number,
 *   longitude?: number,
 *   operatingHours?: OperatingHours
 * }
 */
router.post('/', async (req, res) => {
  await locationController.createLocation(req, res);
});

/**
 * Get location by ID
 * GET /api/locations-v2/:id
 */
router.get('/:id', async (req, res) => {
  await locationController.getLocationById(req, res);
});

/**
 * Get all locations with filtering
 * GET /api/locations-v2
 * 
 * Query params:
 * - page?: number
 * - limit?: number
 * - searchTerm?: string
 * - type?: LocationType
 * - city?: string
 * - state?: string
 * - isActive?: boolean
 * - isDefaultLocation?: boolean
 */
router.get('/', async (req, res) => {
  await locationController.getLocations(req, res);
});

/**
 * Update location
 * PUT /api/locations-v2/:id
 */
router.put('/:id', async (req, res) => {
  await locationController.updateLocation(req, res);
});

/**
 * Delete location (soft delete)
 * DELETE /api/locations-v2/:id
 */
router.delete('/:id', async (req, res) => {
  await locationController.deleteLocation(req, res);
});

// === Search and Query Operations ===

// === Search and Query Operations ===

/**
 * Search locations by term
 * GET /api/locations-v2/search
 * 
 * Query params:
 * - q: string (search term)
 * - limit?: number
 * - offset?: number
 */
router.get('/search', async (req, res) => {
  await locationController.searchLocations(req, res);
});

/**
 * Find nearby locations within radius
 * GET /api/locations-v2/nearby
 * 
 * Query params:
 * - latitude: number
 * - longitude: number
 * - radius: number (in kilometers)
 */
router.get('/nearby', async (req, res) => {
  await locationController.findNearbyLocations(req, res);
});

// === Statistics and Analytics ===

/**
 * Get location statistics
 * GET /api/locations-v2/stats
 * 
 * Returns:
 * - totalLocations: number
 * - activeLocations: number
 * - inactiveLocations: number
 * - locationsByType: Record<LocationType, number>
 * - locationsByState: Record<string, number>
 */
router.get('/stats', async (req, res) => {
  await locationController.getLocationStats(req, res);
});

// === Default Location Management ===

/**
 * Get default location for tenant
 * GET /api/locations-v2/default
 */
router.get('/default', async (req, res) => {
  await locationController.getDefaultLocation(req, res);
});

/**
 * Set default location for tenant
 * POST /api/locations-v2/default
 * 
 * Body: {
 *   locationId: string
 * }
 */
router.post('/default', async (req, res) => {
  await locationController.setDefaultLocation(req, res);
});

// === Error Handling ===
router.use((err: any, req: any, res: any, next: any) => {
  console.error('[LOCATION-ROUTES-CLEAN] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred in location service'
  });
});

export default router;