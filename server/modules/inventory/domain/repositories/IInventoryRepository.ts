/**
 * Inventory Repository Interface - Phase 11 Implementation
 * 
 * Interface do repositório para operações de persistência de Inventory
 * Define contratos para operações de dados sem dependências externas
 * 
 * @module IInventoryRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 11 Clean Architecture Implementation
 */

import { InventoryItem, InventoryItemEntity } from '../entities/InventoryItem';

export interface InventoryFilters {
  tenantId?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  supplier?: string;
  location?: string;
  status?: string;
  isActive?: boolean;
  isLowStock?: boolean;
  isOverStock?: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  search?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface InventoryStatistics {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  outOfStockItems: number;
  lowStockItems: number;
  overStockItems: number;
  expiredItems: number;
  expiringSoonItems: number;
  totalStockValue: number;
  itemsByCategory: Record<string, number>;
  itemsBySupplier: Record<string, number>;
  itemsByLocation: Record<string, number>;
  averageStockLevel: number;
  topValueItems: InventoryItem[];
}

export interface StockMovement {
  id: string;
  itemId: string;
  movementType: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  reference?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface IInventoryRepository {
  // ===== CRUD OPERATIONS =====
  
  /**
   * Create a new inventory item
   */
  create(item: InventoryItem): Promise<InventoryItem>;
  
  /**
   * Find inventory item by ID
   */
  findById(id: string, tenantId: string): Promise<InventoryItem | null>;
  
  /**
   * Find inventory item by SKU
   */
  findBySku(sku: string, tenantId: string): Promise<InventoryItem | null>;
  
  /**
   * Find all inventory items with optional filtering
   */
  findAll(filters: InventoryFilters): Promise<InventoryItem[]>;
  
  /**
   * Update inventory item by ID
   */
  update(id: string, tenantId: string, updateData: Partial<InventoryItem>): Promise<InventoryItem | null>;
  
  /**
   * Delete inventory item (soft delete)
   */
  delete(id: string, tenantId: string): Promise<boolean>;
  
  /**
   * Hard delete inventory item
   */
  hardDelete(id: string, tenantId: string): Promise<boolean>;
  
  // ===== QUERY OPERATIONS =====
  
  /**
   * Find items by category
   */
  findByCategory(category: string, tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Find items by supplier
   */
  findBySupplier(supplier: string, tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Find items by location
   */
  findByLocation(location: string, tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Find items by status
   */
  findByStatus(status: string, tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Search items by name, description, or SKU
   */
  search(query: string, tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Find low stock items
   */
  findLowStockItems(tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Find overstock items
   */
  findOverStockItems(tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Find expired items
   */
  findExpiredItems(tenantId: string): Promise<InventoryItem[]>;
  
  /**
   * Find items expiring soon
   */
  findExpiringSoonItems(tenantId: string, days?: number): Promise<InventoryItem[]>;
  
  /**
   * Find out of stock items
   */
  findOutOfStockItems(tenantId: string): Promise<InventoryItem[]>;
  
  // ===== ANALYTICS OPERATIONS =====
  
  /**
   * Get inventory statistics
   */
  getStatistics(tenantId: string): Promise<InventoryStatistics>;
  
  /**
   * Count items by filters
   */
  count(filters: InventoryFilters): Promise<number>;
  
  /**
   * Get total stock value
   */
  getTotalStockValue(tenantId: string): Promise<number>;
  
  /**
   * Get categories with item counts
   */
  getCategoriesWithCounts(tenantId: string): Promise<Array<{ category: string; itemCount: number; stockValue: number }>>;
  
  /**
   * Get suppliers with item counts
   */
  getSuppliersWithCounts(tenantId: string): Promise<Array<{ supplier: string; itemCount: number; stockValue: number }>>;
  
  /**
   * Get locations with item counts
   */
  getLocationsWithCounts(tenantId: string): Promise<Array<{ location: string; itemCount: number; stockValue: number }>>;
  
  /**
   * Get top value items
   */
  getTopValueItems(tenantId: string, limit?: number): Promise<InventoryItem[]>;
  
  // ===== VALIDATION OPERATIONS =====
  
  /**
   * Check if SKU exists
   */
  existsBySku(sku: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Validate stock levels
   */
  validateStockLevels(tenantId: string): Promise<{
    lowStockCount: number;
    overStockCount: number;
    outOfStockCount: number;
  }>;
  
  /**
   * Get available categories
   */
  getAvailableCategories(tenantId: string): Promise<string[]>;
  
  /**
   * Get available suppliers
   */
  getAvailableSuppliers(tenantId: string): Promise<string[]>;
  
  /**
   * Get available locations
   */
  getAvailableLocations(tenantId: string): Promise<string[]>;
  
  // ===== STOCK MOVEMENT OPERATIONS =====
  
  /**
   * Record stock movement
   */
  recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement>;
  
  /**
   * Get stock movements for an item
   */
  getStockMovements(itemId: string, tenantId: string, limit?: number): Promise<StockMovement[]>;
  
  /**
   * Adjust stock with movement tracking
   */
  adjustStock(itemId: string, tenantId: string, adjustment: number, reason: string, createdBy?: string): Promise<InventoryItem | null>;
  
  /**
   * Transfer stock between locations
   */
  transferStock(itemId: string, fromLocation: string, toLocation: string, quantity: number, tenantId: string, createdBy?: string): Promise<boolean>;
  
  // ===== BULK OPERATIONS =====
  
  /**
   * Create multiple inventory items
   */
  createBulk(items: InventoryItem[]): Promise<InventoryItem[]>;
  
  /**
   * Update multiple inventory items
   */
  updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<InventoryItem> }>): Promise<InventoryItem[]>;
  
  /**
   * Bulk stock adjustment
   */
  bulkStockAdjustment(adjustments: Array<{
    itemId: string;
    adjustment: number;
    reason: string;
  }>, tenantId: string, createdBy?: string): Promise<InventoryItem[]>;
  
  /**
   * Import items from CSV/Excel data
   */
  importItems(itemsData: Array<Partial<InventoryItem>>, tenantId: string, createdBy?: string): Promise<{
    success: InventoryItem[];
    errors: Array<{ row: number; error: string; data: Partial<InventoryItem> }>;
  }>;
  
  /**
   * Export items data
   */
  exportItems(filters: InventoryFilters): Promise<InventoryItem[]>;
}