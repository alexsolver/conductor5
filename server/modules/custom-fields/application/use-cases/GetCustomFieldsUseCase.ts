/**
 * Get Custom Fields Use Case
 * Clean Architecture - Application Layer
 */

import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';

export interface GetCustomFieldsRequest {
  tenantId: string;
}

export class GetCustomFieldsUseCase {
  constructor(
    private customFieldRepository: ICustomFieldRepository
  ) {}

  async execute(request: GetCustomFieldsRequest): Promise<CustomField[]> {
    if (!request.tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.customFieldRepository.findAll(request.tenantId);
  }
}