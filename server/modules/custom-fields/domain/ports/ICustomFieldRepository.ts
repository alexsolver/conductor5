import { CustomField } from '../entities/CustomField';

export interface ICustomFieldRepository {
  findById(id: string, tenantId: string): Promise<CustomField | null>;
  findAll(tenantId: string): Promise<CustomField[]>;
  create(entity: CustomField): Promise<CustomField>;
  update(id: string, entity: Partial<CustomField>, tenantId: string): Promise<CustomField | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
