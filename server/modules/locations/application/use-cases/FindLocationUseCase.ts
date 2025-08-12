/**
 * Find Location Use Case - Clean Architecture
 * 
 * Handles location retrieval operations with proper authorization
 * and business logic validation.
 * 
 * @module FindLocationUseCase
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { Location, LocationFilterCriteria } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';

export interface FindLocationByIdRequest {
  locationId: string;
  tenantId: string;
}

export interface FindLocationsRequest {
  tenantId: string;
  filters?: LocationFilterCriteria;
  page?: number;
  limit?: number;
}

export interface FindLocationResponse {
  success: boolean;
  location?: Location;
  error?: string;
}

export interface FindLocationsResponse {
  success: boolean;
  locations?: Location[];
  total?: number;
  page?: number;
  totalPages?: number;
  errors?: string[];
}

export class FindLocationUseCase {
  constructor(
    private readonly locationRepository: ILocationRepository
  ) {}

  async findById(request: FindLocationByIdRequest): Promise<FindLocationResponse> {
    try {
      // Input validation
      if (!request.locationId?.trim()) {
        return {
          success: false,
          error: 'Location ID is required'
        };
      }

      if (!request.tenantId?.trim()) {
        return {
          success: false,
          error: 'Tenant ID is required'
        };
      }

      // Find the location
      const location = await this.locationRepository.findById(
        request.locationId,
        request.tenantId
      );

      if (!location) {
        return {
          success: false,
          error: 'Location not found'
        };
      }

      return {
        success: true,
        location
      };

    } catch (error) {
      console.error('[FIND-LOCATION-USE-CASE] Error finding by ID:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while finding the location'
      };
    }
  }

  async findAll(request: FindLocationsRequest): Promise<FindLocationsResponse> {
    try {
      // Input validation
      if (!request.tenantId?.trim()) {
        return {
          success: false,
          errors: ['Tenant ID is required']
        };
      }

      const page = Math.max(1, request.page || 1);
      const limit = Math.min(100, Math.max(1, request.limit || 20));
      const offset = (page - 1) * limit;

      // If filters are provided, use filtered search
      if (request.filters) {
        const criteria: LocationFilterCriteria = {
          ...request.filters,
          tenantId: request.tenantId,
          page,
          limit
        };

        const result = await this.locationRepository.findByFilters(criteria);

        return {
          success: true,
          locations: result.locations,
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        };
      }

      // Otherwise, get all locations for tenant
      const locations = await this.locationRepository.findAll(
        request.tenantId,
        limit,
        offset
      );

      const total = await this.locationRepository.count(request.tenantId);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        locations,
        total,
        page,
        totalPages
      };

    } catch (error) {
      console.error('[FIND-LOCATION-USE-CASE] Error finding all:', error);
      return {
        success: false,
        errors: ['An unexpected error occurred while finding locations']
      };
    }
  }

  async search(
    tenantId: string,
    searchTerm: string,
    limit?: number,
    offset?: number
  ): Promise<FindLocationsResponse> {
    try {
      // Input validation
      if (!tenantId?.trim()) {
        return {
          success: false,
          errors: ['Tenant ID is required']
        };
      }

      if (!searchTerm?.trim()) {
        return {
          success: false,
          errors: ['Search term is required']
        };
      }

      const locations = await this.locationRepository.searchLocations(
        tenantId,
        searchTerm,
        limit,
        offset
      );

      return {
        success: true,
        locations
      };

    } catch (error) {
      console.error('[FIND-LOCATION-USE-CASE] Error searching:', error);
      return {
        success: false,
        errors: ['An unexpected error occurred while searching locations']
      };
    }
  }

  async findByType(
    tenantId: string,
    locationType: string
  ): Promise<FindLocationsResponse> {
    try {
      if (!tenantId?.trim()) {
        return {
          success: false,
          errors: ['Tenant ID is required']
        };
      }

      if (!locationType?.trim()) {
        return {
          success: false,
          errors: ['Location type is required']
        };
      }

      const locations = await this.locationRepository.findByType(
        locationType as any,
        tenantId
      );

      return {
        success: true,
        locations
      };

    } catch (error) {
      console.error('[FIND-LOCATION-USE-CASE] Error finding by type:', error);
      return {
        success: false,
        errors: ['An unexpected error occurred while finding locations by type']
      };
    }
  }

  async findWithinRadius(
    tenantId: string,
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<FindLocationsResponse> {
    try {
      if (!tenantId?.trim()) {
        return {
          success: false,
          errors: ['Tenant ID is required']
        };
      }

      if (latitude < -90 || latitude > 90) {
        return {
          success: false,
          errors: ['Latitude must be between -90 and 90 degrees']
        };
      }

      if (longitude < -180 || longitude > 180) {
        return {
          success: false,
          errors: ['Longitude must be between -180 and 180 degrees']
        };
      }

      if (radiusKm <= 0) {
        return {
          success: false,
          errors: ['Radius must be a positive number']
        };
      }

      const locations = await this.locationRepository.findWithinRadius(
        latitude,
        longitude,
        radiusKm,
        tenantId
      );

      return {
        success: true,
        locations
      };

    } catch (error) {
      console.error('[FIND-LOCATION-USE-CASE] Error finding within radius:', error);
      return {
        success: false,
        errors: ['An unexpected error occurred while finding locations within radius']
      };
    }
  }

  async findActiveLocations(tenantId: string): Promise<FindLocationsResponse> {
    try {
      if (!tenantId?.trim()) {
        return {
          success: false,
          errors: ['Tenant ID is required']
        };
      }

      const locations = await this.locationRepository.findActiveLocations(tenantId);

      return {
        success: true,
        locations
      };

    } catch (error) {
      console.error('[FIND-LOCATION-USE-CASE] Error finding active locations:', error);
      return {
        success: false,
        errors: ['An unexpected error occurred while finding active locations']
      };
    }
  }

  async findDefaultLocation(tenantId: string): Promise<FindLocationResponse> {
    try {
      if (!tenantId?.trim()) {
        return {
          success: false,
          error: 'Tenant ID is required'
        };
      }

      const location = await this.locationRepository.findDefaultLocation(tenantId);

      if (!location) {
        return {
          success: false,
          error: 'No default location found'
        };
      }

      return {
        success: true,
        location
      };

    } catch (error) {
      console.error('[FIND-LOCATION-USE-CASE] Error finding default location:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while finding default location'
      };
    }
  }
}