
import { CustomField } from '../entities/CustomField';

export interface ICustomFieldRepository {
  create(customField: CustomField): Promise<CustomField>;
  findById(id: string): Promise<CustomField | null>;
  findByTenantId(tenantId: string): Promise<CustomField[]>;
  findByEntityType(tenantId: string, entityType: string): Promise<CustomField[]>;
  update(id: string, updates: Partial<CustomField>): Promise<CustomField>;
  delete(id: string): Promise<void>;
}
