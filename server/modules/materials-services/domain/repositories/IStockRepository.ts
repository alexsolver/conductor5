
import { Stock, NewStock } from '../entities';

export interface IStockRepository {
  create(stock: NewStock): Promise<Stock>;
  findById(id: string): Promise<Stock | null>;
  findByTenantId(tenantId: string): Promise<Stock[]>;
  findByItemId(itemId: string): Promise<Stock[]>;
  update(id: string, stock: Partial<Stock>): Promise<Stock>;
  delete(id: string): Promise<void>;
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
