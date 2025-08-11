/**
 * GetLocationsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for location management business logic
 */

import { Location } from '../../domain/entities/Location';

interface LocationRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<Location[]>;
}

export interface GetLocationsRequest {
  tenantId: string;
  type?: string;
  region?: string;
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetLocationsResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    address: string;
    type: string;
    coordinates: { lat: number; lng: number } | null;
    operatingHours: any;
    isActive: boolean;
    region: string;
  }>;
  filters: any;
}

export class GetLocationsUseCase {
  constructor(
    private readonly locationRepository: LocationRepositoryInterface
  ) {}

  async execute(request: GetLocationsRequest): Promise<GetLocationsResponse> {
    const locations = await this.locationRepository.findByTenant(request.tenantId, {
      type: request.type,
      region: request.region,
      active: request.active,
      search: request.search,
      limit: request.limit,
      offset: request.offset
    });

    return {
      success: true,
      message: 'Locations retrieved successfully',
      data: locations.map(location => ({
        id: location.getId(),
        name: location.getName(),
        address: location.getAddress(),
        type: location.getType(),
        coordinates: location.getCoordinates(),
        operatingHours: location.getOperatingHours(),
        isActive: location.isActive(),
        region: location.getRegion()
      })),
      filters: {
        type: request.type,
        region: request.region,
        active: request.active,
        search: request.search,
        tenantId: request.tenantId
      }
    };
  }
}