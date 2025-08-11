/**
 * CustomFieldRepositoryInterface - Clean Architecture Domain Layer
 * Resolves violations: Missing repository interfaces in Domain layer
 */

import { CustomField } from '../entities/CustomField';

export interface CustomFieldFilters {
  entityType?: string;
  active?: boolean;
}

export interface CustomFieldRepositoryInterface {
  save(customField: CustomField): Promise<void>;
  findById(id: string, tenantId: string): Promise<CustomField | null>;
  findByTenant(tenantId: string, filters?: CustomFieldFilters): Promise<CustomField[]>;
  update(customField: CustomField): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}