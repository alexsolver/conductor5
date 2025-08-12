/**
 * Location Repository Interface - Clean Architecture
 * 
 * Defines the contract for location data persistence operations.
 * This interface belongs to the Domain Layer and should be implemented
 * by Infrastructure Layer repositories.
 * 
 * @module ILocationRepository
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { Location, LocationFilterCriteria, LocationStats, LocationType } from '../entities/Location';

export interface ILocationRepository {
  // Basic CRUD Operations
  create(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location>;
  findById(id: string, tenantId: string): Promise<Location | null>;
  update(id: string, updates: Partial<Location>, tenantId: string): Promise<Location>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Location[]>;

  // Advanced Search and Filtering
  findByFilters(criteria: LocationFilterCriteria): Promise<{
    locations: Location[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  searchLocations(
    tenantId: string,
    searchTerm: string,
    limit?: number,
    offset?: number
  ): Promise<Location[]>;

  // Specialized Queries
  findByTenant(tenantId: string): Promise<Location[]>;
  findByType(type: LocationType, tenantId: string): Promise<Location[]>;
  findByCity(city: string, tenantId: string): Promise<Location[]>;
  findByState(state: string, tenantId: string): Promise<Location[]>;
  findByCountry(country: string, tenantId: string): Promise<Location[]>;
  
  // Default Location Management
  findDefaultLocation(tenantId: string): Promise<Location | null>;
  setDefaultLocation(locationId: string, tenantId: string): Promise<boolean>;
  
  // Geographic Operations
  findWithinRadius(
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    tenantId: string
  ): Promise<Location[]>;

  findByCoordinates(latitude: number, longitude: number, tenantId: string): Promise<Location | null>;
  
  // Hierarchical Operations
  findByParentLocation(parentLocationId: string, tenantId: string): Promise<Location[]>;
  findRootLocations(tenantId: string): Promise<Location[]>;
  
  // Status Operations
  findActiveLocations(tenantId: string): Promise<Location[]>;
  findInactiveLocations(tenantId: string): Promise<Location[]>;
  
  // Bulk Operations
  bulkCreate(locations: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Location[]>;
  bulkUpdate(updates: Array<{ id: string; data: Partial<Location> }>, tenantId: string): Promise<Location[]>;
  bulkDelete(locationIds: string[], tenantId: string): Promise<boolean>;
  bulkChangeStatus(locationIds: string[], isActive: boolean, tenantId: string): Promise<boolean>;

  // Validation Operations
  nameExists(name: string, tenantId: string, excludeId?: string): Promise<boolean>;
  coordinatesExist(latitude: number, longitude: number, tenantId: string, excludeId?: string): Promise<boolean>;
  
  // Statistics and Analytics
  getLocationStats(tenantId: string): Promise<LocationStats>;
  getRecentLocations(tenantId: string, days?: number, limit?: number): Promise<Location[]>;
  count(tenantId: string, filters?: Partial<LocationFilterCriteria>): Promise<number>;
  
  // Tag Operations
  findByTags(tags: string[], tenantId: string): Promise<Location[]>;
  getAllTags(tenantId: string): Promise<string[]>;
  
  // Custom Field Operations
  findByCustomField(fieldName: string, fieldValue: any, tenantId: string): Promise<Location[]>;
  
  // Operating Hours Operations
  findLocationsWithOperatingHours(tenantId: string): Promise<Location[]>;
  findCurrentlyOpenLocations(tenantId: string): Promise<Location[]>;
  
  // Address Validation
  findByAddress(address: string, tenantId: string): Promise<Location[]>;
  findByZipCode(zipCode: string, tenantId: string): Promise<Location[]>;
  
  // Google Places Integration
  findByGooglePlaceId(placeId: string, tenantId: string): Promise<Location | null>;
  updateGooglePlaceId(locationId: string, placeId: string, tenantId: string): Promise<boolean>;
  
  // Multi-tenant Operations
  findAcrossAllTenants(filters: Omit<LocationFilterCriteria, 'tenantId'>): Promise<{
    locations: (Location & { tenantName: string })[];
    total: number;
  }>;

  // Audit Operations
  findByCreatedBy(createdBy: string, tenantId: string): Promise<Location[]>;
  findByUpdatedBy(updatedBy: string, tenantId: string): Promise<Location[]>;
  findCreatedInRange(startDate: Date, endDate: Date, tenantId: string): Promise<Location[]>;
  findUpdatedInRange(startDate: Date, endDate: Date, tenantId: string): Promise<Location[]>;
}