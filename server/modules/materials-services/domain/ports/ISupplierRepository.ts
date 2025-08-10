
export interface ISupplierRepository {
  findById(id: string, tenantId: string): Promise<Supplier | null>;
  findByTenantId(tenantId: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    suppliers: Supplier[];
    total: number;
  }>;
  create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier>;
  update(id: string, tenantId: string, data: Partial<Supplier>): Promise<Supplier>;
  delete(id: string, tenantId: string): Promise<void>;
  findByItemId(itemId: string, tenantId: string): Promise<Supplier[]>;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
