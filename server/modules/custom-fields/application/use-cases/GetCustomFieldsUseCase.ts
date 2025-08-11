/**
 * GetCustomFieldsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases to handle business logic
 */

import { CustomField } from '../../domain/entities/CustomField';

interface CustomFieldRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<CustomField[]>;
}

export interface GetCustomFieldsRequest {
  tenantId: string;
  entityType?: string;
  active?: boolean;
}

export interface GetCustomFieldsResponse {
  customFields: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    entityType: string;
    required: boolean;
    options?: string[];
    isActive: boolean;
  }>;
  total: number;
}

export class GetCustomFieldsUseCase {
  constructor(
    private readonly customFieldRepository: CustomFieldRepositoryInterface
  ) {}

  async execute(request: GetCustomFieldsRequest): Promise<GetCustomFieldsResponse> {
    const customFields = await this.customFieldRepository.findByTenant(
      request.tenantId,
      {
        entityType: request.entityType,
        active: request.active
      }
    );

    return {
      customFields: customFields.map(cf => ({
        id: cf.getId(),
        name: cf.getName(),
        label: cf.getLabel(),
        type: cf.getType(),
        entityType: cf.getEntityType(),
        required: cf.isRequired(),
        options: cf.getOptions(),
        isActive: cf.isActive()
      })),
      total: customFields.length
    };
  }
}