/**
 * Get Custom Fields Use Case
 * Clean Architecture - Application Layer
 */

import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';

export interface GetCustomFieldsany {
  tenantId: string;
}

export class GetCustomFieldsUseCase {
  constructor(
    private customFieldRepository: ICustomFieldRepository
  ) {}

  async execute(request: GetCustomFieldsany): Promise<CustomField[]> {
    if (!request.tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.customFieldRepository.findAll(request.tenantId);
  }
}