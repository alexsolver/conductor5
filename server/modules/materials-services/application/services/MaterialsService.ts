import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';
import type { Item, CreateItemRequest, UpdateItemRequest, ItemQueryOptions } from '../../domain/entities';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class MaterialsService {
  constructor(
    private itemRepository: ItemRepository,
    private db: NodePgDatabase<any>
  ) {}

  async createItem(data: CreateItemRequest & { tenantId: string; createdBy?: string }): Promise<Item> {
    // Validate required fields
    if (!data.name || !data.type) {
      throw new Error('Nome e tipo são obrigatórios');
    }

    // Set defaults
    const itemData = {
      ...data,
      measurementUnit: data.measurementUnit || 'UN',
      status: data.status || 'active'
    };

    return await this.itemRepository.create(itemData);
  }

  async getItems(tenantId: string, options?: ItemQueryOptions): Promise<Item[]> {
    return await this.itemRepository.findByTenant(tenantId, options);
  }

  async getItemById(id: string, tenantId: string): Promise<Item | null> {
    return await this.itemRepository.findById(id, tenantId);
  }

  async updateItem(id: string, tenantId: string, data: UpdateItemRequest): Promise<Item | null> {
    const existingItem = await this.itemRepository.findById(id, tenantId);
    if (!existingItem) {
      throw new Error('Item não encontrado');
    }

    return await this.itemRepository.update(id, tenantId, data);
  }

  async deleteItem(id: string, tenantId: string): Promise<boolean> {
    const existingItem = await this.itemRepository.findById(id, tenantId);
    if (!existingItem) {
      throw new Error('Item não encontrado');
    }

    return await this.itemRepository.delete(id, tenantId);
  }

  async getItemStats(tenantId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    active: number;
    inactive: number;
  }> {
    const items = await this.itemRepository.findByTenant(tenantId);
    
    const stats = {
      total: items.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      active: 0,
      inactive: 0
    };

    items.forEach(item => {
      // Count by type
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      
      // Count by status
      const status = item.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // Count active/inactive
      if (item.active) {
        stats.active++;
      } else {
        stats.inactive++;
      }
    });

    return stats;
  }

  async searchItems(tenantId: string, searchTerm: string, options?: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
  }): Promise<Item[]> {
    return await this.itemRepository.findByTenant(tenantId, {
      ...options,
      search: searchTerm
    });
  }
}