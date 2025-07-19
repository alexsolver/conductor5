
import { InternalForm } from '../entities/InternalForm';

export interface IInternalFormRepository {
  create(form: InternalForm): Promise<InternalForm>;
  findById(id: string, tenantId: string): Promise<InternalForm | null>;
  findByTenant(tenantId: string): Promise<InternalForm[]>;
  findByCategory(tenantId: string, category: string): Promise<InternalForm[]>;
  update(form: InternalForm): Promise<InternalForm>;
  delete(id: string, tenantId: string): Promise<void>;
  findActive(tenantId: string): Promise<InternalForm[]>;
}
