
export interface IItemRepository {
  findById(id: string, tenantId: string): Promise<Item | null>;
  findByTenantId(tenantId: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  }): Promise<{
    items: Item[];
    total: number;
  }>;
  create(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item>;
  update(id: string, tenantId: string, data: Partial<Item>): Promise<Item>;
  delete(id: string, tenantId: string): Promise<void>;
  findByCategory(categoryId: string, tenantId: string): Promise<Item[]>;
  bulkCreate(items: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Item[]>;
}

export interface Item {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  code?: string;
  categoryId?: string;
  type: 'material' | 'service';
  unitPrice?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
