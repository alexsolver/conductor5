// Domain entities should not import infrastructure dependencies
export class Material {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly price?: number,
    public readonly category?: string,
    public readonly unit?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    name: string,
    description?: string,
    price?: number,
    category?: string,
    unit?: string
  ): Material {
    return new Material(
      id,
      tenantId,
      name,
      description,
      price,
      category,
      unit
    );
  }

  validate(): boolean {
    return !!(this.name && this.tenantId && this.price !== undefined && this.price >= 0);
  }

  calculateTotalPrice(quantity: number): number {
    return (this.price || 0) * quantity;
  }
}