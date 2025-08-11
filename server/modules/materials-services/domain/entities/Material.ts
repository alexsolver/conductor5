
/**
 * DOMAIN ENTITY - MATERIAL
 * Clean Architecture: Pure domain entity without infrastructure concerns
 */

export class Material {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly code: string,
    public readonly unit: string,
    public readonly price: number,
    public readonly category: string,
    public readonly status: 'active' | 'inactive',
    public readonly tenantId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public isActive(): boolean {
    return this.status === 'active';
  }

  public canBeUsedInTickets(): boolean {
    return this.isActive();
  }

  public calculateTotalPrice(quantity: number): number {
    return this.price * quantity;
  }

  public validateForCreation(): boolean {
    return this.name.length > 0 && 
           this.price >= 0 && 
           this.unit.length > 0;
  }

  public static create(
    name: string,
    description: string,
    code: string,
    unit: string,
    price: number,
    category: string,
    tenantId: string
  ): Material {
    return new Material(
      crypto.randomUUID(),
      name,
      description,
      code,
      unit,
      price,
      category,
      'active',
      tenantId,
      new Date(),
      new Date()
    );
  }
}
