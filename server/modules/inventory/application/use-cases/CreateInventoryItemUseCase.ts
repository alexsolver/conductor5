/**
 * CreateInventoryItemUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for inventory creation business logic
 */

import { InventoryItem } from '../../domain/entities/InventoryItem';

interface InventoryRepositoryInterface {
  save(item: InventoryItem): Promise<void>;
  findBySku(sku: string, tenantId: string): Promise<InventoryItem | null>;
}

export interface CreateInventoryItemRequest {
  tenantId: string;
  name: string;
  sku: string;
  category: string;
  quantity?: number;
  minStock?: number;
  maxStock?: number;
  location: string;
  unitCost?: number;
}

export interface CreateInventoryItemResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    location: string;
  };
}

export class CreateInventoryItemUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepositoryInterface
  ) {}

  async execute(request: CreateInventoryItemRequest): Promise<CreateInventoryItemResponse> {
    // Validate required fields
    if (!request.name || !request.sku || !request.category) {
      return {
        success: false,
        message: 'Name, SKU, and category are required'
      };
    }

    // Check if SKU already exists
    const existingItem = await this.inventoryRepository.findBySku(request.sku, request.tenantId);
    if (existingItem) {
      return {
        success: false,
        message: 'An item with this SKU already exists'
      };
    }

    // Create domain entity
    const inventoryItem = new InventoryItem(
      generateId(),
      request.tenantId,
      request.name,
      request.sku,
      request.category,
      request.quantity || 0,
      request.minStock || 0,
      request.maxStock || 100,
      request.location,
      request.unitCost || 0
    );

    // Persist through repository
    await this.inventoryRepository.save(inventoryItem);

    return {
      success: true,
      message: 'Inventory item created successfully',
      data: {
        id: inventoryItem.getId(),
        name: inventoryItem.getName(),
        sku: inventoryItem.getSku(),
        category: inventoryItem.getCategory(),
        currentStock: inventoryItem.getCurrentStock(),
        minStock: inventoryItem.getMinStock(),
        maxStock: inventoryItem.getMaxStock(),
        location: inventoryItem.getLocation()
      }
    };
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}