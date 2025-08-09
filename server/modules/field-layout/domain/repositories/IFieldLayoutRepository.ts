
import { FieldLayout } from '../entities/FieldLayout';

export interface IFieldLayoutRepository {
  save(fieldLayout: FieldLayout): Promise<void>;
  findById(id: string): Promise<FieldLayout | null>;
  findByTenantId(tenantId: string): Promise<FieldLayout[]>;
  update(id: string, fieldLayout: Partial<FieldLayout>): Promise<void>;
  delete(id: string): Promise<void>;
}
