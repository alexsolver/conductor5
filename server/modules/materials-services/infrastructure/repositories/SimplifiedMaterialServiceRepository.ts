/**
 * Simplified MaterialService Repository - Phase 14 Implementation
 * 
 * Implementação simplificada do repositório de materiais e serviços
 * Para uso imediato enquanto integração com banco não está disponível
 * 
 * @module SimplifiedMaterialServiceRepository
 * @version 1.0.0
 * @created 2025-08-12 - Phase 14 Clean Architecture Implementation
 */

import { MaterialService } from '../../domain/entities/MaterialService';
import { 
  IMaterialServiceRepository, 
  MaterialServiceFilters, 
  MaterialServiceStatistics,
  StockMovement,
  PriceHistory
} from '../../domain/repositories/IMaterialServiceRepository';

export class SimplifiedMaterialServiceRepository implements IMaterialServiceRepository {
  private materialsServices: MaterialService[] = [];
  private stockMovements: StockMovement[] = [];
  private priceHistory: PriceHistory[] = [];

  async create(materialService: MaterialService): Promise<MaterialService> {
    this.materialsServices.push(materialService);
    console.log(`[SIMPLIFIED-MS-REPO] Created ${materialService.type}: ${materialService.id} (${materialService.code} - ${materialService.name}) for tenant: ${materialService.tenantId}`);
    return materialService;
  }

  async findById(id: string, tenantId: string): Promise<MaterialService | null> {
    const item = this.materialsServices.find(ms => ms.id === id && ms.tenantId === tenantId);
    return item || null;
  }

  async findByCode(code: string, tenantId: string): Promise<MaterialService | null> {
    const item = this.materialsServices.find(ms => 
      ms.code.toLowerCase() === code.toLowerCase() && 
      ms.tenantId === tenantId
    );
    return item || null;
  }

  async findByBarcode(barcode: string, tenantId: string): Promise<MaterialService | null> {
    const item = this.materialsServices.find(ms => 
      ms.barcode?.toLowerCase() === barcode.toLowerCase() && 
      ms.tenantId === tenantId
    );
    return item || null;
  }

  async findAll(filters: MaterialServiceFilters): Promise<MaterialService[]> {
    let filteredItems = this.materialsServices.filter(item => {
      if (filters.tenantId && item.tenantId !== filters.tenantId) return false;
      if (filters.type && item.type !== filters.type) return false;
      if (filters.category && item.category.toLowerCase() !== filters.category.toLowerCase()) return false;
      if (filters.subcategory && item.subcategory?.toLowerCase() !== filters.subcategory.toLowerCase()) return false;
      if (filters.supplier && item.supplier?.toLowerCase() !== filters.supplier.toLowerCase()) return false;
      if (filters.supplierId && item.supplierId !== filters.supplierId) return false;
      if (filters.brand && item.brand?.toLowerCase() !== filters.brand.toLowerCase()) return false;
      if (filters.location && item.location?.toLowerCase() !== filters.location.toLowerCase()) return false;
      if (filters.isActive !== undefined && item.isActive !== filters.isActive) return false;
      if (filters.isStockControlled !== undefined && item.isStockControlled !== filters.isStockControlled) return false;
      
      if (filters.stockStatus) {
        const stockStatus = this.getItemStockStatus(item);
        if (stockStatus !== filters.stockStatus) return false;
      }
      
      if (filters.expirationStatus) {
        const expirationStatus = this.getItemExpirationStatus(item);
        if (expirationStatus !== filters.expirationStatus) return false;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(tag => item.tags?.includes(tag));
        if (!hasAllTags) return false;
      }
      
      if (filters.priceMin !== undefined && item.unitPrice < filters.priceMin) return false;
      if (filters.priceMax !== undefined && item.unitPrice > filters.priceMax) return false;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(searchLower);
        const matchesName = item.name.toLowerCase().includes(searchLower);
        const matchesDescription = item.description?.toLowerCase().includes(searchLower);
        const matchesBrand = item.brand?.toLowerCase().includes(searchLower);
        const matchesModel = item.model?.toLowerCase().includes(searchLower);
        const matchesSupplier = item.supplier?.toLowerCase().includes(searchLower);
        const matchesBarcode = item.barcode?.includes(searchLower);
        
        if (!matchesCode && !matchesName && !matchesDescription && !matchesBrand && !matchesModel && !matchesSupplier && !matchesBarcode) {
          return false;
        }
      }
      
      if (filters.createdAfter && item.createdAt < filters.createdAfter) return false;
      if (filters.createdBefore && item.createdAt > filters.createdBefore) return false;
      
      return true;
    });

