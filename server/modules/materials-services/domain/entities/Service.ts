/**
 * DOMAIN ENTITY - SERVICE
 * Clean Architecture: Pure domain entity without infrastructure concerns
 */

export class Service {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly code: string,
    public readonly hourlyRate: number,
    public readonly category: string,
    public readonly estimatedDuration: number, // minutes
    public readonly complexity: 'low' | 'medium' | 'high' | 'critical',
    public readonly status: 'active' | 'inactive',
    public readonly tenantId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public isActive(): boolean {
    return this.status === 'active';
  }

  public canBeScheduled(): boolean {
    return this.isActive();
  }

  public calculateServiceCost(hours: number): number {
    return this.hourlyRate * hours;
  }

  public validateForCreation(): boolean {
    return this.name.length > 0 &&
           this.hourlyRate >= 0 &&
           this.estimatedDuration > 0;
  }

  public static create(
    name: string,
    description: string,
    code: string,
    hourlyRate: number,
    category: string,
    estimatedDuration: number,
    complexity: 'low' | 'medium' | 'high' | 'critical',
    tenantId: string
  ): Service {
    return new Service(
      crypto.randomUUID(),
      name,
      description,
      code,
      hourlyRate,
      category,
      estimatedDuration,
      complexity,
      'active',
      tenantId,
      new Date(),
      new Date()
    );
  }
}