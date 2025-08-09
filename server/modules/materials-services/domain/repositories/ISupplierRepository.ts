
import { Supplier } from '../entities/Supplier';

export interface ISupplierRepository {
  findById(id: string, tenantId: string): Promise<Supplier | null>;
  findAll(tenantId: string): Promise<Supplier[]>;
  create(supplier: Supplier): Promise<Supplier>;
  update(id: string, supplier: Partial<Supplier>, tenantId: string): Promise<Supplier | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByName(name: string, tenantId: string): Promise<Supplier[]>;
}
import { Supplier } from '../entities/Supplier';

export interface ISupplierRepository {
  findById(id: string, tenantId: string): Promise<Supplier | null>;
  findAll(tenantId: string): Promise<Supplier[]>;
  create(supplier: Supplier): Promise<Supplier>;
  update(id: string, supplier: Partial<Supplier>, tenantId: string): Promise<Supplier | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
