// Domain entity - clean architecture compliance
export class Material {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly category?: string,
    public readonly unitPrice?: number,
    public readonly unit?: string,
    public readonly sku?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Business logic methods
  validate(): boolean {
    return !!(this.name && this.tenantId && this.unitPrice !== undefined && this.unitPrice >= 0);
  }

  calculateTotalCost(quantity: number): number {
    return (this.unitPrice || 0) * quantity;
  }

  isAvailable(): boolean {
    return this.isActive;
  }
}