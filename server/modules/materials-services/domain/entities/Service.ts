/**
 * Service Domain Entity
 * Clean Architecture - Domain Layer
 */

export class Service {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly category: string = 'General',
    public readonly subcategory?: string,
    public readonly price: number = 0,
    public readonly cost: number = 0,
    public readonly estimatedDuration?: number, // in minutes
    public readonly skillsRequired: string[] = [],
    public readonly specifications: Record<string, any> = {},
    public readonly active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.id) {
      throw new Error('Service ID is required');
    }
    
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Service name is required');
    }

    if (this.price < 0) {
      throw new Error('Service price cannot be negative');
    }

    if (this.cost < 0) {
      throw new Error('Service cost cannot be negative');
    }

    if (this.estimatedDuration && this.estimatedDuration <= 0) {
      throw new Error('Estimated duration must be positive');
    }
  }

  // Business methods
  getProfitMargin(): number {
    if (this.cost === 0) return 0;
    return ((this.price - this.cost) / this.cost) * 100;
  }

  getHourlyRate(): number {
    if (!this.estimatedDuration) return 0;
    return (this.price / this.estimatedDuration) * 60; // per hour
  }

  hasRequiredSkills(availableSkills: string[]): boolean {
    return this.skillsRequired.every(skill => 
      availableSkills.some(available => 
        available.toLowerCase() === skill.toLowerCase()
      )
    );
  }

  getEstimatedHours(): number {
    if (!this.estimatedDuration) return 0;
    return this.estimatedDuration / 60;
  }

  isComplex(): boolean {
    return this.skillsRequired.length > 2 || 
           (this.estimatedDuration && this.estimatedDuration > 480); // 8 hours
  }
}