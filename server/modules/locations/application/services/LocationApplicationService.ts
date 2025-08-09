
import { CreateLocationUseCase } from '../use-cases/CreateLocationUseCase';
import { ILocationRepository } from '../../domain/ports/ILocationRepository';
import { CreateLocationDTO, LocationResponseDTO } from '../dto/CreateLocationDTO';

export class LocationApplicationService {
  constructor(
    private createLocationUseCase: CreateLocationUseCase,
    private locationRepository: ILocationRepository
  ) {}

  async createLocation(dto: CreateLocationDTO): Promise<LocationResponseDTO> {
    const location = await this.createLocationUseCase.execute(dto);
    
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      coordinates: location.coordinates,
      description: location.description,
      createdAt: location.createdAt.toISOString()
    };
  }

  async getLocationById(id: string): Promise<LocationResponseDTO | null> {
    const location = await this.locationRepository.findById(id);
    
    if (!location) return null;
    
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      coordinates: location.coordinates,
      description: location.description,
      createdAt: location.createdAt.toISOString()
    };
  }
}
