
import { LocationEntity } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/ports/ILocationRepository';

export interface CreateLocationCommand {
  name: string;
  type: 'local' | 'area' | 'regiao' | 'agrupamento' | 'rota' | 'trecho';
  description?: string;
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  parentId?: string;
  tenantId: string;
}

export class CreateLocationUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(command: CreateLocationCommand): Promise<LocationEntity> {
    const location = new LocationEntity(
      crypto.randomUUID(),
      command.tenantId,
      command.name,
      command.type,
      true,
      command.description,
      command.address,
      command.coordinates,
      command.parentId
    );

    return await this.locationRepository.create(location);
  }
}
