
import { Stock } from '../entities/Stock';

export interface IStockRepository {
  findById(id: string, tenantId: string): Promise<Stock | null>;
  findAll(tenantId: string): Promise<Stock[]>;
  create(stock: Stock): Promise<Stock>;
  update(id: string, stock: Partial<Stock>, tenantId: string): Promise<Stock | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByItemId(itemId: string, tenantId: string): Promise<Stock[]>;
  adjustQuantity(id: string, quantity: number, tenantId: string): Promise<Stock | null>;
}
import { Stock } from '../entities/Stock';

export interface IStockRepository {
  findById(id: string, tenantId: string): Promise<Stock | null>;
  findAll(tenantId: string): Promise<Stock[]>;
  create(stock: Stock): Promise<Stock>;
  update(id: string, stock: Partial<Stock>, tenantId: string): Promise<Stock | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByItemId(itemId: string, tenantId: string): Promise<Stock[]>;
}
