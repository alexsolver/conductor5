import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';

export class MaterialApplicationService {
  constructor(private materialRepository: IMaterialRepository) {}

  async createMaterial(data: any): Promise<any> {
    // Validate data
    if (!data.name || !data.type) {
      throw new Error('Name and type are required');
    }

    // Business logic here
    const material = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.materialRepository.create(material);
  }

  async getMaterials(filters: any): Promise<any[]> {
    return await this.materialRepository.findAll(filters);
  }

  async updateMaterial(id: string, data: any): Promise<any> {
    const existingMaterial = await this.materialRepository.findById(id);
    if (!existingMaterial) {
      throw new Error('Material not found');
    }

    const updatedData = {
      ...data,
      updatedAt: new Date()
    };

    return await this.materialRepository.update(id, updatedData);
  }

  async deleteMaterial(id: string): Promise<void> {
    const material = await this.materialRepository.findById(id);
    if (!material) {
      throw new Error('Material not found');
    }

    await this.materialRepository.delete(id);
  }
}