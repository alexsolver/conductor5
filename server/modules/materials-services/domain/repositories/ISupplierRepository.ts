
import { Supplier, NewSupplier } from '../entities';

export interface ISupplierRepository {
  create(supplier: NewSupplier): Promise<Supplier>;
  findById(id: string): Promise<Supplier | null>;
  findByTenantId(tenantId: string): Promise<Supplier[]>;
  update(id: string, supplier: Partial<Supplier>): Promise<Supplier>;
  delete(id: string): Promise<void>;
}
