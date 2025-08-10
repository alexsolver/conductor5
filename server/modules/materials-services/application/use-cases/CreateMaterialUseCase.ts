import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';
import { Material } from '../../domain/entities/Material';

interface CreateMaterialRequest {
  name: string;
  description?: string;
  price: number;
  category: string;
  tenantId: string;
}

export class CreateMaterialUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(materialData: CreateMaterialRequest): Promise<Material> {
    const material = new Material(
      materialData.name,
      materialData.description,
      materialData.category,
      materialData.price,
      materialData.tenantId
    );

    return await this.materialRepository.create(material);
  }
}