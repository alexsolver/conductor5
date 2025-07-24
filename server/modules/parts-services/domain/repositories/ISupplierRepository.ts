import { Supplier, CreateSupplierEntity, UpdateSupplierEntity } from '../entities/Supplier';

export interface ISupplierRepository {
  // CRUD básico
  create(tenantId: string, data: CreateSupplierEntity): Promise<Supplier>;
  findById(tenantId: string, id: string): Promise<Supplier | null>;
  findAll(tenantId: string, filters?: SupplierFilters): Promise<Supplier[]>;
  update(tenantId: string, id: string, data: UpdateSupplierEntity): Promise<Supplier>;
  delete(tenantId: string, id: string): Promise<void>;

  // Consultas específicas
  findByDocumentNumber(tenantId: string, documentNumber: string): Promise<Supplier | null>;
  findByEmail(tenantId: string, email: string): Promise<Supplier | null>;
  search(tenantId: string, query: string): Promise<Supplier[]>;
  findActiveSuppliers(tenantId: string): Promise<Supplier[]>;

  // Estatísticas
  getTotalCount(tenantId: string): Promise<number>;
  getActiveCount(tenantId: string): Promise<number>;
}

export interface SupplierFilters {
  active?: boolean;
  city?: string;
  state?: string;
  search?: string;
  limit?: number;
  offset?: number;
}