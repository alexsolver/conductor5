
import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';

export class UpdateMaterialUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(id: string, materialData: any): Promise<any> {
    try {
      const existingMaterial = await this.materialRepository.findById(id);
      if (!existingMaterial) {
        throw new Error('Material not found');
      }

      return await this.materialRepository.update(id, materialData);
    } catch (error) {
      throw new Error(`Failed to update material: ${error.message}`);
    }
  }
}
