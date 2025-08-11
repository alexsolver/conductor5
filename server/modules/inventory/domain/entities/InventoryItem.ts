/**
 * InventoryItem Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for inventory management
 */

export class InventoryItem {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private readonly sku: string,
    private category: string,
    private currentStock: number,
    private minStock: number,
    private maxStock: number,
    private location: string,
    private unitCost: number = 0,
    private lastUpdated: Date = new Date(),
    private readonly createdAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getSku(): string { return this.sku; }
  getCategory(): string { return this.category; }
  getCurrentStock(): number { return this.currentStock; }
  getMinStock(): number { return this.minStock; }
  getMaxStock(): number { return this.maxStock; }
  getLocation(): string { return this.location; }
  getUnitCost(): number { return this.unitCost; }
  getLastUpdated(): Date { return this.lastUpdated; }
  getCreatedAt(): Date { return this.createdAt; }

  // Business methods
  updateStock(quantity: number, reason: string): void {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    this.currentStock = quantity;
    this.lastUpdated = new Date();
  }

  addStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity to add must be positive');
    }
    this.currentStock += quantity;
    this.lastUpdated = new Date();
  }

  removeStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity to remove must be positive');
    }
    if (this.currentStock < quantity) {
      throw new Error('Insufficient stock available');
    }
    this.currentStock -= quantity;
    this.lastUpdated = new Date();
  }

  isLowStock(): boolean {
    return this.currentStock <= this.minStock;
  }

  isOutOfStock(): boolean {
    return this.currentStock === 0;
  }

  isOverstocked(): boolean {
    return this.currentStock >= this.maxStock;
  }

  getStockStatus(): 'low' | 'normal' | 'high' | 'out' {
    if (this.isOutOfStock()) return 'out';
    if (this.isLowStock()) return 'low';
    if (this.isOverstocked()) return 'high';
    return 'normal';
  }

  updateLocation(newLocation: string): void {
    this.location = newLocation;
    this.lastUpdated = new Date();
  }

  updateCategory(newCategory: string): void {
    this.category = newCategory;
    this.lastUpdated = new Date();
  }

  calculateStockValue(): number {
    return this.currentStock * this.unitCost;
  }

  getStockDaysRemaining(averageDailyUsage: number): number {
    if (averageDailyUsage <= 0) return Infinity;
    return Math.floor(this.currentStock / averageDailyUsage);
  }

  needsReorder(): boolean {
    return this.isLowStock() && !this.isOutOfStock();
  }

  getReorderSuggestion(): number {
    if (!this.needsReorder()) return 0;
    return this.maxStock - this.currentStock;
  }
}