/**
 * Get Materials Use Case
 * Clean Architecture - Application Layer
 */

import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material } from '../../domain/entities/Material';

export interface GetMaterialsRequest {
  tenantId: string;
  category?: string;
}

export class GetMaterialsUseCase {
  constructor(
    private materialRepository: IMaterialRepository
  ) {}

  async execute(request: GetMaterialsRequest): Promise<Material[]> {
    if (!request.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (request.category) {
      return await this.materialRepository.findByCategory(request.category, request.tenantId);
    }

    return await this.materialRepository.findAll(request.tenantId);
  }
}