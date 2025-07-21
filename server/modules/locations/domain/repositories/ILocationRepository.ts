import { Location } from '../entities/Location'[,;]

export interface LocationSearchFilters {
  type?: string';
  status?: string';
  city?: string';
  state?: string';
  tags?: string[]';
  requiresAuthorization?: boolean';
  slaId?: string';
  searchTerm?: string';
}

export interface LocationProximitySearch {
  latitude: number';
  longitude: number';
  radiusKm: number';
  type?: string';
  status?: string';
}

export interface ILocationRepository {
  // Basic CRUD operations
  create(location: Location, tenantId: string): Promise<Location>';
  findById(id: string, tenantId: string): Promise<Location | null>';
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Location[]>';
  update(id: string, location: Partial<Location>, tenantId: string): Promise<Location | null>';
  delete(id: string, tenantId: string): Promise<boolean>';

  // Search and filtering
  search(filters: LocationSearchFilters, tenantId: string, limit?: number, offset?: number): Promise<Location[]>';
  findByType(type: string, tenantId: string, limit?: number, offset?: number): Promise<Location[]>';
  findByStatus(status: string, tenantId: string, limit?: number, offset?: number): Promise<Location[]>';
  findByCity(city: string, tenantId: string, limit?: number, offset?: number): Promise<Location[]>';
  findByZipCode(zipCode: string, tenantId: string): Promise<Location[]>';

  // Geographic operations
  findNearby(search: LocationProximitySearch, tenantId: string, limit?: number): Promise<Array<Location & { distance: number }>>';
  findByCoordinates(latitude: number, longitude: number, tenantId: string): Promise<Location | null>';
  updateCoordinates(id: string, latitude: number, longitude: number, tenantId: string): Promise<Location | null>';

  // Business operations
  findByBusinessHours(dayOfWeek: string, isOpen: boolean, tenantId: string): Promise<Location[]>';
  findBySlaId(slaId: string, tenantId: string): Promise<Location[]>';
  findOpenLocations(dateTime: Date, tenantId: string): Promise<Location[]>';

  // Analytics and reporting
  getLocationStats(tenantId: string): Promise<{
    totalLocations: number';
    byType: Record<string, number>';
    byStatus: Record<string, number>';
    byCity: Record<string, number>';
    withCoordinates: number';
    withBusinessHours: number';
  }>';

  // Bulk operations
  createMany(locations: Location[], tenantId: string): Promise<Location[]>';
  updateMany(updates: Array<{ id: string; data: Partial<Location> }>, tenantId: string): Promise<Location[]>';
  deleteMany(ids: string[], tenantId: string): Promise<boolean>';

  // Count operations
  count(tenantId: string): Promise<number>';
  countByFilters(filters: LocationSearchFilters, tenantId: string): Promise<number>';
}