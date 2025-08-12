/**
 * MaterialService Repository Interface - Phase 14 Implementation
 * 
 * Interface do repositório para operações de persistência de MaterialService
 * Define contratos para operações de dados sem dependências externas
 * 
 * @module IMaterialServiceRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 14 Clean Architecture Implementation
 */

import { MaterialService, MaterialServiceEntity } from '../entities/MaterialService';

export interface MaterialServiceFilters {
  tenantId?: string;
  type?: 'material' | 'service';
  category?: string;
  subcategory?: string;
  supplier?: string;
  supplierId?: string;
  brand?: string;
  location?: string;
  isActive?: boolean;
  isStockControlled?: boolean;
  stockStatus?: 'out_of_stock' | 'low_stock' | 'over_stock' | 'normal';
  expirationStatus?: 'expired' | 'expiring_soon' | 'normal';
  search?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface MaterialServiceStatistics {
  totalItems: number;
  totalMaterials: number;
  totalServices: number;
  activeItems: number;
  inactiveItems: number;
  stockControlledItems: number;
  outOfStockItems: number;
  lowStockItems: number;
  overStockItems: number;
  expiredItems: number;
  expiringSoonItems: number;
  totalStockValue: number;
  averageUnitPrice: number;
  categoriesCount: number;
  suppliersCount: number;
  brandsCount: number;
  locationsCount: number;
}

export interface StockMovement {
  id: string;
  materialServiceId: string;
  tenantId: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitPrice?: number;
  reason: string;
  reference?: string;
  notes?: string;
  movedAt: Date;
  movedBy?: string;
  createdAt: Date;
}

export interface PriceHistory {
  id: string;
  materialServiceId: string;
  tenantId: string;
  previousPrice: number;
  newPrice: number;
  currency: string;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

export interface IMaterialServiceRepository {
  // ===== CRUD OPERATIONS =====
  
  /**
   * Create a new material/service
   */
  create(materialService: MaterialService): Promise<MaterialService>;
  
  /**
   * Find material/service by ID
   */
  findById(id: string, tenantId: string): Promise<MaterialService | null>;
  
  /**
   * Find material/service by code
   */
  findByCode(code: string, tenantId: string): Promise<MaterialService | null>;
  
  /**
   * Find material/service by barcode
   */
  findByBarcode(barcode: string, tenantId: string): Promise<MaterialService | null>;
  
  /**
   * Find all materials/services with optional filtering
   */
  findAll(filters: MaterialServiceFilters): Promise<MaterialService[]>;
  
  /**
   * Update material/service by ID
   */
  update(id: string, tenantId: string, updateData: Partial<MaterialService>): Promise<MaterialService | null>;
  
  /**
   * Delete material/service (soft delete)
   */
  delete(id: string, tenantId: string): Promise<boolean>;
  
  /**
   * Hard delete material/service
   */
  hardDelete(id: string, tenantId: string): Promise<boolean>;
  
  // ===== SEARCH OPERATIONS =====
  
  /**
   * Search materials/services by name, code, description, brand, or model
   */
  search(query: string, tenantId: string, filters?: Partial<MaterialServiceFilters>): Promise<MaterialService[]>;
  
