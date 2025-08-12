/**
 * Create Location Use Case - Clean Architecture
 * 
 * Orchestrates the business logic for creating new locations.
 * This use case handles validation, business rules, and coordination
 * between domain and infrastructure layers.
 * 
 * @module CreateLocationUseCase
 * @version 1.0.0 
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { Location, LocationDomainService } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';

export interface CreateLocationRequest {
  tenantId: string;
  name: string;
  displayName?: string;
  description?: string;
  type: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  timezone?: string;
  operatingHours?: any;
  isDefaultLocation?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
  parentLocationId?: string;
  createdBy: string;
}

export interface CreateLocationResponse {
  success: boolean;
  location?: Location;
  errors?: string[];
}

export class CreateLocationUseCase {
  constructor(
    private readonly locationRepository: ILocationRepository
  ) {}

  async execute(request: CreateLocationRequest): Promise<CreateLocationResponse> {
    try {
      // 1. Input validation
      const validationErrors = this.validateInput(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      // 2. Business rules validation
      const locationData = {
        ...request,
        isActive: true,
        isDefaultLocation: request.isDefaultLocation || false
      };

      const domainValidation = LocationDomainService.validateLocation(locationData as any);
      if (!domainValidation.isValid) {
        return {
          success: false,
          errors: domainValidation.errors
        };
      }

      // 3. Check if location name already exists
      const nameExists = await this.locationRepository.nameExists(
        request.name,
        request.tenantId
      );
      if (nameExists) {
        return {
          success: false,
          errors: ['Location name already exists in this tenant']
        };
      }

      // 4. If coordinates provided, check if they already exist
      if (request.latitude && request.longitude) {
        const coordinatesExist = await this.locationRepository.coordinatesExist(
          request.latitude,
          request.longitude,
          request.tenantId
        );
        if (coordinatesExist) {
          return {
            success: false,
            errors: ['A location with these coordinates already exists']
          };
        }
      }

      // 5. Validate parent location if provided
      if (request.parentLocationId) {
        const parentLocation = await this.locationRepository.findById(
          request.parentLocationId,
          request.tenantId
        );
        if (!parentLocation) {
          return {
            success: false,
            errors: ['Parent location not found']
          };
        }
        if (!parentLocation.isActive) {
          return {
            success: false,
            errors: ['Parent location is inactive']
          };
        }
      }

      // 6. Handle default location logic
      if (request.isDefaultLocation) {
        // Check if there's already a default location
        const currentDefault = await this.locationRepository.findDefaultLocation(
          request.tenantId
        );
        if (currentDefault) {
          return {
            success: false,
            errors: ['A default location already exists for this tenant']
          };
        }
      }

      // 7. Create the location
      const newLocation = await this.locationRepository.create({
        tenantId: request.tenantId,
        name: request.name.trim(),
        displayName: request.displayName?.trim() || '',
        description: request.description?.trim() || '',
        type: request.type as any,
        address: request.address?.trim(),
        addressNumber: request.addressNumber?.trim(),
        complement: request.complement?.trim(),
        neighborhood: request.neighborhood?.trim(),
        city: request.city?.trim(),
        state: request.state?.trim(),
        zipCode: request.zipCode?.trim(),
        country: request.country.trim(),
        latitude: request.latitude,
        longitude: request.longitude,
        googlePlaceId: request.googlePlaceId?.trim(),
        timezone: request.timezone?.trim() || 'America/Sao_Paulo',
        operatingHours: request.operatingHours,
        isActive: true,
        isDefaultLocation: request.isDefaultLocation || false,
        tags: request.tags || [],
        customFields: request.customFields || {},
        parentLocationId: request.parentLocationId,
        createdBy: request.createdBy,
        updatedBy: request.createdBy
      });

      return {
        success: true,
        location: newLocation
      };

    } catch (error) {
      console.error('[CREATE-LOCATION-USE-CASE] Error:', error);
      return {
        success: false,
        errors: ['An unexpected error occurred while creating the location']
      };
    }
  }

  private validateInput(request: CreateLocationRequest): string[] {
    const errors: string[] = [];

    if (!request.tenantId?.trim()) {
      errors.push('Tenant ID is required');
    }

    if (!request.name?.trim()) {
      errors.push('Location name is required');
    }

    if (!request.type?.trim()) {
      errors.push('Location type is required');
    }

    if (!request.country?.trim()) {
      errors.push('Country is required');
    }

    if (!request.createdBy?.trim()) {
      errors.push('Created by is required');
    }

    // Validate coordinates if provided
    if (request.latitude !== undefined || request.longitude !== undefined) {
      if (request.latitude === undefined || request.longitude === undefined) {
        errors.push('Both latitude and longitude must be provided together');
      }
    }

    return errors;
  }
}