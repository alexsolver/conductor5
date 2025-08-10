// Domain entities should be infrastructure-agnostic

export class Material {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly description?: string,
    public readonly unitPrice?: number,
    public readonly category?: string,
    public readonly supplier?: string,
    public readonly active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    name: string,
    code: string,
    description?: string,
    unitPrice?: number
  ): Material {
    return new Material(id, tenantId, name, code, description, unitPrice);
  }

  isValid(): boolean {
    return this.name.length > 0 && this.code.length > 0;
  }

  calculateTotalPrice(quantity: number): number {
    return (this.unitPrice || 0) * quantity;
  }
}