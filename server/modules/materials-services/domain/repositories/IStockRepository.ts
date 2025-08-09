
import { Stock, NewStock } from '../entities';

export interface IStockRepository {
  create(stock: NewStock): Promise<Stock>;
  findById(id: string): Promise<Stock | null>;
  findByTenantId(tenantId: string): Promise<Stock[]>;
  findByItemId(itemId: string): Promise<Stock[]>;
  update(id: string, stock: Partial<Stock>): Promise<Stock>;
  delete(id: string): Promise<void>;
}
