
import { Material } from '../../domain/entities/Material';
import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';

export class CreateMaterialUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(materialData: any, tenantId: string): Promise<Material> {
    const material = new Material(materialData);
    material.tenantId = tenantId;
    
    return await this.materialRepository.create(material);
  }
}
