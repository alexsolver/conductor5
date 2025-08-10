
import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';
import { Material } from '../../domain/entities/Material';

export class CreateMaterialUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(materialData: any, tenantId: string): Promise<Material> {
    const material = new Material(
      materialData.id,
      materialData.name,
      materialData.description,
      materialData.category,
      materialData.price,
      tenantId
    );

    return await this.materialRepository.create(material);
  }
}
