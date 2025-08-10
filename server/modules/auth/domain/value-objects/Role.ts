/**
 * Role Value Object
 * Clean Architecture - Domain Layer
 * Represents valid user roles in the system
 */

export class Role {
  private constructor(private readonly value: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer') {
    this.validate(value);
  }

  static create(value: string): Role {
    return new Role(value as 'saas_admin' | 'tenant_admin' | 'agent' | 'customer');
  }

  static readonly SAAS_ADMIN = new Role('saas_admin');
  static readonly TENANT_ADMIN = new Role('tenant_admin');
  static readonly AGENT = new Role('agent');
  static readonly CUSTOMER = new Role('customer');

  private validate(value: string): void {
    const validRoles = ['saas_admin', 'tenant_admin', 'agent', 'customer'];
    if (!validRoles.includes(value)) {
      throw new Error(`Invalid role: ${value}`);
    }
  }

  getValue(): 'saas_admin' | 'tenant_admin' | 'agent' | 'customer' {
    return this.value;
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Business logic
  canManageTenant(): boolean {
    return this.value === 'saas_admin' || this.value === 'tenant_admin';
  }

  isSaasAdmin(): boolean {
    return this.value === 'saas_admin';
  }
}