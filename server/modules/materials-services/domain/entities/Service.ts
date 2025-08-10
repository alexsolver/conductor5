// Domain entities should be infrastructure-agnostic

export class Service {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly description?: string,
    public readonly hourlyRate?: number,
    public readonly category?: string,
    public readonly skillLevel?: string,
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
    hourlyRate?: number
  ): Service {
    return new Service(id, tenantId, name, code, description, hourlyRate);
  }

  isValid(): boolean {
    return this.name.length > 0 && this.code.length > 0;
  }

  calculateServiceCost(hours: number): number {
    return (this.hourlyRate || 0) * hours;
  }
}