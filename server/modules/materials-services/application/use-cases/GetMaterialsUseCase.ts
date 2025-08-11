/**
 * GetMaterialsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for materials management
 */

import { Material } from '../../domain/entities/Material';

interface MaterialRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<Material[]>;
}

export interface GetMaterialsRequest {
  tenantId: string;
  search?: string;
  category?: string;
  supplier?: string;
}

export interface GetMaterialsResponse {
  materials: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    unitPrice?: number;
    supplier?: string;
    isActive: boolean;
  }>;
  total: number;
}

export class GetMaterialsUseCase {
  constructor(
    private readonly materialRepository: MaterialRepositoryInterface
  ) {}

  async execute(request: GetMaterialsRequest): Promise<GetMaterialsResponse> {
    const materials = await this.materialRepository.findByTenant(
      request.tenantId,
      {
        search: request.search,
        category: request.category,
        supplier: request.supplier
      }
    );

    return {
      materials: materials.map((m: Material) => ({
        id: m.getId(),
        name: m.getName(),
        description: m.getDescription(),
        category: m.getCategory(),
        unitPrice: m.getUnitPrice(),
        supplier: m.getSupplier(),
        isActive: m.isActive()
      })),
      total: materials.length
    };
  }
}