    return filteredItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(id: string, tenantId: string, updateData: Partial<MaterialService>): Promise<MaterialService | null> {
    const index = this.materialsServices.findIndex(ms => ms.id === id && ms.tenantId === tenantId);
    if (index === -1) return null;

    this.materialsServices[index] = { ...this.materialsServices[index], ...updateData, updatedAt: new Date() };
    console.log(`[SIMPLIFIED-MS-REPO] Updated ${this.materialsServices[index].type}: ${id} for tenant: ${tenantId}`);
    return this.materialsServices[index];
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const index = this.materialsServices.findIndex(ms => ms.id === id && ms.tenantId === tenantId);
    if (index === -1) return false;

    this.materialsServices[index].isActive = false;
    this.materialsServices[index].updatedAt = new Date();
    console.log(`[SIMPLIFIED-MS-REPO] Soft deleted ${this.materialsServices[index].type}: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async hardDelete(id: string, tenantId: string): Promise<boolean> {
    const index = this.materialsServices.findIndex(ms => ms.id === id && ms.tenantId === tenantId);
    if (index === -1) return false;

    this.materialsServices.splice(index, 1);
    console.log(`[SIMPLIFIED-MS-REPO] Hard deleted item: ${id} for tenant: ${tenantId}`);
    return true;
  }

  async search(query: string, tenantId: string, filters?: Partial<MaterialServiceFilters>): Promise<MaterialService[]> {
    const searchFilters: MaterialServiceFilters = {
      tenantId,
      search: query,
      ...filters
    };
    
    return await this.findAll(searchFilters);
  }

  async findByType(type: 'material' | 'service', tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => ms.type === type && ms.tenantId === tenantId);
  }

  async findByCategory(category: string, subcategory?: string, tenantId?: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => {
      if (tenantId && ms.tenantId !== tenantId) return false;
      if (ms.category.toLowerCase() !== category.toLowerCase()) return false;
      if (subcategory && ms.subcategory?.toLowerCase() !== subcategory.toLowerCase()) return false;
      return true;
    });
  }

  async findBySupplier(supplier: string, tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.supplier?.toLowerCase() === supplier.toLowerCase() && 
      ms.tenantId === tenantId
    );
  }

  async findByBrand(brand: string, tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.brand?.toLowerCase() === brand.toLowerCase() && 
      ms.tenantId === tenantId
    );
  }

  async findByLocation(location: string, tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.location?.toLowerCase() === location.toLowerCase() && 
      ms.tenantId === tenantId
    );
  }

  async findByTags(tags: string[], tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.tenantId === tenantId && 
      tags.every(tag => ms.tags?.includes(tag))
    );
  }

  async findByPriceRange(minPrice: number, maxPrice: number, tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.tenantId === tenantId && 
      ms.unitPrice >= minPrice && 
      ms.unitPrice <= maxPrice
    );
  }

  async existsByCode(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    return this.materialsServices.some(item => 
      item.code.toLowerCase() === code.toLowerCase() && 
      item.tenantId === tenantId && 
      (!excludeId || item.id !== excludeId)
    );
  }

  async existsByBarcode(barcode: string, tenantId: string, excludeId?: string): Promise<boolean> {
    return this.materialsServices.some(item => 
      item.barcode?.toLowerCase() === barcode.toLowerCase() && 
      item.tenantId === tenantId && 
      (!excludeId || item.id !== excludeId)
    );
  }

  async validateMaterialServiceData(materialService: Partial<MaterialService>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!materialService.name) errors.push('Nome é obrigatório');
    if (!materialService.code) errors.push('Código é obrigatório');
    if (!materialService.type) errors.push('Tipo é obrigatório');
    if (!materialService.category) errors.push('Categoria é obrigatória');
    if (!materialService.unit) errors.push('Unidade é obrigatória');
    if (!materialService.tenantId) errors.push('Tenant ID é obrigatório');
    
    if (materialService.unitPrice !== undefined && materialService.unitPrice < 0) {
      errors.push('Preço unitário não pode ser negativo');
    }
    
    if (materialService.type === 'service') {
      if (materialService.stockQuantity !== undefined || 
          materialService.minimumStock !== undefined || 
          materialService.maximumStock !== undefined) {
        errors.push('Serviços não devem ter controle de estoque');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async findPotentialDuplicates(materialService: MaterialService): Promise<MaterialService[]> {
    const duplicates: MaterialService[] = [];
    
    // Check by code
    const byCode = await this.findByCode(materialService.code, materialService.tenantId);
    if (byCode && byCode.id !== materialService.id) {
      duplicates.push(byCode);
    }
    
    // Check by barcode
    if (materialService.barcode) {
      const byBarcode = await this.findByBarcode(materialService.barcode, materialService.tenantId);
      if (byBarcode && byBarcode.id !== materialService.id) {
        duplicates.push(byBarcode);
      }
    }
    
    // Check by name similarity (basic)
    const similarByName = this.materialsServices.filter(ms => 
      ms.tenantId === materialService.tenantId &&
      ms.id !== materialService.id &&
      ms.name.toLowerCase() === materialService.name.toLowerCase()
    );
    duplicates.push(...similarByName);
    
    return Array.from(new Set(duplicates));
  }

  // ===== STOCK OPERATIONS =====

  async updateStock(id: string, tenantId: string, quantity: number, updatedBy?: string): Promise<MaterialService | null> {
    const materialService = await this.findById(id, tenantId);
    if (!materialService || materialService.type === 'service') return null;

    return await this.update(id, tenantId, { 
      stockQuantity: quantity, 
      updatedBy, 
      updatedAt: new Date() 
    });
  }

  async addStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    const stockMovement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      ...movement
    };
    
    this.stockMovements.push(stockMovement);
    console.log(`[SIMPLIFIED-MS-REPO] Added stock movement: ${stockMovement.movementType} ${stockMovement.quantity} for ${movement.materialServiceId}`);
    return stockMovement;
  }

  async getStockMovements(materialServiceId: string, tenantId: string, limit = 50): Promise<StockMovement[]> {
    return this.stockMovements
      .filter(sm => sm.materialServiceId === materialServiceId && sm.tenantId === tenantId)
      .sort((a, b) => b.movedAt.getTime() - a.movedAt.getTime())
      .slice(0, limit);
  }

  async findLowStockMaterials(tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.tenantId === tenantId && 
      ms.type === 'material' && 
      ms.isStockControlled && 
      ms.stockQuantity !== null && 
      ms.minimumStock !== null && 
      ms.stockQuantity <= ms.minimumStock
    );
  }

  async findOutOfStockMaterials(tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.tenantId === tenantId && 
      ms.type === 'material' && 
      ms.isStockControlled && 
      ms.stockQuantity !== null && 
      ms.stockQuantity <= 0
    );
  }

  async findOverStockMaterials(tenantId: string): Promise<MaterialService[]> {
    return this.materialsServices.filter(ms => 
      ms.tenantId === tenantId && 
      ms.type === 'material' && 
      ms.isStockControlled && 
      ms.stockQuantity !== null && 
      ms.maximumStock !== null && 
      ms.stockQuantity >= ms.maximumStock
    );
  }

  async findByStockStatus(status: 'out_of_stock' | 'low_stock' | 'over_stock' | 'normal', tenantId: string): Promise<MaterialService[]> {
    switch (status) {
      case 'out_of_stock':
        return await this.findOutOfStockMaterials(tenantId);
      case 'low_stock':
        return await this.findLowStockMaterials(tenantId);
      case 'over_stock':
        return await this.findOverStockMaterials(tenantId);
      case 'normal':
        return this.materialsServices.filter(ms => {
          if (ms.tenantId !== tenantId || ms.type === 'service' || !ms.isStockControlled) return false;
          const stockStatus = this.getItemStockStatus(ms);
          return stockStatus === 'normal';
        });
      default:
        return [];
    }
  }

  // ===== EXPIRATION OPERATIONS =====

  async findExpiredMaterials(tenantId: string): Promise<MaterialService[]> {
    const now = new Date();
    return this.materialsServices.filter(ms => 
      ms.tenantId === tenantId && 
      ms.type === 'material' && 
      ms.expirationDate && 
      ms.expirationDate <= now
    );
  }

  async findMaterialsExpiringSoon(tenantId: string, days = 30): Promise<MaterialService[]> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    
    return this.materialsServices.filter(ms => 
      ms.tenantId === tenantId && 
      ms.type === 'material' && 
      ms.expirationDate && 
      ms.expirationDate <= warningDate && 
      ms.expirationDate > new Date()
    );
  }

  async findByExpirationStatus(status: 'expired' | 'expiring_soon' | 'normal', tenantId: string): Promise<MaterialService[]> {
    switch (status) {
      case 'expired':
        return await this.findExpiredMaterials(tenantId);
      case 'expiring_soon':
        return await this.findMaterialsExpiringSoon(tenantId);
      case 'normal':
        return this.materialsServices.filter(ms => {
          if (ms.tenantId !== tenantId || ms.type === 'service') return false;
          const expirationStatus = this.getItemExpirationStatus(ms);
          return expirationStatus === 'normal';
        });
      default:
        return [];
    }
  }

  async updateExpirationDate(id: string, tenantId: string, expirationDate: Date | null, updatedBy?: string): Promise<MaterialService | null> {
    return await this.update(id, tenantId, { 
      expirationDate, 
      updatedBy, 
      updatedAt: new Date() 
    });
  }

  // ===== PRICING OPERATIONS =====

  async updatePrice(id: string, tenantId: string, newPrice: number, updatedBy?: string, reason?: string): Promise<MaterialService | null> {
    const materialService = await this.findById(id, tenantId);
    if (!materialService) return null;

    // Add to price history
    await this.addPriceHistory({
      materialServiceId: id,
      tenantId,
      previousPrice: materialService.unitPrice,
      newPrice,
      currency: materialService.currency,
      changedAt: new Date(),
      changedBy: updatedBy,
      reason
    });

    return await this.update(id, tenantId, { 
      unitPrice: newPrice, 
      updatedBy, 
      updatedAt: new Date() 
    });
  }

  async getPriceHistory(materialServiceId: string, tenantId: string, limit = 50): Promise<PriceHistory[]> {
    return this.priceHistory
      .filter(ph => ph.materialServiceId === materialServiceId && ph.tenantId === tenantId)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
      .slice(0, limit);
  }

  async addPriceHistory(priceHistory: Omit<PriceHistory, 'id'>): Promise<PriceHistory> {
    const priceHistoryEntry: PriceHistory = {
      id: `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...priceHistory
    };
    
    this.priceHistory.push(priceHistoryEntry);
    return priceHistoryEntry;
  }