  /**
   * Find materials/services by type
   */
  findByType(type: 'material' | 'service', tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials/services by category
   */
  findByCategory(category: string, subcategory?: string, tenantId?: string): Promise<MaterialService[]>;
  
  /**
   * Find materials/services by supplier
   */
  findBySupplier(supplier: string, tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials/services by brand
   */
  findByBrand(brand: string, tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials/services by location
   */
  findByLocation(location: string, tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials/services with specific tags
   */
  findByTags(tags: string[], tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials/services in price range
   */
  findByPriceRange(minPrice: number, maxPrice: number, tenantId: string): Promise<MaterialService[]>;
  
  // ===== VALIDATION OPERATIONS =====
  
  /**
   * Check if code exists
   */
  existsByCode(code: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Check if barcode exists
   */
  existsByBarcode(barcode: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Validate material/service data
   */
  validateMaterialServiceData(materialService: Partial<MaterialService>): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  
  /**
   * Check duplicate potential
   */
  findPotentialDuplicates(materialService: MaterialService): Promise<MaterialService[]>;
  
  // ===== STOCK OPERATIONS =====
  
  /**
   * Update stock quantity
   */
  updateStock(id: string, tenantId: string, quantity: number, updatedBy?: string): Promise<MaterialService | null>;
  
  /**
   * Add stock movement
   */
  addStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement>;
  
  /**
   * Get stock movements for material
   */
  getStockMovements(materialServiceId: string, tenantId: string, limit?: number): Promise<StockMovement[]>;
  
  /**
   * Find materials with low stock
   */
  findLowStockMaterials(tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials out of stock
   */
  findOutOfStockMaterials(tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials over stock
   */
  findOverStockMaterials(tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials with stock status
   */
  findByStockStatus(status: 'out_of_stock' | 'low_stock' | 'over_stock' | 'normal', tenantId: string): Promise<MaterialService[]>;
  
  // ===== EXPIRATION OPERATIONS =====
  
  /**
   * Find expired materials
   */
  findExpiredMaterials(tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Find materials expiring soon
   */
  findMaterialsExpiringSoon(tenantId: string, days?: number): Promise<MaterialService[]>;
  
  /**
   * Find materials by expiration status
   */
  findByExpirationStatus(status: 'expired' | 'expiring_soon' | 'normal', tenantId: string): Promise<MaterialService[]>;
  
  /**
   * Update expiration date
   */
  updateExpirationDate(id: string, tenantId: string, expirationDate: Date | null, updatedBy?: string): Promise<MaterialService | null>;
  
  // ===== PRICING OPERATIONS =====
  
  /**
   * Update unit price
   */
  updatePrice(id: string, tenantId: string, newPrice: number, updatedBy?: string, reason?: string): Promise<MaterialService | null>;
  
  /**
   * Get price history
   */
  getPriceHistory(materialServiceId: string, tenantId: string, limit?: number): Promise<PriceHistory[]>;
  
  /**
   * Add price history entry
   */
  addPriceHistory(priceHistory: Omit<PriceHistory, 'id'>): Promise<PriceHistory>;
  
  /**
   * Update last purchase price
   */
  updateLastPurchasePrice(id: string, tenantId: string, price: number, purchaseDate: Date, updatedBy?: string): Promise<MaterialService | null>;
  
  /**
   * Calculate average cost
   */
  calculateAverageCost(id: string, tenantId: string): Promise<number>;
  
  // ===== ANALYTICS OPERATIONS =====
  
  /**
   * Get material/service statistics
   */
  getStatistics(tenantId: string): Promise<MaterialServiceStatistics>;
  
  /**
   * Count materials/services by filters
   */
  count(filters: MaterialServiceFilters): Promise<number>;
  
  /**
   * Get category distribution
   */
  getCategoryDistribution(tenantId: string): Promise<Array<{
    category: string;
    subcategory?: string;
    count: number;
    percentage: number;
  }>>;
  
  /**
   * Get supplier distribution
   */
  getSupplierDistribution(tenantId: string): Promise<Array<{
    supplier: string;
    count: number;
    totalValue: number;
    percentage: number;
  }>>;
  
  /**
   * Get brand distribution
   */
  getBrandDistribution(tenantId: string): Promise<Array<{
    brand: string;
    count: number;
    percentage: number;
  }>>;
  
  /**
   * Get location distribution
   */
  getLocationDistribution(tenantId: string): Promise<Array<{
    location: string;
    count: number;
    totalValue: number;
  }>>;
  
  /**
   * Get stock value by category
   */
  getStockValueByCategory(tenantId: string): Promise<Array<{
    category: string;
    totalValue: number;
    itemCount: number;
  }>>;
  
  /**
   * Get top materials by value
   */
  getTopMaterialsByValue(tenantId: string, limit?: number): Promise<MaterialService[]>;
  
  /**
   * Get popular tags
   */
  getPopularTags(tenantId: string, limit?: number): Promise<Array<{
    tag: string;
    count: number;
    percentage: number;
  }>>;
  
  // ===== BULK OPERATIONS =====
  
  /**
   * Create multiple materials/services
   */
  createBulk(materialsServices: MaterialService[]): Promise<MaterialService[]>;
  
  /**
   * Update multiple materials/services
   */
  updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<MaterialService> }>): Promise<MaterialService[]>;
  
  /**
   * Import materials/services from data
   */
  importMaterialsServices(data: Array<Partial<MaterialService>>, tenantId: string, createdBy?: string): Promise<{
    success: MaterialService[];
    errors: Array<{ row: number; error: string; data: Partial<MaterialService> }>;
  }>;
  
  /**
   * Export materials/services data
   */
  exportMaterialsServices(filters: MaterialServiceFilters): Promise<MaterialService[]>;
  
  /**
   * Bulk stock update
   */
  bulkStockUpdate(updates: Array<{ id: string; tenantId: string; quantity: number; reason: string }>, updatedBy?: string): Promise<StockMovement[]>;
  
  /**
   * Bulk price update
   */
  bulkPriceUpdate(updates: Array<{ id: string; tenantId: string; price: number; reason?: string }>, updatedBy?: string): Promise<MaterialService[]>;
  
  // ===== TAG OPERATIONS =====
  
  /**
   * Add tag to material/service
   */
  addTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean>;
  
  /**
   * Remove tag from material/service
   */
  removeTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean>;
  
  /**
   * Update material/service tags
   */
  updateTags(id: string, tenantId: string, tags: string[], updatedBy?: string): Promise<MaterialService | null>;
  
  /**
   * Find all unique tags
   */
  getAllTags(tenantId: string): Promise<string[]>;
  
  /**
   * Rename tag across all materials/services
   */
  renameTag(oldTag: string, newTag: string, tenantId: string, updatedBy?: string): Promise<number>;
  
  /**
   * Delete tag from all materials/services
   */
  deleteTag(tag: string, tenantId: string, updatedBy?: string): Promise<number>;
  
  // ===== REFERENCE OPERATIONS =====
  
  /**
   * Find all unique categories
   */
  getAllCategories(tenantId: string): Promise<Array<{ category: string; subcategories: string[] }>>;
  
  /**
   * Find all unique suppliers
   */
  getAllSuppliers(tenantId: string): Promise<string[]>;
  
  /**
   * Find all unique brands
   */
  getAllBrands(tenantId: string): Promise<string[]>;
  
  /**
   * Find all unique locations
   */
  getAllLocations(tenantId: string): Promise<string[]>;
  
  /**
   * Find all unique units
   */
  getAllUnits(tenantId: string): Promise<string[]>;
  
  // ===== ACTIVITY OPERATIONS =====
  
  /**
   * Get material/service activity history
   */
  getMaterialServiceActivity(id: string, tenantId: string, limit?: number): Promise<Array<{
    action: string;
    timestamp: Date;
    userId?: string;
    details?: Record<string, any>;
  }>>;
  
  /**
   * Log material/service activity
   */
  logActivity(materialServiceId: string, tenantId: string, action: string, userId?: string, details?: Record<string, any>): Promise<void>;
  
  /**
   * Get recently created materials/services
   */
  getRecentlyCreated(tenantId: string, days?: number, limit?: number): Promise<MaterialService[]>;
  
  /**
   * Get recently updated materials/services
   */
  getRecentlyUpdated(tenantId: string, days?: number, limit?: number): Promise<MaterialService[]>;
  
  /**
   * Get most used materials/services
   */
  getMostUsed(tenantId: string, limit?: number): Promise<Array<{
    materialService: MaterialService;
    usageCount: number;
  }>>;
}