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
        search,
        favorites,
        tag
      } = req.query;

      const options = {
        page: Number(page),
        limit: Number(limit),
        locationType: locationType as string,
        status: status as string,
        search: search as string,
        favorites: favorites === 'true',
        tag: tag as string
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

  // Create new location (with Sprint 2 features)
  async createLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      // Add Sprint 2 fields to validation
      const locationData = {
        ...req.body,
        tenantId,
        tags: req.body.tags || [],
        attachments: req.body.attachments || {},
        parent_location_id: req.body.parent_location_id || null,
        is_favorite: req.body.is_favorite || false
      };

      const validation = insertLocationSchema.safeParse(locationData);

      if (!validation.success) {
        return sendValidationError(res, validation.error.errors.map(e => e.message), "Invalid location data");
      }

      const location = await this.repository.createLocation(validation.data);
      return sendSuccess(res, location, "Location created successfully", 201);

    } catch (error) {
      return sendError(res, error as any, "Failed to create location", 500);
    }
  }

  // Toggle favorite status (Sprint 2)
  async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const location = await this.repository.toggleFavorite(id, tenantId);

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Location favorite status updated");

    } catch (error) {
      return sendError(res, error as any, "Failed to update favorite status", 500);
    }
  }

  // Add tag to location (Sprint 2)
  async addTag(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const { tag } = req.body;

      if (!tag || typeof tag !== 'string') {
        return sendError(res, "Valid tag is required", "Valid tag is required", 400);
      }

      const location = await this.repository.addTag(id, tenantId, tag.trim());

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Tag added successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to add tag", 500);
    }
  }

  // Remove tag from location (Sprint 2)
  async removeTag(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const { tag } = req.body;

      if (!tag || typeof tag !== 'string') {
        return sendError(res, "Valid tag is required", "Valid tag is required", 400);
      }

      const location = await this.repository.removeTag(id, tenantId, tag.trim());

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Tag removed successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to remove tag", 500);
    }
  }

  // Add attachment to location (Sprint 2)
  async addAttachment(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const { filename, filepath, filesize } = req.body;

      if (!filename || !filepath || !filesize) {
        return sendError(res, "Filename, filepath and filesize are required", "Missing attachment data", 400);
      }

      const location = await this.repository.addAttachment(id, tenantId, filename, filepath, Number(filesize));

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Attachment added successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to add attachment", 500);
    }
  }

  // Remove attachment from location (Sprint 2)
  async removeAttachment(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const { filename } = req.body;

      if (!filename) {
        return sendError(res, "Filename is required", "Filename is required", 400);
      }

      const location = await this.repository.removeAttachment(id, tenantId, filename);

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Attachment removed successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to remove attachment", 500);
    }
  }

  // Get location hierarchy (Sprint 2)
  async getLocationHierarchy(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const hierarchy = await this.repository.getLocationHierarchy(id, tenantId);

      return sendSuccess(res, hierarchy, "Location hierarchy retrieved successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to retrieve hierarchy", 500);
    }
  }

  // Set parent location (Sprint 2) 
  async setParentLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, "Tenant ID required", "Tenant ID required", 401);
      }

      const { id } = req.params;
      const { parentLocationId } = req.body;

      const location = await this.repository.setParentLocation(id, tenantId, parentLocationId);

      if (!location) {
        return sendError(res, "Location not found", "Location not found", 404);
      }

      return sendSuccess(res, location, "Parent location updated successfully");

    } catch (error) {
      return sendError(res, error as any, "Failed to set parent location", 500);
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