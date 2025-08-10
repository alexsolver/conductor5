
export interface IStockRepository {
  findById(id: string, tenantId: string): Promise<Stock | null>;
  findByItemId(itemId: string, tenantId: string): Promise<Stock[]>;
  findByTenantId(tenantId: string, options?: {
    page?: number;
    limit?: number;
    warehouseId?: string;
  }): Promise<{
    stocks: Stock[];
    total: number;
  }>;
  create(stock: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stock>;
  update(id: string, tenantId: string, data: Partial<Stock>): Promise<Stock>;
  delete(id: string, tenantId: string): Promise<void>;
  adjustQuantity(itemId: string, warehouseId: string, tenantId: string, adjustment: number): Promise<Stock>;
}

export interface Stock {
  id: string;
  tenantId: string;
  itemId: string;
  warehouseId?: string;
  quantity: number;
  reservedQuantity: number;
  minQuantity: number;
  maxQuantity?: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IStockRepository {
  findById(id: string, tenantId: string): Promise<any | null>;
  findByTenantId(tenantId: string): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, tenantId: string, data: any): Promise<any>;
  delete(id: string, tenantId: string): Promise<void>;
  findByItemId(itemId: string, tenantId: string): Promise<any[]>;
  updateStock(itemId: string, tenantId: string, quantity: number): Promise<any>;
}