  async updateLastPurchasePrice(id: string, tenantId: string, price: number, purchaseDate: Date, updatedBy?: string): Promise<MaterialService | null> {
    return await this.update(id, tenantId, { 
      lastPurchasePrice: price, 
      lastPurchaseDate: purchaseDate, 
      updatedBy, 
      updatedAt: new Date() 
    });
  }

  async calculateAverageCost(id: string, tenantId: string): Promise<number> {
    const movements = await this.getStockMovements(id, tenantId);
    const inMovements = movements.filter(m => m.movementType === 'in' && m.unitPrice);
    
    if (inMovements.length === 0) return 0;
    
    const totalCost = inMovements.reduce((sum, m) => sum + (m.unitPrice! * m.quantity), 0);
    const totalQuantity = inMovements.reduce((sum, m) => sum + m.quantity, 0);
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  // ===== ANALYTICS OPERATIONS =====

  async getStatistics(tenantId: string): Promise<MaterialServiceStatistics> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId);
    
    const totalItems = tenantItems.length;
    const totalMaterials = tenantItems.filter(ms => ms.type === 'material').length;
    const totalServices = tenantItems.filter(ms => ms.type === 'service').length;
    const activeItems = tenantItems.filter(ms => ms.isActive).length;
    const inactiveItems = tenantItems.filter(ms => !ms.isActive).length;
    const stockControlledItems = tenantItems.filter(ms => ms.isStockControlled).length;
    
