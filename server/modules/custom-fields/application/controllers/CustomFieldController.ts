interface HttpRequest {
  body: any;
  params: any;
  query: any;
}

interface HttpResponse {
  status: (code: number) => HttpResponse;
  json: (data: any) => void;
}

import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { CustomField } from '../../domain/entities/CustomField';
import { Request, Response } from 'express';


export interface CreateCustomFieldDTO {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  entityType: string;
  tenantId: string;
}

export class CustomFieldController {
  constructor(private customFieldRepository: ICustomFieldRepository) {}

  async createCustomField(data: CreateCustomFieldDTO): Promise<CustomField> {
    const customField: CustomField = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.customFieldRepository.create(customField);
  }

  async getCustomFields(tenantId: string, entityType?: string): Promise<CustomField[]> {
    if (entityType) {
      return await this.customFieldRepository.findByEntityType(tenantId, entityType);
    }
    return await this.customFieldRepository.findByTenantId(tenantId);
  }

  async updateCustomField(id: string, updates: Partial<CustomField>): Promise<CustomField> {
    return await this.customFieldRepository.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteCustomField(id: string): Promise<void> {
    await this.customFieldRepository.delete(id);
  }
}