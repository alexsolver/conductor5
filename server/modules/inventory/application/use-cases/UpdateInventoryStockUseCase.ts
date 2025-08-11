/**
 * UpdateInventoryStockUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for stock management business logic
 */

import { InventoryItem } from '../../domain/entities/InventoryItem';

interface InventoryRepositoryInterface {
  findById(id: string, tenantId: string): Promise<InventoryItem | null>;
  update(item: InventoryItem): Promise<void>;
}

export interface UpdateInventoryStockRequest {
  tenantId: string;
  itemId: string;
  operation: 'set' | 'add' | 'remove';
  quantity: number;
  reason?: string;
}

export interface UpdateInventoryStockResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    previousStock: number;
    newStock: number;
    operation: string;
    quantity: number;
    stockStatus: string;
  };
}

export class UpdateInventoryStockUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepositoryInterface
  ) {}

  async execute(request: UpdateInventoryStockRequest): Promise<UpdateInventoryStockResponse> {
    // Find the inventory item
    const inventoryItem = await this.inventoryRepository.findById(request.itemId, request.tenantId);
    if (!inventoryItem) {
      return {
        success: false,
        message: 'Inventory item not found'
      };
    }

    const previousStock = inventoryItem.getCurrentStock();

    try {
      // Perform the stock operation using domain methods
      switch (request.operation) {
        case 'set':
          inventoryItem.updateStock(request.quantity, request.reason || 'Manual adjustment');
          break;
        case 'add':
          inventoryItem.addStock(request.quantity);
          break;
        case 'remove':
          inventoryItem.removeStock(request.quantity);
          break;
        default:
          return {
            success: false,
            message: 'Invalid operation. Must be "set", "add", or "remove"'
          };
      }

      // Persist changes
      await this.inventoryRepository.update(inventoryItem);

      return {
        success: true,
        message: 'Inventory stock updated successfully',
        data: {
          id: inventoryItem.getId(),
          name: inventoryItem.getName(),
          previousStock,
          newStock: inventoryItem.getCurrentStock(),
          operation: request.operation,
          quantity: request.quantity,
          stockStatus: inventoryItem.getStockStatus()
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update inventory stock';
      return {
        success: false,
        message
      };
    }
  }
}