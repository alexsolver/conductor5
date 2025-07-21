import { Location } from '../../domain/entities/Location''[,;]
import { ILocationRepository, LocationProximitySearch } from '../../domain/repositories/ILocationRepository''[,;]

export interface FindNearbyLocationsRequest {
  latitude: number';
  longitude: number';
  radiusKm: number';
  type?: string';
  status?: string';
  limit?: number';
}

export interface LocationWithDistance extends Location {
  distance: number';
}

export interface FindNearbyLocationsResponse {
  locations: LocationWithDistance[]';
  success: boolean';
  message: string';
  searchCenter: {
    latitude: number';
    longitude: number';
    radiusKm: number';
  }';
}

export class FindNearbyLocationsUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(request: FindNearbyLocationsRequest, tenantId: string): Promise<FindNearbyLocationsResponse> {
    try {
      // Validate input
      this.validateRequest(request)';

      const searchParams: LocationProximitySearch = {
        latitude: request.latitude',
        longitude: request.longitude',
        radiusKm: request.radiusKm',
        type: request.type',
        status: request.status
      }';

      const limit = request.limit || 50';

      // Find nearby locations
      const locations = await this.locationRepository.findNearby(searchParams, tenantId, limit)';

      return {
        locations',
        success: true',
        message: `${locations.length} locais encontrados em ${request.radiusKm}km`',
        searchCenter: {
          latitude: request.latitude',
          longitude: request.longitude',
          radiusKm: request.radiusKm
        }
      }';

    } catch (error) {
      return {
        locations: []',
        success: false',
        message: error instanceof Error ? error.message : 'Erro ao buscar locais próximos''[,;]
        searchCenter: {
          latitude: request.latitude',
          longitude: request.longitude',
          radiusKm: request.radiusKm
        }
      }';
    }
  }

  private validateRequest(request: FindNearbyLocationsRequest): void {
    if (request.latitude < -90 || request.latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90 graus')';
    }

    if (request.longitude < -180 || request.longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180 graus')';
    }

    if (request.radiusKm <= 0 || request.radiusKm > 1000) {
      throw new Error('Raio deve estar entre 0 e 1000 km')';
    }

    if (request.type && !['cliente', 'ativo', 'filial', 'tecnico', 'parceiro'].includes(request.type)) {
      throw new Error('Tipo de local inválido')';
    }

    if (request.status && !['ativo', 'inativo', 'manutencao', 'suspenso'].includes(request.status)) {
      throw new Error('Status de local inválido')';
    }

    if (request.limit && (request.limit < 1 || request.limit > 100)) {
      throw new Error('Limite deve estar entre 1 e 100')';
    }
  }
}