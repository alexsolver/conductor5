/**
 * Location Controller - Clean Architecture
 * 
 * HTTP Controllers for Location operations.
 * Handles request/response formatting and delegates business logic to use cases.
 * 
 * @module LocationController
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { CreateLocationUseCase, CreateLocationRequest } from '../use-cases/CreateLocationUseCase';
import { FindLocationUseCase } from '../use-cases/FindLocationUseCase';
import { UpdateLocationUseCase, UpdateLocationRequest } from '../use-cases/UpdateLocationUseCase';
import { DeleteLocationUseCase } from '../use-cases/DeleteLocationUseCase';
import { LocationFilterCriteria, LocationStats } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';

export class LocationController {
  constructor(
    private readonly createLocationUseCase: CreateLocationUseCase,
    private readonly findLocationUseCase: FindLocationUseCase,
    private readonly updateLocationUseCase: UpdateLocationUseCase,
    private readonly deleteLocationUseCase: DeleteLocationUseCase,
    private readonly locationRepository: ILocationRepository
  ) {}

  /**
   * Create a new location
   * POST /api/locations
   */
  async createLocation(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const createRequest: CreateLocationRequest = {
        ...req.body,
        tenantId: user.tenantId,
        createdBy: user.id
      };

      const result = await this.createLocationUseCase.execute(createRequest);

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.location,
        message: 'Location created successfully'
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Create error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get location by ID
   * GET /api/locations/:id
   */
  async getLocationById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const result = await this.findLocationUseCase.findById({
        locationId: req.params.id,
        tenantId: user.tenantId
      });

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        data: result.location
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Get by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get all locations with optional filtering
   * GET /api/locations
   */
  async getLocations(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Parse query parameters for filtering
      const filters = this.parseFilters(req.query);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.findLocationUseCase.findAll({
        tenantId: user.tenantId,
        filters,
        page,
        limit
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        });
        return;
      }

      res.json({
        success: true,
        data: result.locations,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Get locations error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Search locations
   * GET /api/locations/search
   */
  async searchLocations(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.findLocationUseCase.search(
        user.tenantId,
        searchTerm,
        limit,
        offset
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        });
        return;
      }

      res.json({
        success: true,
        data: result.locations
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update location
   * PUT /api/locations/:id
   */
  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updateRequest: UpdateLocationRequest = {
        ...req.body,
        locationId: req.params.id,
        tenantId: user.tenantId,
        updatedBy: user.id
      };

      const result = await this.updateLocationUseCase.execute(updateRequest);

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        });
        return;
      }

      res.json({
        success: true,
        data: result.location,
        message: 'Location updated successfully'
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Delete location
   * DELETE /api/locations/:id
   */
  async deleteLocation(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const result = await this.deleteLocationUseCase.execute({
        locationId: req.params.id,
        tenantId: user.tenantId,
        deletedBy: user.id
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        });
        return;
      }

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Delete error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get location statistics
   * GET /api/locations/stats
   */
  async getLocationStats(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const stats = await this.locationRepository.getLocationStats(user.tenantId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Find locations within radius
   * GET /api/locations/nearby
   */
  async findNearbyLocations(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { latitude, longitude, radius } = req.query;

      if (!latitude || !longitude || !radius) {
        res.status(400).json({
          success: false,
          error: 'Latitude, longitude, and radius are required'
        });
        return;
      }

      const result = await this.findLocationUseCase.findWithinRadius(
        user.tenantId,
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(radius as string)
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        });
        return;
      }

      res.json({
        success: true,
        data: result.locations
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Nearby error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get/Set default location
   * GET/POST /api/locations/default
   */
  async getDefaultLocation(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const result = await this.findLocationUseCase.findDefaultLocation(user.tenantId);

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        data: result.location
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Get default error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async setDefaultLocation(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { locationId } = req.body;

      if (!locationId) {
        res.status(400).json({
          success: false,
          error: 'Location ID is required'
        });
        return;
      }

      const success = await this.locationRepository.setDefaultLocation(
        locationId,
        user.tenantId
      );

      if (!success) {
        res.status(400).json({
          success: false,
          error: 'Failed to set default location'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Default location set successfully'
      });

    } catch (error) {
      console.error('[LOCATION-CONTROLLER] Set default error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Parse query parameters into filter criteria
   */
  private parseFilters(query: any): LocationFilterCriteria | undefined {
    const filters: Partial<LocationFilterCriteria> = {};

    if (query.searchTerm) filters.searchTerm = query.searchTerm;
    if (query.type) filters.type = query.type;
    if (query.city) filters.city = query.city;
    if (query.state) filters.state = query.state;
    if (query.country) filters.country = query.country;
    if (query.isActive !== undefined) filters.isActive = query.isActive === 'true';
    if (query.isDefaultLocation !== undefined) filters.isDefaultLocation = query.isDefaultLocation === 'true';
    if (query.parentLocationId) filters.parentLocationId = query.parentLocationId;
    if (query.hasOperatingHours !== undefined) filters.hasOperatingHours = query.hasOperatingHours === 'true';

    if (query.tags && typeof query.tags === 'string') {
      filters.tags = query.tags.split(',');
    }

    return Object.keys(filters).length > 0 ? filters as LocationFilterCriteria : undefined;
  }
}