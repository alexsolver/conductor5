
import { Supplier, NewSupplier } from '../entities';

export interface ISupplierRepository {
  create(supplier: NewSupplier): Promise<Supplier>;
  findById(id: string): Promise<Supplier | null>;
  findByTenantId(tenantId: string): Promise<Supplier[]>;
  update(id: string, supplier: Partial<Supplier>): Promise<Supplier>;
  delete(id: string): Promise<void>;
}
import { Supplier } from '../entities/Supplier';

export interface ISupplierRepository {
  findById(id: string, tenantId: string): Promise<Supplier | null>;
  findAll(tenantId: string): Promise<Supplier[]>;
  create(supplier: Supplier): Promise<Supplier>;
  update(id: string, supplier: Partial<Supplier>, tenantId: string): Promise<Supplier | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
