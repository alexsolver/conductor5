
import { Item } from '../entities/Item';

export interface IItemRepository {
  findById(id: string, tenantId: string): Promise<Item | null>;
  findAll(tenantId: string): Promise<Item[]>;
  create(item: Item): Promise<Item>;
  update(id: string, item: Partial<Item>, tenantId: string): Promise<Item | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Item[]>;
  findBySupplier(supplierId: string, tenantId: string): Promise<Item[]>;
}
