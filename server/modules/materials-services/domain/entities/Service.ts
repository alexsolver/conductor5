// Removed drizzle dependency - Domain layer should not depend on infrastructure
export class Service {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly price?: number,
    public readonly category?: string,
    public readonly duration?: number,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Factory method removed - should be handled by repository or service layer
  static createRemoved(
    id: string,
    tenantId: string,
    name: string,
    description?: string,
    price?: number,
    category?: string,
    duration?: number
  ): Service {
    return new Service(
      id,
      tenantId,
      name,
      description,
      price,
      category,
      duration
    );
  }

  validate(): boolean {
    return !!(this.name && this.tenantId && this.price !== undefined && this.price >= 0);
  }

  calculateServiceCost(hours: number): number {
    if (this.duration) {
      return (this.price || 0) * Math.ceil(hours / this.duration);
    }
    return (this.price || 0) * hours;
  }
}