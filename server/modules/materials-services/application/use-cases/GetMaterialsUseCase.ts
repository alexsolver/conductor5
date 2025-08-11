/**
 * GetMaterialsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for materials management
 */

import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material } from '../../domain/entities/Material';

export class GetMaterialsUseCase {
  constructor(
    private materialRepository: IMaterialRepository
  ) {}

  async execute(tenantId: string): Promise<Material[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      const materials = await this.materialRepository.findByTenant(tenantId);
      return materials;
    } catch (error) {
      console.error('❌ [GetMaterialsUseCase] Error:', error);
      throw new Error('Failed to retrieve materials');
    }
  }
}