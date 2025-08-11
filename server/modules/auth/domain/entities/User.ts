/**
 * User Domain Entity
 * Clean Architecture - Domain Layer
 * Contains business rules and invariants for users
 */

export interface UserCreateProps {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer';
  tenantId?: string;
  active?: boolean;
  verified?: boolean;
}

export class User {
  constructor(
    private readonly id: string,
    private email: string,
    private readonly passwordHash: string,
    private firstName: string | null,
    private lastName: string | null,
    private role: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer',
    private tenantId: string | null,
    private active: boolean,
    private verified: boolean,
    private lastLogin: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  // Getters
  getId(): string { return this.id; }
  getEmail(): string { return this.email; }
  getPasswordHash(): string { return this.passwordHash; }
  getFirstName(): string | null { return this.firstName; }
  getLastName(): string | null { return this.lastName; }
  getRole(): 'saas_admin' | 'tenant_admin' | 'agent' | 'customer' { return this.role; }
  getTenantId(): string | null { return this.tenantId; }
  isActive(): boolean { return this.active; }
  isVerified(): boolean { return this.verified; }
  getLastLogin(): Date | null { return this.lastLogin; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.email;
  }

  canManageTenant(tenantId: string): boolean {
    if (this.role === 'saas_admin') {
      return true; // SaaS admins can manage any tenant
    }
    
    if (this.role === 'tenant_admin') {
      return this.tenantId === tenantId; // Tenant admins can only manage their own tenant
    }
    
    return false;
  }

  canAccessTenant(tenantId: string): boolean {
    if (this.role === 'saas_admin') {
      return true; // SaaS admins can access any tenant
    }
    
    return this.tenantId === tenantId; // Others can only access their own tenant
  }

  isSaasAdmin(): boolean {
    return this.role === 'saas_admin';
  }

  isTenantAdmin(): boolean {
    return this.role === 'tenant_admin';
  }

  isAgent(): boolean {
    return this.role === 'agent';
  }

  isCustomer(): boolean {
    return this.role === 'customer';
  }

  hasPermissionFor(permission: string): boolean {
    const permissions = this.getRolePermissions();
    return permissions.includes(permission);
  }

  private getRolePermissions(): string[] {
    switch (this.role) {
      case 'saas_admin':
        return [
          'platform:manage',
          'tenant:create',
          'tenant:manage',
          'user:manage',
          'ticket:manage',
          'customer:manage',
          'analytics:view'
        ];
      case 'tenant_admin':
        return [
          'tenant:view',
          'user:manage',
          'ticket:manage',
          'customer:manage',
          'analytics:view'
        ];
      case 'agent':
        return [
          'ticket:view',
          'ticket:assign',
          'ticket:resolve',
          'customer:view',
          'customer:create'
        ];
      case 'customer':
        return [
          'ticket:create',
          'ticket:view_own'
        ];
      default:
        return [];
    }
  }

  // Business rules
  canBeDeactivated(): boolean {
    // SaaS admins cannot be deactivated if they're the only admin
    return this.role !== 'saas_admin' || this.active === false;
  }

  requiresTenant(): boolean {
    return this.role !== 'saas_admin';
  }

  // Factory method removed - should be handled by repository or service layer
  // Domain entities should focus on business logic, not object construction with external dependencies

  // Update methods (immutable)
  updateProfile(changes: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): User {
    return new User(
      this.id,
      changes.email?.toLowerCase().trim() || this.email,
      this.passwordHash,
      changes.firstName?.trim() || this.firstName,
      changes.lastName?.trim() || this.lastName,
      this.role,
      this.tenantId,
      this.active,
      this.verified,
      this.lastLogin,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  activate(): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      this.role,
      this.tenantId,
      true, // active
      this.verified,
      this.lastLogin,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  deactivate(): User {
    if (!this.canBeDeactivated()) {
      throw new Error('User cannot be deactivated');
    }

    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      this.role,
      this.tenantId,
      false, // active
      this.verified,
      this.lastLogin,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  recordLogin(): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      this.role,
      this.tenantId,
      this.active,
      this.verified,
      new Date(), // lastLogin
      this.createdAt,
      new Date() // updatedAt
    );
  }

  // CLEANED: Factory method removed - persistence mapping moved to repository layer
  // Domain entities should not handle data reconstruction from external sources
}