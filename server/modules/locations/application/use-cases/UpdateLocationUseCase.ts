/**
 * Update Location Use Case - Clean Architecture
 * 
 * Handles location updates with proper validation and business rules.
 * 
 * @module UpdateLocationUseCase
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { Location, LocationDomainService } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';

export interface UpdateLocationRequest {
  locationId: string;
  tenantId: string;
  name?: string;
  displayName?: string;
  description?: string;
  type?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  timezone?: string;
  operatingHours?: any;
  isActive?: boolean;
  isDefaultLocation?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
  parentLocationId?: string;
  updatedBy: string;
}

export interface UpdateLocationResponse {
  success: boolean;
  location?: Location;
  errors?: string[];
}

export class UpdateLocationUseCase {
  constructor(
    private readonly locationRepository: ILocationRepository
  ) {}

  async execute(request: UpdateLocationRequest): Promise<UpdateLocationResponse> {
    try {
      // Input validation
      const validationErrors = this.validateInput(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      // Find existing location
      const existingLocation = await this.locationRepository.findById(
        request.locationId,
        request.tenantId
      );

      if (!existingLocation) {
        return {
          success: false,
          errors: ['Location not found']
        };
      }

      // Prepare update data
      const updateData = this.prepareUpdateData(request, existingLocation);

      // Domain validation for the complete updated entity
      const mergedLocation = { ...existingLocation, ...updateData };
      const domainValidation = LocationDomainService.validateLocation(mergedLocation);
      
      if (!domainValidation.isValid) {
        return {
          success: false,
          errors: domainValidation.errors
        };
      }

      // Business rules validation
      await this.validateBusinessRules(request, existingLocation);

      // Update the location
      const updatedLocation = await this.locationRepository.update(
        request.locationId,
        updateData,
        request.tenantId
      );

      return {
        success: true,
        location: updatedLocation
      };

    } catch (error) {
      console.error('[UPDATE-LOCATION-USE-CASE] Error:', error);
      
      if (error instanceof Error) {
        return {
          success: false,
          errors: [error.message]
        };
      }

      return {
        success: false,
        errors: ['An unexpected error occurred while updating the location']
      };
    }
  }

  private validateInput(request: UpdateLocationRequest): string[] {
    const errors: string[] = [];

    if (!request.locationId?.trim()) {
      errors.push('Location ID is required');
    }

    if (!request.tenantId?.trim()) {
      errors.push('Tenant ID is required');
    }

    if (!request.updatedBy?.trim()) {
      errors.push('Updated by is required');
    }

    // Validate coordinates if provided
    if (request.latitude !== undefined || request.longitude !== undefined) {
      if (request.latitude === undefined || request.longitude === undefined) {
        errors.push('Both latitude and longitude must be provided together');
      }
    }

    return errors;
  }

  private prepareUpdateData(request: UpdateLocationRequest, existing: Location): any {
    const updateData: any = {
      updatedBy: request.updatedBy
    };

    // Only include fields that are being updated
    if (request.name !== undefined) {
      updateData.name = request.name.trim();
    }
    if (request.displayName !== undefined) {
      updateData.displayName = request.displayName.trim();
    }
    if (request.description !== undefined) {
      updateData.description = request.description.trim();
    }
    if (request.type !== undefined) {
      updateData.type = request.type as any;
    }
    if (request.address !== undefined) {
      updateData.address = request.address.trim();
    }
    if (request.addressNumber !== undefined) {
      updateData.addressNumber = request.addressNumber.trim();
    }
    if (request.complement !== undefined) {
      updateData.complement = request.complement.trim();
    }
    if (request.neighborhood !== undefined) {
      updateData.neighborhood = request.neighborhood.trim();
    }
    if (request.city !== undefined) {
      updateData.city = request.city.trim();
    }
    if (request.state !== undefined) {
      updateData.state = request.state.trim();
    }
    if (request.zipCode !== undefined) {
      updateData.zipCode = request.zipCode.trim();
    }
    if (request.country !== undefined) {
      updateData.country = request.country.trim();
    }
    if (request.latitude !== undefined) {
      updateData.latitude = request.latitude;
    }
    if (request.longitude !== undefined) {
      updateData.longitude = request.longitude;
    }
    if (request.googlePlaceId !== undefined) {
      updateData.googlePlaceId = request.googlePlaceId.trim();
    }
    if (request.timezone !== undefined) {
      updateData.timezone = request.timezone.trim();
    }
    if (request.operatingHours !== undefined) {
      updateData.operatingHours = request.operatingHours;
    }
    if (request.isActive !== undefined) {
      updateData.isActive = request.isActive;
    }
    if (request.isDefaultLocation !== undefined) {
      updateData.isDefaultLocation = request.isDefaultLocation;
    }
    if (request.tags !== undefined) {
      updateData.tags = request.tags;
    }
    if (request.customFields !== undefined) {
      updateData.customFields = request.customFields;
    }
    if (request.parentLocationId !== undefined) {
      updateData.parentLocationId = request.parentLocationId;
    }

    return updateData;
  }

  private async validateBusinessRules(
    request: UpdateLocationRequest,
    existing: Location
  ): Promise<void> {
    // Check if name is being changed and if it already exists
    if (request.name && request.name !== existing.name) {
      const nameExists = await this.locationRepository.nameExists(
        request.name,
        request.tenantId,
        request.locationId
      );
      if (nameExists) {
        throw new Error('Location name already exists in this tenant');
      }
    }

    // Check coordinates uniqueness if being changed
    if (request.latitude && request.longitude) {
      if (request.latitude !== existing.latitude || request.longitude !== existing.longitude) {
        const coordinatesExist = await this.locationRepository.coordinatesExist(
          request.latitude,
          request.longitude,
          request.tenantId,
          request.locationId
        );
        if (coordinatesExist) {
          throw new Error('A location with these coordinates already exists');
        }
      }
    }

    // Validate parent location if being changed
    if (request.parentLocationId && request.parentLocationId !== existing.parentLocationId) {
      if (request.parentLocationId === request.locationId) {
        throw new Error('Location cannot be its own parent');
      }

      const parentLocation = await this.locationRepository.findById(
        request.parentLocationId,
        request.tenantId
      );
      if (!parentLocation) {
        throw new Error('Parent location not found');
      }
      if (!parentLocation.isActive) {
        throw new Error('Parent location is inactive');
      }
    }

    // Handle default location logic
    if (request.isDefaultLocation === true && !existing.isDefaultLocation) {
      const currentDefault = await this.locationRepository.findDefaultLocation(
        request.tenantId
      );
      if (currentDefault && currentDefault.id !== request.locationId) {
        throw new Error('A default location already exists for this tenant');
      }
    }

    // Prevent deactivating default location
    if (request.isActive === false && existing.isDefaultLocation) {
      throw new Error('Cannot deactivate the default location');
    }
  }
}