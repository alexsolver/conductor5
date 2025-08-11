/**
 * Get Materials Use Case
 * Clean Architecture - Application Layer
 */

// Clean Use Case without presentation layer dependencies
import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material } from '../../domain/entities/Material';

export interface GetMaterialsany {
  tenantId: string;
  filters?: any;
}

export class GetMaterialsUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(request: GetMaterialsany): Promise<Material[]> {
    return await this.materialRepository.findByTenant(request.tenantId);
  }
}