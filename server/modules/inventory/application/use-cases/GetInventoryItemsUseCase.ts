/**
 * GetInventoryItemsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for inventory management business logic
 */

import { InventoryItem } from '../../domain/entities/InventoryItem';

interface InventoryRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<InventoryItem[]>;
  findLowStockItems(tenantId: string): Promise<InventoryItem[]>;
}

export interface GetInventoryItemsRequest {
  tenantId: string;
  category?: string;
  location?: string;
  lowStock?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetInventoryItemsResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    location: string;
    lastUpdated: Date;
    isLowStock: boolean;
  }>;
  filters: any;
}

export class GetInventoryItemsUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepositoryInterface
  ) {}

  async execute(request: GetInventoryItemsRequest): Promise<GetInventoryItemsResponse> {
    let inventoryItems: InventoryItem[];

    if (request.lowStock) {
      inventoryItems = await this.inventoryRepository.findLowStockItems(request.tenantId);
    } else {
      inventoryItems = await this.inventoryRepository.findByTenant(request.tenantId, {
        category: request.category,
        location: request.location,
        search: request.search,
        limit: request.limit,
        offset: request.offset
      });
    }

    return {
      success: true,
      message: 'Inventory items retrieved successfully',
      data: inventoryItems.map(item => ({
        id: item.getId(),
        name: item.getName(),
        sku: item.getSku(),
        category: item.getCategory(),
        currentStock: item.getCurrentStock(),
        minStock: item.getMinStock(),
        maxStock: item.getMaxStock(),
        location: item.getLocation(),
        lastUpdated: item.getLastUpdated(),
        isLowStock: item.isLowStock()
      })),
      filters: {
        category: request.category,
        location: request.location,
        lowStock: request.lowStock,
        search: request.search,
        tenantId: request.tenantId
      }
    };
  }
}