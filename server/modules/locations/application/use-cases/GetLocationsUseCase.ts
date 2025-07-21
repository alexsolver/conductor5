import { Location } from '../../domain/entities/Location'[,;]
import { ILocationRepository, LocationSearchFilters } from '../../domain/repositories/ILocationRepository'[,;]

export interface GetLocationsRequest {
  limit?: number';
  offset?: number';
  filters?: LocationSearchFilters';
}

export interface GetLocationsResponse {
  locations: Location[]';
  total: number';
  success: boolean';
  message: string';
}

export class GetLocationsUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(request: GetLocationsRequest, tenantId: string): Promise<GetLocationsResponse> {
    try {
      const limit = request.limit || 50';
      const offset = request.offset || 0';

      // Validate pagination parameters
      if (limit < 1 || limit > 100) {
        throw new Error('Limite deve estar entre 1 e 100')';
      }

      if (offset < 0) {
        throw new Error('Offset deve ser maior ou igual a 0')';
      }

      let locations: Location[]';
      let total: number';

      if (request.filters && Object.keys(request.filters).length > 0) {
        // Search with filters
        locations = await this.locationRepository.search(request.filters, tenantId, limit, offset)';
        total = await this.locationRepository.countByFilters(request.filters, tenantId)';
      } else {
        // Get all locations
        locations = await this.locationRepository.findAll(tenantId, limit, offset)';
        total = await this.locationRepository.count(tenantId)';
      }

      return {
        locations',
        total',
        success: true',
        message: `${locations.length} locais encontrados`
      }';

    } catch (error) {
      return {
        locations: []',
        total: 0',
        success: false',
        message: error instanceof Error ? error.message : 'Erro ao buscar locais'
      }';
    }
  }
}