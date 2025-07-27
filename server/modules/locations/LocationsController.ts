// NEW LOCATIONS MODULE - Controller Layer
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/jwtAuth';
import { LocationsRepository } from './LocationsRepository';
import { sendSuccess, sendError, sendValidationError } from '../../utils/standardResponse';
import { insertLocationSchema, insertLocationSegmentSchema, insertLocationAreaSchema, 
         insertLocationRouteSchema, insertAreaGroupSchema } from '../../../shared/schema-locations';
import { pool } from '../../db';

export class LocationsController {
  private repository: LocationsRepository;

  constructor() {
    this.repository = new LocationsRepository(pool);
  }

  // Get all locations with filtering and pagination
  async getLocations(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const {
        page = 1,
        limit = 50,
        locationType,
        status,
        search
      } = req.query;

      const options = {
        page: Number(page),
        limit: Number(limit),
        locationType: locationType as string,
        status: status as string,
        search: search as string
      };

      const result = await this.repository.getAllLocations(tenantId, options);
      
      return sendSuccess(res, {
        locations: result.locations,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / options.limit)
        }
      }, "Locations retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve locations", 500);
    }
  }

  // Get single location by ID
  async getLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const location = await this.repository.getLocationById(id, tenantId);

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Location retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve location", 500);
    }
  }

  // Create new location
  async createLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const validation = insertLocationSchema.safeParse({
        ...req.body,
        tenantId
      });

      if (!validation.success) {
        return sendValidationError(res, validation.error.errors.map(e => e.message), "Invalid location data");
      }

      const location = await this.repository.createLocation(validation.data);
      return sendSuccess(res, location, "Location created successfully", 201);

    } catch (error) {
      return sendError(res, error as any, "Failed to create location", 500);
    }
  }

  // Update location
  async updateLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const updates = req.body;

      const location = await this.repository.updateLocation(id, tenantId, updates);

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Location updated successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to update location", 500);
    }
  }

  // Delete location
  async deleteLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const deleted = await this.repository.deleteLocation(id, tenantId);

      if (!deleted) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, { deleted: true }, "Location deleted successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to delete location", 500);
    }
  }

  // Get location segments
  async getLocationSegments(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { locationId } = req.params;
      const segments = await this.repository.getLocationSegments(locationId, tenantId);

      return sendSuccess(res, segments, "Location segments retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve location segments", 500);
    }
  }

  // Create location segment
  async createLocationSegment(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const validation = insertLocationSegmentSchema.safeParse({
        ...req.body,
        tenantId
      });

      if (!validation.success) {
        return sendValidationError(res, validation.error.errors.map(e => e.message), "Invalid segment data");
      }

      const segment = await this.repository.createLocationSegment(validation.data);
      return sendSuccess(res, segment, "Location segment created successfully", 201);

    } catch (error) {
      return sendError(res, error as any, "Failed to create location segment", 500);
    }
  }

  // Get location areas
  async getLocationAreas(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { locationId } = req.params;
      const areas = await this.repository.getLocationAreas(locationId, tenantId);

      return sendSuccess(res, areas, "Location areas retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve location areas", 500);
    }
  }

  // Create location area
  async createLocationArea(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const validation = insertLocationAreaSchema.safeParse({
        ...req.body,
        tenantId
      });

      if (!validation.success) {
        return sendValidationError(res, validation.error.errors.map(e => e.message), "Invalid area data");
      }

      const area = await this.repository.createLocationArea(validation.data);
      return sendSuccess(res, area, "Location area created successfully", 201);

    } catch (error) {
      return sendError(res, error as any, "Failed to create location area", 500);
    }
  }

  // Get all routes
  async getRoutes(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const routes = await this.repository.getAllRoutes(tenantId);
      return sendSuccess(res, routes, "Routes retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve routes", 500);
    }
  }

  // Create location route
  async createRoute(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const validation = insertLocationRouteSchema.safeParse({
        ...req.body,
        tenantId
      });

      if (!validation.success) {
        return sendValidationError(res, validation.error.errors.map(e => e.message), "Invalid route data");
      }

      const route = await this.repository.createLocationRoute(validation.data);
      return sendSuccess(res, route, "Route created successfully", 201);

    } catch (error) {
      return sendError(res, error as any, "Failed to create route", 500);
    }
  }

  // Get area groups
  async getAreaGroups(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const groups = await this.repository.getAllAreaGroups(tenantId);
      return sendSuccess(res, groups, "Area groups retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve area groups", 500);
    }
  }

  // Create area group
  async createAreaGroup(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const validation = insertAreaGroupSchema.safeParse({
        ...req.body,
        tenantId
      });

      if (!validation.success) {
        return sendValidationError(res, validation.error.errors.map(e => e.message), "Invalid group data");
      }

      const group = await this.repository.createAreaGroup(validation.data);
      return sendSuccess(res, group, "Area group created successfully", 201);

    } catch (error) {
      return sendError(res, error as any, "Failed to create area group", 500);
    }
  }

  // Geospatial operations
  async findNearestLocations(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { lat, lng, radiusKm = 10, limit = 10 } = req.query;

      if (!lat || !lng) {
        return sendError(res, "Latitude and longitude are required", "Invalid coordinates", 400);
      }

      const coordinates = { lat: Number(lat), lng: Number(lng) };
      const locations = await this.repository.findNearestLocations(
        tenantId, 
        coordinates, 
        Number(radiusKm), 
        Number(limit)
      );

      return sendSuccess(res, locations, "Nearest locations found successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to find nearest locations", 500);
    }
  }

  // Get coverage analysis
  async getCoverageAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const analysis = await this.repository.getCoverageAnalysis(tenantId);
      return sendSuccess(res, analysis, "Coverage analysis completed successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to perform coverage analysis", 500);
    }
  }

  // Get location statistics
  async getLocationStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const stats = await this.repository.getLocationStats(tenantId);
      return sendSuccess(res, stats, "Location statistics retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve location statistics", 500);
    }
  }
}