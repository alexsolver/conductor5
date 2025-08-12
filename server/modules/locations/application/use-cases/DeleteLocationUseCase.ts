/**
 * Delete Location Use Case - Clean Architecture
 * 
 * Handles location deletion with proper validation and business rules.
 * Implements soft delete with proper cascade handling.
 * 
 * @module DeleteLocationUseCase
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { ILocationRepository } from '../../domain/repositories/ILocationRepository';

export interface DeleteLocationRequest {
  locationId: string;
  tenantId: string;
  deletedBy: string;
  forceDelete?: boolean; // For hard delete in specific cases
}

export interface DeleteLocationResponse {
  success: boolean;
  message?: string;
  errors?: string[];
}

export class DeleteLocationUseCase {
  constructor(
    private readonly locationRepository: ILocationRepository
  ) {}

  async execute(request: DeleteLocationRequest): Promise<DeleteLocationResponse> {
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

      // Business rules validation
      await this.validateBusinessRules(request, existingLocation);

      // Perform soft delete
      const success = await this.locationRepository.delete(
        request.locationId,
        request.tenantId
      );

      if (!success) {
        return {
          success: false,
          errors: ['Failed to delete location']
        };
      }

      return {
        success: true,
        message: 'Location deleted successfully'
      };

    } catch (error) {
      console.error('[DELETE-LOCATION-USE-CASE] Error:', error);
      
      if (error instanceof Error) {
        return {
          success: false,
          errors: [error.message]
        };
      }

      return {
        success: false,
        errors: ['An unexpected error occurred while deleting the location']
      };
    }
  }

  async bulkDelete(
    locationIds: string[],
    tenantId: string,
    deletedBy: string
  ): Promise<DeleteLocationResponse> {
    try {
      if (!locationIds.length) {
        return {
          success: false,
          errors: ['No location IDs provided']
        };
      }

      if (!tenantId?.trim()) {
        return {
          success: false,
          errors: ['Tenant ID is required']
        };
      }

      if (!deletedBy?.trim()) {
        return {
          success: false,
          errors: ['Deleted by is required']
        };
      }

      // Validate each location before bulk delete
      for (const locationId of locationIds) {
        const location = await this.locationRepository.findById(locationId, tenantId);
        if (!location) {
          return {
            success: false,
            errors: [`Location with ID ${locationId} not found`]
          };
        }

        // Check if it's a default location
        if (location.isDefaultLocation) {
          return {
            success: false,
            errors: [`Cannot delete default location: ${location.name}`]
          };
        }

        // Check if it has child locations
        const childLocations = await this.locationRepository.findByParentLocation(
          locationId,
          tenantId
        );
        if (childLocations.length > 0) {
          return {
            success: false,
            errors: [`Location ${location.name} has child locations and cannot be deleted`]
          };
        }
      }

      // Perform bulk delete
      const success = await this.locationRepository.bulkDelete(locationIds, tenantId);

      if (!success) {
        return {
          success: false,
          errors: ['Failed to delete locations']
        };
      }

      return {
        success: true,
        message: `${locationIds.length} locations deleted successfully`
      };

    } catch (error) {
      console.error('[DELETE-LOCATION-USE-CASE] Bulk delete error:', error);
      
      return {
        success: false,
        errors: ['An unexpected error occurred during bulk delete']
      };
    }
  }

  private validateInput(request: DeleteLocationRequest): string[] {
    const errors: string[] = [];

    if (!request.locationId?.trim()) {
      errors.push('Location ID is required');
    }

    if (!request.tenantId?.trim()) {
      errors.push('Tenant ID is required');
    }

    if (!request.deletedBy?.trim()) {
      errors.push('Deleted by is required');
    }

    return errors;
  }

  private async validateBusinessRules(
    request: DeleteLocationRequest,
    location: any
  ): Promise<void> {
    // Cannot delete default location
    if (location.isDefaultLocation) {
      throw new Error('Cannot delete the default location. Set another location as default first.');
    }

    // Check if location has child locations
    const childLocations = await this.locationRepository.findByParentLocation(
      request.locationId,
      request.tenantId
    );
    
    if (childLocations.length > 0) {
      throw new Error(
        `Location has ${childLocations.length} child location(s). ` +
        'Please reassign or delete child locations first.'
      );
    }

    // Additional business rules can be added here:
    // - Check if location is referenced in tickets
    // - Check if location is referenced in users/assets
    // - Check if location has active schedules/bookings
  }
}