
import { Material } from '../../domain/entities/Material';
import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';

export class UpdateMaterialUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(id: string, data: Partial<Material>): Promise<Material> {
    const existingMaterial = await this.materialRepository.findById(id);
    if (!existingMaterial) {
      throw new Error('Material not found');
    }

    return await this.materialRepository.update(id, data);
  }
}
