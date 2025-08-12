/**
 * Simplified Inventory Repository - Phase 11 Implementation
 * 
 * Implementação simplificada do repositório de inventário
 * Para uso imediato enquanto integração com banco não está disponível
 * 
 * @module SimplifiedInventoryRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 11 Clean Architecture Implementation
 */

import { InventoryItem } from '../../domain/entities/InventoryItem';
import { 
  IInventoryRepository, 
  InventoryFilters, 
  InventoryStatistics, 
  StockMovement 
} from '../../domain/repositories/IInventoryRepository';

export class SimplifiedInventoryRepository implements IInventoryRepository {
  private items: InventoryItem[] = [];
  private stockMovements: StockMovement[] = [];

  async create(item: InventoryItem): Promise<InventoryItem> {
    this.items.push(item);
    console.log(`[SIMPLIFIED-INVENTORY-REPO] Created item: ${item.id} (${item.sku} - ${item.name}) for tenant: ${item.tenantId}`);
    return item;
  }

  async findById(id: string, tenantId: string): Promise<InventoryItem | null> {
    const item = this.items.find(i => i.id === id && i.tenantId === tenantId);
    return item || null;
  }

  async findBySku(sku: string, tenantId: string): Promise<InventoryItem | null> {
    const item = this.items.find(i => i.sku === sku && i.tenantId === tenantId);
    return item || null;
  }