    const outOfStockItems = tenantItems.filter(ms => this.getItemStockStatus(ms) === 'out_of_stock').length;
    const lowStockItems = tenantItems.filter(ms => this.getItemStockStatus(ms) === 'low_stock').length;
    const overStockItems = tenantItems.filter(ms => this.getItemStockStatus(ms) === 'over_stock').length;
    
    const expiredItems = tenantItems.filter(ms => this.getItemExpirationStatus(ms) === 'expired').length;
    const expiringSoonItems = tenantItems.filter(ms => this.getItemExpirationStatus(ms) === 'expiring_soon').length;
    
    const totalStockValue = tenantItems.reduce((sum, ms) => {
      if (ms.type === 'service' || !ms.stockQuantity) return sum;
      return sum + (ms.stockQuantity * ms.unitPrice);
    }, 0);
    
    const averageUnitPrice = totalItems > 0 
      ? tenantItems.reduce((sum, ms) => sum + ms.unitPrice, 0) / totalItems 
      : 0;
    
    const categories = new Set(tenantItems.map(ms => ms.category));
    const suppliers = new Set(tenantItems.map(ms => ms.supplier).filter(Boolean));
    const brands = new Set(tenantItems.map(ms => ms.brand).filter(Boolean));
    const locations = new Set(tenantItems.map(ms => ms.location).filter(Boolean));
    
