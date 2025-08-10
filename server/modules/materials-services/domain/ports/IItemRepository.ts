
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
export interface IItemRepository {
  findAll(tenantId: string): Promise<any[]>;
  findById(id: string, tenantId: string): Promise<any | null>;
  create(data: any, tenantId: string): Promise<any>;
  update(id: string, data: any, tenantId: string): Promise<any>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<any[]>;
}
export interface IItemRepository {
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
  create(item: any): Promise<any>;
  update(id: string, item: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  findByTenantId(tenantId: string): Promise<any[]>;
}
