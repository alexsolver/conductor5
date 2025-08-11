/**
 * Create Material Use Case
 * Clean Architecture - Application Layer
 * Pure business logic without external dependencies
 */

import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material } from '../../domain/entities/Material';
import { CreateMaterialDTO } from '../dto/CreateMaterialDTO';

export class CreateMaterialUseCase {
  constructor(
    private materialRepository: IMaterialRepository
  ) {}

  async execute(data: CreateMaterialDTO, tenantId: string): Promise<Material> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      const material = Material.create(
        data.name,
        data.description,
        data.code,
        data.unit,
        data.price,
        data.category,
        tenantId
      );

      if (!material.validateForCreation()) {
        throw new Error('Invalid material data');
      }

      const savedMaterial = await this.materialRepository.create(material);
      return savedMaterial;
    } catch (error) {
      console.error('❌ [CreateMaterialUseCase] Error:', error);
      throw new Error('Failed to create material');
    }
  }
}