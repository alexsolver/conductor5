
import { Item, NewItem } from '../entities';

export interface IItemRepository {
  create(item: NewItem): Promise<Item>;
  findById(id: string): Promise<Item | null>;
  findByTenantId(tenantId: string): Promise<Item[]>;
  update(id: string, item: Partial<Item>): Promise<Item>;
  delete(id: string): Promise<void>;
}