    return {
      totalItems,
      totalMaterials,
      totalServices,
      activeItems,
      inactiveItems,
      stockControlledItems,
      outOfStockItems,
      lowStockItems,
      overStockItems,
      expiredItems,
      expiringSoonItems,
      totalStockValue,
      averageUnitPrice,
      categoriesCount: categories.size,
      suppliersCount: suppliers.size,
      brandsCount: brands.size,
      locationsCount: locations.size
    };
  }

  async count(filters: MaterialServiceFilters): Promise<number> {
    const items = await this.findAll(filters);
    return items.length;
  }

  async getCategoryDistribution(tenantId: string): Promise<Array<{ category: string; subcategory?: string; count: number; percentage: number }>> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId);
    const total = tenantItems.length;
    
    if (total === 0) return [];
    
    const categoryMap = new Map<string, number>();
    
    tenantItems.forEach(item => {
      const key = item.subcategory ? `${item.category}|${item.subcategory}` : item.category;
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([key, count]) => {
      const [category, subcategory] = key.split('|');
      return {
        category,
        subcategory,
        count,
        percentage: Math.round((count / total) * 100 * 100) / 100
      };
    }).sort((a, b) => b.count - a.count);
  }

  async getSupplierDistribution(tenantId: string): Promise<Array<{ supplier: string; count: number; totalValue: number; percentage: number }>> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.supplier);
    const total = tenantItems.length;
    
    if (total === 0) return [];
    
    const supplierMap = new Map<string, { count: number; totalValue: number }>();
    
    tenantItems.forEach(item => {
      const existing = supplierMap.get(item.supplier!) || { count: 0, totalValue: 0 };
      const itemValue = (item.stockQuantity || 0) * item.unitPrice;
      supplierMap.set(item.supplier!, {
        count: existing.count + 1,
        totalValue: existing.totalValue + itemValue
      });
    });
    
    return Array.from(supplierMap.entries()).map(([supplier, data]) => ({
      supplier,
      count: data.count,
      totalValue: data.totalValue,
      percentage: Math.round((data.count / total) * 100 * 100) / 100
    })).sort((a, b) => b.count - a.count);
  }

  async getBrandDistribution(tenantId: string): Promise<Array<{ brand: string; count: number; percentage: number }>> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.brand);
    const total = tenantItems.length;
    
    if (total === 0) return [];
    
    const brandMap = new Map<string, number>();
    tenantItems.forEach(item => {
      brandMap.set(item.brand!, (brandMap.get(item.brand!) || 0) + 1);
    });
    
    return Array.from(brandMap.entries()).map(([brand, count]) => ({
      brand,
      count,
      percentage: Math.round((count / total) * 100 * 100) / 100
    })).sort((a, b) => b.count - a.count);
  }

  async getLocationDistribution(tenantId: string): Promise<Array<{ location: string; count: number; totalValue: number }>> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.location);
    
    const locationMap = new Map<string, { count: number; totalValue: number }>();
    
    tenantItems.forEach(item => {
      const existing = locationMap.get(item.location!) || { count: 0, totalValue: 0 };
      const itemValue = (item.stockQuantity || 0) * item.unitPrice;
      locationMap.set(item.location!, {
        count: existing.count + 1,
        totalValue: existing.totalValue + itemValue
      });
    });
    
    return Array.from(locationMap.values());
  }

  async getStockValueByCategory(tenantId: string): Promise<Array<{ category: string; totalValue: number; itemCount: number }>> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.type === 'material');
    
    const categoryMap = new Map<string, { totalValue: number; itemCount: number }>();
    
    tenantItems.forEach(item => {
      const existing = categoryMap.get(item.category) || { totalValue: 0, itemCount: 0 };
      const itemValue = (item.stockQuantity || 0) * item.unitPrice;
      categoryMap.set(item.category, {
        totalValue: existing.totalValue + itemValue,
        itemCount: existing.itemCount + 1
      });
    });
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalValue: data.totalValue,
      itemCount: data.itemCount
    })).sort((a, b) => b.totalValue - a.totalValue);
  }

  async getTopMaterialsByValue(tenantId: string, limit = 10): Promise<MaterialService[]> {
    return this.materialsServices
      .filter(ms => ms.tenantId === tenantId && ms.type === 'material' && ms.stockQuantity)
      .sort((a, b) => {
        const valueA = (a.stockQuantity || 0) * a.unitPrice;
        const valueB = (b.stockQuantity || 0) * b.unitPrice;
        return valueB - valueA;
      })
      .slice(0, limit);
  }

  async getPopularTags(tenantId: string, limit = 10): Promise<Array<{ tag: string; count: number; percentage: number }>> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId);
    const allTags = tenantItems.flatMap(ms => ms.tags || []);
    const total = allTags.length;
    
    if (total === 0) return [];
    
    const tagCounts = new Map<string, number>();
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / total) * 100 * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ===== HELPER METHODS =====

  private getItemStockStatus(item: MaterialService): 'out_of_stock' | 'low_stock' | 'over_stock' | 'normal' | 'not_controlled' {
    if (item.type === 'service' || !item.isStockControlled) {
      return 'not_controlled';
    }
    
    if (item.stockQuantity === null) return 'not_controlled';
    
    if (item.stockQuantity <= 0) return 'out_of_stock';
    
    if (item.minimumStock !== null && item.stockQuantity <= item.minimumStock) {
      return 'low_stock';
    }
    
    if (item.maximumStock !== null && item.stockQuantity >= item.maximumStock) {
      return 'over_stock';
    }
    
    return 'normal';
  }

  private getItemExpirationStatus(item: MaterialService): 'expired' | 'expiring_soon' | 'normal' | 'not_applicable' {
    if (item.type === 'service' || !item.expirationDate) {
      return 'not_applicable';
    }
    
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 30);
    
    if (item.expirationDate <= now) return 'expired';
    if (item.expirationDate <= warningDate) return 'expiring_soon';
    
    return 'normal';
  }

  // ===== SIMPLIFIED IMPLEMENTATIONS FOR REMAINING METHODS =====

  async createBulk(materialsServices: MaterialService[]): Promise<MaterialService[]> {
    const created: MaterialService[] = [];
    for (const item of materialsServices) {
      created.push(await this.create(item));
    }
    console.log(`[SIMPLIFIED-MS-REPO] Created ${created.length} items in bulk`);
    return created;
  }

  async updateBulk(updates: Array<{ id: string; tenantId: string; data: Partial<MaterialService> }>): Promise<MaterialService[]> {
    const updated: MaterialService[] = [];
    
    for (const update of updates) {
      const updatedItem = await this.update(update.id, update.tenantId, update.data);
      if (updatedItem) {
        updated.push(updatedItem);
      }
    }

    console.log(`[SIMPLIFIED-MS-REPO] Updated ${updated.length} items in bulk`);
    return updated;
  }

  async importMaterialsServices(data: Array<Partial<MaterialService>>, tenantId: string, createdBy?: string): Promise<{
    success: MaterialService[];
    errors: Array<{ row: number; error: string; data: Partial<MaterialService> }>;
  }> {
    const success: MaterialService[] = [];
    const errors: Array<{ row: number; error: string; data: Partial<MaterialService> }> = [];

    for (let i = 0; i < data.length; i++) {
      const itemData = data[i];
      
      try {
        const validation = await this.validateMaterialServiceData({ ...itemData, tenantId });
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Check for duplicates
        if (itemData.code && await this.existsByCode(itemData.code, tenantId)) {
          throw new Error(`Código '${itemData.code}' já está em uso`);
        }

        if (itemData.barcode && await this.existsByBarcode(itemData.barcode, tenantId)) {
          throw new Error(`Código de barras '${itemData.barcode}' já está em uso`);
        }

        const materialService: MaterialService = {
          id: `ms_import_${Date.now()}_${i}`,
          tenantId,
          type: itemData.type!,
          category: itemData.category!,
          subcategory: itemData.subcategory,
          code: itemData.code!,
          name: itemData.name!,
          description: itemData.description,
          unit: itemData.unit!,
          unitPrice: itemData.unitPrice!,
          currency: itemData.currency || 'BRL',
          supplier: itemData.supplier,
          supplierId: itemData.supplierId,
          brand: itemData.brand,
          model: itemData.model,
          specifications: itemData.specifications,
          stockQuantity: itemData.stockQuantity,
          minimumStock: itemData.minimumStock,
          maximumStock: itemData.maximumStock,
          averageCost: itemData.averageCost,
          lastPurchasePrice: itemData.lastPurchasePrice,
          lastPurchaseDate: itemData.lastPurchaseDate,
          location: itemData.location,
          barcode: itemData.barcode,
          serialNumbers: itemData.serialNumbers || [],
          expirationDate: itemData.expirationDate,
          notes: itemData.notes,
          tags: itemData.tags || [],
          isActive: itemData.isActive !== false,
          isStockControlled: itemData.isStockControlled !== false,
          isService: itemData.type === 'service',
          metadata: itemData.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy,
          updatedBy: undefined
        };

        const createdItem = await this.create(materialService);
        success.push(createdItem);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: itemData
        });
      }
    }

    console.log(`[SIMPLIFIED-MS-REPO] Imported ${success.length} items, ${errors.length} errors`);
    return { success, errors };
  }

  async exportMaterialsServices(filters: MaterialServiceFilters): Promise<MaterialService[]> {
    return await this.findAll(filters);
  }

  async bulkStockUpdate(updates: Array<{ id: string; tenantId: string; quantity: number; reason: string }>, updatedBy?: string): Promise<StockMovement[]> {
    const movements: StockMovement[] = [];
    
    for (const update of updates) {
      const updated = await this.updateStock(update.id, update.tenantId, update.quantity, updatedBy);
      if (updated) {
        const movement = await this.addStockMovement({
          materialServiceId: update.id,
          tenantId: update.tenantId,
          movementType: 'adjustment',
          quantity: update.quantity,
          reason: update.reason,
          movedAt: new Date(),
          movedBy: updatedBy
        });
        movements.push(movement);
      }
    }
    
    return movements;
  }

  async bulkPriceUpdate(updates: Array<{ id: string; tenantId: string; price: number; reason?: string }>, updatedBy?: string): Promise<MaterialService[]> {
    const updated: MaterialService[] = [];
    
    for (const update of updates) {
      const updatedItem = await this.updatePrice(update.id, update.tenantId, update.price, updatedBy, update.reason);
      if (updatedItem) {
        updated.push(updatedItem);
      }
    }
    
    return updated;
  }

  // ===== TAG OPERATIONS =====

  async addTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean> {
    const item = await this.findById(id, tenantId);
    if (!item) return false;

    const tags = item.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
      await this.update(id, tenantId, { tags, updatedBy, updatedAt: new Date() });
    }
    
    return true;
  }

  async removeTag(id: string, tenantId: string, tag: string, updatedBy?: string): Promise<boolean> {
    const item = await this.findById(id, tenantId);
    if (!item) return false;

    const tags = (item.tags || []).filter(t => t !== tag);
    await this.update(id, tenantId, { tags, updatedBy, updatedAt: new Date() });
    
    return true;
  }

  async updateTags(id: string, tenantId: string, tags: string[], updatedBy?: string): Promise<MaterialService | null> {
    return await this.update(id, tenantId, { tags, updatedBy, updatedAt: new Date() });
  }

  async getAllTags(tenantId: string): Promise<string[]> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId);
    const allTags = tenantItems.flatMap(ms => ms.tags || []);
    return Array.from(new Set(allTags)).sort();
  }

  async renameTag(oldTag: string, newTag: string, tenantId: string, updatedBy?: string): Promise<number> {
    let count = 0;
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.tags?.includes(oldTag));
    
    for (const item of tenantItems) {
      const tags = (item.tags || []).map(t => t === oldTag ? newTag : t);
      await this.update(item.id, tenantId, { tags, updatedBy, updatedAt: new Date() });
      count++;
    }
    
    console.log(`[SIMPLIFIED-MS-REPO] Renamed tag '${oldTag}' to '${newTag}' for ${count} items`);
    return count;
  }

  async deleteTag(tag: string, tenantId: string, updatedBy?: string): Promise<number> {
    let count = 0;
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.tags?.includes(tag));
    
    for (const item of tenantItems) {
      const tags = (item.tags || []).filter(t => t !== tag);
      await this.update(item.id, tenantId, { tags, updatedBy, updatedAt: new Date() });
      count++;
    }
    
    console.log(`[SIMPLIFIED-MS-REPO] Deleted tag '${tag}' from ${count} items`);
    return count;
  }

  // ===== REFERENCE OPERATIONS =====

  async getAllCategories(tenantId: string): Promise<Array<{ category: string; subcategories: string[] }>> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId);
    const categoryMap = new Map<string, Set<string>>();
    
    tenantItems.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, new Set());
      }
      if (item.subcategory) {
        categoryMap.get(item.category)!.add(item.subcategory);
      }
    });
    
    return Array.from(categoryMap.entries()).map(([category, subcategorySet]) => ({
      category,
      subcategories: Array.from(subcategorySet).sort()
    }));
  }

  async getAllSuppliers(tenantId: string): Promise<string[]> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.supplier);
    return Array.from(new Set(tenantItems.map(ms => ms.supplier!))).sort();
  }

  async getAllBrands(tenantId: string): Promise<string[]> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.brand);
    return Array.from(new Set(tenantItems.map(ms => ms.brand!))).sort();
  }

  async getAllLocations(tenantId: string): Promise<string[]> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId && ms.location);
    return Array.from(new Set(tenantItems.map(ms => ms.location!))).sort();
  }

  async getAllUnits(tenantId: string): Promise<string[]> {
    const tenantItems = this.materialsServices.filter(ms => ms.tenantId === tenantId);
    return Array.from(new Set(tenantItems.map(ms => ms.unit))).sort();
  }

  // ===== ACTIVITY OPERATIONS (Simplified) =====

  async getMaterialServiceActivity(id: string, tenantId: string, limit = 50): Promise<Array<{ action: string; timestamp: Date; userId?: string; details?: Record<string, any> }>> {
    // Simplified implementation - return empty array
    return [];
  }

  async logActivity(materialServiceId: string, tenantId: string, action: string, userId?: string, details?: Record<string, any>): Promise<void> {
    console.log(`[SIMPLIFIED-MS-REPO] Activity logged for ${materialServiceId}: ${action}`);
  }

  async getRecentlyCreated(tenantId: string, days = 7, limit = 10): Promise<MaterialService[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.materialsServices
      .filter(ms => ms.tenantId === tenantId && ms.createdAt >= cutoffDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getRecentlyUpdated(tenantId: string, days = 7, limit = 10): Promise<MaterialService[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.materialsServices
      .filter(ms => ms.tenantId === tenantId && ms.updatedAt >= cutoffDate)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  async getMostUsed(tenantId: string, limit = 10): Promise<Array<{ materialService: MaterialService; usageCount: number }>> {
    // Simplified implementation - return empty array since we don't track usage
    return [];
  }
}