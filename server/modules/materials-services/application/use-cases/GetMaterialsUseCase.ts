/**
 * Get Materials Use Case
 * Clean Architecture - Application Layer
 */

// Clean Use Case without presentation layer dependencies
import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material } from '../../domain/entities/Material';

interface GetMaterialsRequest {
  tenantId: string;
  filters?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

interface GetMaterialsResponse {
  success: boolean;
  data?: any[];
  total?: number;
  message?: string;
}

export class GetMaterialsUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(request: GetMaterialsRequest): Promise<GetMaterialsResponse> {
    const materials = await this.materialRepository.findByTenant(request.tenantId);
    return {
      success: true,
      data: materials,
      total: materials.length,
      message: 'Materials retrieved successfully',
    };
  }
}