/**
 * Beneficiary Domain Entity
 * Clean Architecture - Domain Layer
 * Pure business logic without external dependencies
 */

export class Beneficiary {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly document?: string,
    public readonly status: 'active' | 'inactive' = 'active',
    public readonly metadata: Record<string, any> = {},
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Beneficiary ID is required');
    }
    
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }
    
    if (!this.name || this.name.trim().length < 2) {
      throw new Error('Beneficiary name must be at least 2 characters long');
    }
  }

  // Business methods
  isActive(): boolean {
    return this.status === 'active';
  }

  hasEmail(): boolean {
    return !!this.email;
  }

  hasPhone(): boolean {
    return !!this.phone;
  }

  getFullName(): string {
    return this.name.trim();
  }
}