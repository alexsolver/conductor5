/**
 * Location Domain Entity - Clean Architecture
 * 
 * Represents a location in the Conductor system with all business rules
 * and domain logic for location management.
 * 
 * @module LocationEntity
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

export interface Location {
  // Identificação
  readonly id: string;
  readonly tenantId: string;
  
  // Dados Básicos
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly type: LocationType;
  
  // Endereço
  readonly address?: string;
  readonly addressNumber?: string;
  readonly complement?: string;
  readonly neighborhood?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly country: string;
  
  // Geolocalização
  readonly latitude?: number;
  readonly longitude?: number;
  readonly googlePlaceId?: string;
  
  // Configurações
  readonly timezone?: string;
  readonly operatingHours?: OperatingHours;
  readonly isActive: boolean;
  readonly isDefaultLocation: boolean;
  
  // Metadados
  readonly tags?: string[];
  readonly customFields?: Record<string, any>;
  readonly parentLocationId?: string;
  
  // Auditoria
  readonly createdBy: string;
  readonly updatedBy?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export enum LocationType {
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  BRANCH = 'branch',
  DATACENTER = 'datacenter',
  REMOTE = 'remote',
  CLIENT_SITE = 'client_site',
  SERVICE_POINT = 'service_point',
  HEADQUARTERS = 'headquarters',
  SUBSIDIARY = 'subsidiary',
  OTHER = 'other'
}

export interface OperatingHours {
  monday?: TimeSlot;
  tuesday?: TimeSlot;
  wednesday?: TimeSlot;
  thursday?: TimeSlot;
  friday?: TimeSlot;
  saturday?: TimeSlot;
  sunday?: TimeSlot;
  holidays?: TimeSlot;
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  isClosed?: boolean;
  breaks?: Array<{
    start: string;
    end: string;
  }>;
}

export interface LocationFilterCriteria {
  tenantId: string;
  searchTerm?: string;
  type?: LocationType;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  isDefaultLocation?: boolean;
  parentLocationId?: string;
  hasOperatingHours?: boolean;
  withinRadius?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface LocationStats {
  tenantId: string;
  totalLocations: number;
  activeLocations: number;
  inactiveLocations: number;
  locationsByType: Record<LocationType, number>;
  locationsByState: Record<string, number>;
  locationsWithCoordinates: number;
  defaultLocationId?: string;
  averageCoordinateAccuracy?: number;
  lastUpdated: Date;
}

/**
 * Location Domain Service
 * Contains business rules and validations for Location entities
 */
export class LocationDomainService {
  /**
   * Validates a location for creation/update
   */
  static validateLocation(location: Partial<Location>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields validation
    if (!location.name?.trim()) {
      errors.push('Location name is required');
    }

    if (!location.tenantId?.trim()) {
      errors.push('Tenant ID is required');
    }

    if (!location.type) {
      errors.push('Location type is required');
    }

    if (!location.country?.trim()) {
      errors.push('Country is required');
    }

    // Business rules validation
    if (location.name && location.name.length > 255) {
      errors.push('Location name cannot exceed 255 characters');
    }

    if (location.description && location.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    // Coordinate validation
    if (location.latitude !== undefined && location.longitude !== undefined) {
      if (location.latitude < -90 || location.latitude > 90) {
        errors.push('Latitude must be between -90 and 90 degrees');
      }
      if (location.longitude < -180 || location.longitude > 180) {
        errors.push('Longitude must be between -180 and 180 degrees');
      }
    }

    // ZIP code validation (Brazilian format)
    if (location.zipCode && location.country?.toLowerCase() === 'brasil') {
      const zipRegex = /^\d{5}-?\d{3}$/;
      if (!zipRegex.test(location.zipCode)) {
        errors.push('Invalid Brazilian ZIP code format (should be XXXXX-XXX)');
      }
    }

    // Operating hours validation
    if (location.operatingHours) {
      const hoursErrors = this.validateOperatingHours(location.operatingHours);
      errors.push(...hoursErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates operating hours format and logic
   */
  static validateOperatingHours(hours: OperatingHours): string[] {
    const errors: string[] = [];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'holidays'];

    for (const day of days) {
      const slot = hours[day as keyof OperatingHours] as TimeSlot;
      if (slot && !slot.isClosed) {
        if (!timeRegex.test(slot.start)) {
          errors.push(`Invalid start time format for ${day} (should be HH:MM)`);
        }
        if (!timeRegex.test(slot.end)) {
          errors.push(`Invalid end time format for ${day} (should be HH:MM)`);
        }

        // Check if start time is before end time
        if (slot.start >= slot.end) {
          errors.push(`Start time must be before end time for ${day}`);
        }

        // Validate breaks
        if (slot.breaks) {
          for (const breakSlot of slot.breaks) {
            if (!timeRegex.test(breakSlot.start) || !timeRegex.test(breakSlot.end)) {
              errors.push(`Invalid break time format for ${day}`);
            }
            if (breakSlot.start >= breakSlot.end) {
              errors.push(`Break start time must be before end time for ${day}`);
            }
            if (breakSlot.start < slot.start || breakSlot.end > slot.end) {
              errors.push(`Break times must be within operating hours for ${day}`);
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Calculates distance between two locations using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
      Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Formats location address as a single string
   */
  static formatAddress(location: Partial<Location>): string {
    const parts = [
      location.address,
      location.addressNumber,
      location.complement,
      location.neighborhood,
      location.city,
      location.state,
      location.zipCode,
      location.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Checks if location is currently open based on operating hours
   */
  static isCurrentlyOpen(location: Location): boolean {
    if (!location.operatingHours) {
      return true; // Assume open if no hours specified
    }

    const now = new Date();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const daySlot = location.operatingHours[dayName as keyof OperatingHours] as TimeSlot;
    
    if (!daySlot || daySlot.isClosed) {
      return false;
    }

    return currentTime >= daySlot.start && currentTime <= daySlot.end;
  }

  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}