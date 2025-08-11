/**
 * Material Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for materials
 */

export class Material {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private description?: string,
    private category?: string,
    private unitPrice?: number,
    private supplier?: string,
    private active: boolean = true,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getDescription(): string | undefined { return this.description; }
  getCategory(): string | undefined { return this.category; }
  getUnitPrice(): number | undefined { return this.unitPrice; }
  getSupplier(): string | undefined { return this.supplier; }
  isActive(): boolean { return this.active; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateDetails(name: string, description?: string, category?: string): void {
    this.name = name;
    this.description = description;
    this.category = category;
    this.updatedAt = new Date();
  }

  updatePricing(unitPrice: number): void {
    if (unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
    this.unitPrice = unitPrice;
    this.updatedAt = new Date();
  }

  setSupplier(supplier: string): void {
    this.supplier = supplier;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  calculateTotal(quantity: number): number {
    if (!this.unitPrice) return 0;
    return this.unitPrice * quantity;
  }
}