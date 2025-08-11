/**
 * Create Custom Field Use Case
 * Clean Architecture - Application Layer
 * Pure business logic without external dependencies
 */

import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';
import { CreateCustomFieldDTO } from '../dto/CreateCustomFieldDTO';
import { randomUUID } from 'crypto';

export class CreateCustomFieldUseCase {
  constructor(
    private customFieldRepository: ICustomFieldRepository
  ) {}

  async execute(data: CreateCustomFieldDTO): Promise<CustomField> {
    // Business rule validations
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Custom field name must be at least 2 characters long');
    }

    if (!data.fieldType) {
      throw new Error('Field type is required');
    }

    // Create custom field entity
    const customField = new CustomField(
      randomUUID(),
      data.tenantId,
      data.name,
      data.fieldType,
      data.isRequired || false,
      data.defaultValue,
      data.options || [],
      data.validation,
      new Date(),
      new Date()
    );

    // Save to repository
    return await this.customFieldRepository.create(customField);
  }
}