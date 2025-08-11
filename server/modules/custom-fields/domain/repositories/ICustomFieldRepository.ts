/**
 * Custom Field Repository Interface
 * Clean Architecture - Domain Layer
 */

import { CustomField } from '../entities/CustomField';

export interface ICustomFieldRepository {
  findById(id: string, tenantId: string): Promise<CustomField | null>;
  findAll(tenantId: string): Promise<CustomField[]>;
  create(customField: CustomField): Promise<CustomField>;
  update(id: string, tenantId: string, data: Partial<CustomField>): Promise<CustomField>;
  delete(id: string, tenantId: string): Promise<void>;
  findByName(name: string, tenantId: string): Promise<CustomField | null>;
}