/**
 * Material Domain Entity
 * Clean Architecture - Domain Layer
 */

export class Material {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly category: string = 'General',
    public readonly subcategory?: string,
    public readonly unit: string = 'unit',
    public readonly price: number = 0,
    public readonly cost: number = 0,
    public readonly supplier?: string,
    public readonly sku?: string,
    public readonly stockQuantity: number = 0,
    public readonly minStock: number = 0,
    public readonly maxStock?: number,
    public readonly specifications: Record<string, any> = {},
    public readonly active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.id) {
      throw new Error('Material ID is required');
    }
    
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Material name is required');
    }

    if (this.price < 0) {
      throw new Error('Material price cannot be negative');
    }

    if (this.cost < 0) {
      throw new Error('Material cost cannot be negative');
    }

    if (this.stockQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    if (this.minStock < 0) {
      throw new Error('Minimum stock cannot be negative');
    }
  }

  // Business methods
  isLowStock(): boolean {
    return this.stockQuantity <= this.minStock;
  }

  isOutOfStock(): boolean {
    return this.stockQuantity === 0;
  }

  getProfitMargin(): number {
    if (this.cost === 0) return 0;
    return ((this.price - this.cost) / this.cost) * 100;
  }

  canFulfillQuantity(requestedQuantity: number): boolean {
    return this.stockQuantity >= requestedQuantity;
  }

  getStockStatus(): 'out_of_stock' | 'low_stock' | 'in_stock' | 'overstocked' {
    if (this.isOutOfStock()) return 'out_of_stock';
    if (this.isLowStock()) return 'low_stock';
    if (this.maxStock && this.stockQuantity > this.maxStock) return 'overstocked';
    return 'in_stock';
  }
}