  async findAll(filters: InventoryFilters): Promise<InventoryItem[]> {
    let filteredItems = this.items.filter(item => {
      if (filters.tenantId && item.tenantId !== filters.tenantId) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.subcategory && item.subcategory !== filters.subcategory) return false;
      if (filters.brand && item.brand !== filters.brand) return false;
      if (filters.supplier && item.supplier !== filters.supplier) return false;
      if (filters.location && item.location !== filters.location) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.isActive !== undefined && item.isActive !== filters.isActive) return false;
      if (filters.isLowStock && item.currentStock > item.minimumStock) return false;
      if (filters.isExpired && (!item.expirationDate || item.expirationDate > new Date())) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSku = item.sku.toLowerCase().includes(searchLower);
        const matchesName = item.name.toLowerCase().includes(searchLower);
        const matchesDescription = item.description?.toLowerCase().includes(searchLower);
        if (!matchesSku && !matchesName && !matchesDescription) return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => item.tags?.includes(tag));
        if (!hasMatchingTag) return false;
      }
      return true;
    });

    return filteredItems;
  }

  async update(id: string, tenantId: string, updateData: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const index = this.items.findIndex(i => i.id === id && i.tenantId === tenantId);
    if (index === -1) return null;

    this.items[index] = { ...this.items[index], ...updateData, updatedAt: new Date() };
    console.log(`[SIMPLIFIED-INVENTORY-REPO] Updated item: ${id} for tenant: ${tenantId}`);
    return this.items[index];
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const index = this.items.findIndex(i => i.id === id && i.tenantId === tenantId);
    if (index === -1) return false;

    this.items[index].isActive = false;
    this.items[index].status = 'inactive';
    this.items[index].updatedAt = new Date();
    console.log(`[SIMPLIFIED-INVENTORY-REPO] Soft deleted item: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async hardDelete(id: string, tenantId: string): Promise<boolean> {
    const index = this.items.findIndex(i => i.id === id && i.tenantId === tenantId);
    if (index === -1) return false;

    this.items.splice(index, 1);
    console.log(`[SIMPLIFIED-INVENTORY-REPO] Hard deleted item: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async findByCategory(category: string, tenantId: string): Promise<InventoryItem[]> {
    return this.items.filter(i => i.category === category && i.tenantId === tenantId);
  }

  async findBySupplier(supplier: string, tenantId: string): Promise<InventoryItem[]> {
    return this.items.filter(i => i.supplier === supplier && i.tenantId === tenantId);
  }

  async findByLocation(location: string, tenantId: string): Promise<InventoryItem[]> {
    return this.items.filter(i => i.location === location && i.tenantId === tenantId);
  }

  async findByStatus(status: string, tenantId: string): Promise<InventoryItem[]> {
    return this.items.filter(i => i.status === status && i.tenantId === tenantId);
  }

  async search(query: string, tenantId: string): Promise<InventoryItem[]> {
    const searchLower = query.toLowerCase();
    return this.items.filter(item => 
      item.tenantId === tenantId && 
      (item.sku.toLowerCase().includes(searchLower) || 
       item.name.toLowerCase().includes(searchLower) ||
       item.description?.toLowerCase().includes(searchLower))
    );
  }

  async findLowStockItems(tenantId: string): Promise<InventoryItem[]> {
    return this.items.filter(i => 
      i.tenantId === tenantId && 
      i.currentStock <= i.minimumStock &&
      i.isActive
    );
  }

  async findOverStockItems(tenantId: string): Promise<InventoryItem[]> {
    return this.items.filter(i => 
      i.tenantId === tenantId && 
      i.maximumStock !== undefined &&
      i.currentStock >= i.maximumStock &&
      i.isActive
    );
  }

  async findExpiredItems(tenantId: string): Promise<InventoryItem[]> {
    const now = new Date();
    return this.items.filter(i => 
      i.tenantId === tenantId && 
      i.expirationDate && 
      i.expirationDate < now &&
      i.isActive
    );
  }

  async findExpiringSoonItems(tenantId: string, days: number = 30): Promise<InventoryItem[]> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    
    return this.items.filter(i => 
      i.tenantId === tenantId && 
      i.expirationDate && 
      i.expirationDate <= warningDate &&
      i.expirationDate > new Date() &&
      i.isActive
    );
  }

  async findOutOfStockItems(tenantId: string): Promise<InventoryItem[]> {
    return this.items.filter(i => 
      i.tenantId === tenantId && 
      i.currentStock === 0
    );
  }

  async getStatistics(tenantId: string): Promise<InventoryStatistics> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    
    const totalItems = tenantItems.length;
    const activeItems = tenantItems.filter(i => i.isActive).length;
    const inactiveItems = tenantItems.filter(i => !i.isActive).length;
    const outOfStockItems = tenantItems.filter(i => i.currentStock === 0).length;
    const lowStockItems = tenantItems.filter(i => i.currentStock <= i.minimumStock).length;
    const overStockItems = tenantItems.filter(i => 
      i.maximumStock && i.currentStock >= i.maximumStock
    ).length;
    const expiredItems = tenantItems.filter(i => 
      i.expirationDate && i.expirationDate < new Date()
    ).length;
    const expiringSoonItems = tenantItems.filter(i => {
      if (!i.expirationDate) return false;
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 30);
      return i.expirationDate <= warningDate && i.expirationDate > new Date();
    }).length;
    
    const totalStockValue = tenantItems.reduce((sum, item) => 
      sum + (item.currentStock * item.averageCost), 0
    );

    const itemsByCategory = tenantItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const itemsBySupplier = tenantItems.reduce((acc, item) => {
      if (item.supplier) {
        acc[item.supplier] = (acc[item.supplier] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const itemsByLocation = tenantItems.reduce((acc, item) => {
      acc[item.location] = (acc[item.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalStock = tenantItems.reduce((sum, item) => sum + item.currentStock, 0);
    const averageStockLevel = totalItems > 0 ? totalStock / totalItems : 0;

    const topValueItems = tenantItems
      .sort((a, b) => (b.currentStock * b.averageCost) - (a.currentStock * a.averageCost))
      .slice(0, 10);

    return {
      totalItems,
      activeItems,
      inactiveItems,
      outOfStockItems,
      lowStockItems,
      overStockItems,
      expiredItems,
      expiringSoonItems,
      totalStockValue,
      itemsByCategory,
      itemsBySupplier,
      itemsByLocation,
      averageStockLevel,
      topValueItems
    };
  }

  async count(filters: InventoryFilters): Promise<number> {
    const items = await this.findAll(filters);
    return items.length;
  }

  async getTotalStockValue(tenantId: string): Promise<number> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    return tenantItems.reduce((sum, item) => 
      sum + (item.currentStock * item.averageCost), 0
    );
  }

  async getCategoriesWithCounts(tenantId: string): Promise<Array<{ category: string; itemCount: number; stockValue: number }>> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    const categories = [...new Set(tenantItems.map(i => i.category))];
    
    return categories.map(category => {
      const categoryItems = tenantItems.filter(i => i.category === category);
      const itemCount = categoryItems.length;
      const stockValue = categoryItems.reduce((sum, item) => 
        sum + (item.currentStock * item.averageCost), 0
      );
      return { category, itemCount, stockValue };
    });
  }

  async getSuppliersWithCounts(tenantId: string): Promise<Array<{ supplier: string; itemCount: number; stockValue: number }>> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId && i.supplier);
    const suppliers = [...new Set(tenantItems.map(i => i.supplier).filter(Boolean))] as string[];
    
    return suppliers.map(supplier => {
      const supplierItems = tenantItems.filter(i => i.supplier === supplier);
      const itemCount = supplierItems.length;
      const stockValue = supplierItems.reduce((sum, item) => 
        sum + (item.currentStock * item.averageCost), 0
      );
      return { supplier, itemCount, stockValue };
    });
  }

  async getLocationsWithCounts(tenantId: string): Promise<Array<{ location: string; itemCount: number; stockValue: number }>> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    const locations = [...new Set(tenantItems.map(i => i.location))];
    
    return locations.map(location => {
      const locationItems = tenantItems.filter(i => i.location === location);
      const itemCount = locationItems.length;
      const stockValue = locationItems.reduce((sum, item) => 
        sum + (item.currentStock * item.averageCost), 0
      );
      return { location, itemCount, stockValue };
    });
  }

  async getTopValueItems(tenantId: string, limit: number = 10): Promise<InventoryItem[]> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    return tenantItems
      .sort((a, b) => (b.currentStock * b.averageCost) - (a.currentStock * a.averageCost))
      .slice(0, limit);
  }

  async existsBySku(sku: string, tenantId: string, excludeId?: string): Promise<boolean> {
    return this.items.some(item => 
      item.sku === sku && 
      item.tenantId === tenantId && 
      (!excludeId || item.id !== excludeId)
    );
  }

  async validateStockLevels(tenantId: string): Promise<{
    lowStockCount: number;
    overStockCount: number;
    outOfStockCount: number;
  }> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    
    const lowStockCount = tenantItems.filter(i => i.currentStock <= i.minimumStock).length;
    const overStockCount = tenantItems.filter(i => 
      i.maximumStock && i.currentStock >= i.maximumStock
    ).length;
    const outOfStockCount = tenantItems.filter(i => i.currentStock === 0).length;

    return { lowStockCount, overStockCount, outOfStockCount };
  }

  async getAvailableCategories(tenantId: string): Promise<string[]> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    return [...new Set(tenantItems.map(i => i.category))];
  }

  async getAvailableSuppliers(tenantId: string): Promise<string[]> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId && i.supplier);
    return [...new Set(tenantItems.map(i => i.supplier).filter(Boolean))] as string[];
  }

  async getAvailableLocations(tenantId: string): Promise<string[]> {
    const tenantItems = this.items.filter(i => i.tenantId === tenantId);
    return [...new Set(tenantItems.map(i => i.location))];
  }

  async recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    const stockMovement: StockMovement = {
      ...movement,
      id: `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    this.stockMovements.push(stockMovement);
    console.log(`[SIMPLIFIED-INVENTORY-REPO] Recorded stock movement: ${stockMovement.id} for item: ${movement.itemId}`);
    return stockMovement;
  }

  async getStockMovements(itemId: string, tenantId: string, limit: number = 50): Promise<StockMovement[]> {
    // Note: In a simplified implementation, we don't have tenant info in movements
    // In a real implementation, this would be properly filtered
    return this.stockMovements
      .filter(m => m.itemId === itemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async adjustStock(itemId: string, tenantId: string, adjustment: number, reason: string, createdBy?: string): Promise<InventoryItem | null> {
    const item = await this.findById(itemId, tenantId);
    if (!item) return null;

    const previousStock = item.currentStock;
    const newStock = previousStock + adjustment;

    // Record the movement
    await this.recordStockMovement({
      itemId,
      movementType: 'adjustment',
      quantity: adjustment,
      previousStock,
      newStock,
      reason,
      createdBy
    });

    // Update the item
    return await this.update(itemId, tenantId, {
      currentStock: newStock,
      updatedBy: createdBy,
      updatedAt: new Date()
    });
  }

  async transferStock(itemId: string, fromLocation: string, toLocation: string, quantity: number, tenantId: string, createdBy?: string): Promise<boolean> {
    // Simplified implementation - would need multiple location tracking in real scenario
    const item = await this.findById(itemId, tenantId);
    if (!item || item.location !== fromLocation || item.currentStock < quantity) {
      return false;
    }

    // Record the transfer
    await this.recordStockMovement({
      itemId,
      movementType: 'transfer',
      quantity: -quantity,
      previousStock: item.currentStock,
      newStock: item.currentStock - quantity,
      reason: `Transfer from ${fromLocation} to ${toLocation}`,
      createdBy
    });

    // Update location and stock
    await this.update(itemId, tenantId, {
      location: toLocation,
      currentStock: item.currentStock - quantity,
      updatedBy: createdBy
    });

    return true;
  }

  // Simplified implementations for bulk operations
  async createBulk(items: InventoryItem[]): Promise<InventoryItem[]> {
    const createdItems: InventoryItem[] = [];
    for (const item of items) {
      createdItems.push(await this.create(item));
    }
    console.log(`[SIMPLIFIED-INVENTORY-REPO] Created ${createdItems.length} items in bulk`);
    return createdItems;
  }

  async updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<InventoryItem> }>): Promise<InventoryItem[]> {
    const updatedItems: InventoryItem[] = [];
    
    for (const update of updates) {
      const updatedItem = await this.update(update.id, update.tenantId, update.data);
      if (updatedItem) {
        updatedItems.push(updatedItem);
      }
    }

    console.log(`[SIMPLIFIED-INVENTORY-REPO] Updated ${updatedItems.length} items in bulk`);
    return updatedItems;
  }

  async bulkStockAdjustment(adjustments: Array<{
    itemId: string;
    adjustment: number;
    reason: string;
  }>, tenantId: string, createdBy?: string): Promise<InventoryItem[]> {
    const adjustedItems: InventoryItem[] = [];

    for (const adj of adjustments) {
      const adjustedItem = await this.adjustStock(adj.itemId, tenantId, adj.adjustment, adj.reason, createdBy);
      if (adjustedItem) {
        adjustedItems.push(adjustedItem);
      }
    }

    console.log(`[SIMPLIFIED-INVENTORY-REPO] Bulk adjusted ${adjustedItems.length} items`);
    return adjustedItems;
  }

  async importItems(itemsData: Array<Partial<InventoryItem>>, tenantId: string, createdBy?: string): Promise<{
    success: InventoryItem[];
    errors: Array<{ row: number; error: string; data: Partial<InventoryItem> }>;
  }> {
    const success: InventoryItem[] = [];
    const errors: Array<{ row: number; error: string; data: Partial<InventoryItem> }> = [];

    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      
      try {
        // Basic validation
        if (!itemData.sku || !itemData.name || !itemData.category) {
          throw new Error('SKU, name and category are required');
        }

        // Check for duplicate SKU
        const skuExists = await this.existsBySku(itemData.sku, tenantId);
        if (skuExists) {
          throw new Error(`SKU '${itemData.sku}' already exists`);
        }

        // Create the item
        const item: InventoryItem = {
          id: `inventory_import_${Date.now()}_${i}`,
          tenantId,
          sku: itemData.sku,
          name: itemData.name,
          category: itemData.category,
          description: itemData.description,
          subcategory: itemData.subcategory,
          brand: itemData.brand,
          model: itemData.model,
          unitOfMeasure: (itemData.unitOfMeasure as any) || 'unit',
          currentStock: itemData.currentStock || 0,
          minimumStock: itemData.minimumStock || 0,
          maximumStock: itemData.maximumStock,
          unitCost: itemData.unitCost || 0,
          averageCost: itemData.averageCost || itemData.unitCost || 0,
          lastPurchasePrice: itemData.lastPurchasePrice,
          supplier: itemData.supplier,
          supplierCode: itemData.supplierCode,
          location: itemData.location || 'default',
          shelf: itemData.shelf,
          serialNumbers: itemData.serialNumbers || [],
          expirationDate: itemData.expirationDate,
          batchNumber: itemData.batchNumber,
          status: (itemData.status as any) || 'active',
          tags: itemData.tags || [],
          customFields: itemData.customFields,
          isActive: itemData.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy,
          updatedBy: undefined
        };

        const createdItem = await this.create(item);
        success.push(createdItem);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: itemData
        });
      }
    }

    console.log(`[SIMPLIFIED-INVENTORY-REPO] Imported ${success.length} items, ${errors.length} errors`);
    return { success, errors };
  }

  async exportItems(filters: InventoryFilters): Promise<InventoryItem[]> {
    return await this.findAll(filters);
  }
}