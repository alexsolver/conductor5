/**
 * User Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for user management
 */

export class User {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private email: string,
    private readonly passwordHash: string,
    private role: string,
    private firstName: string,
    private lastName: string,
    private active: boolean = true,
    private lastLoginAt: Date | null = null,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getEmail(): string { return this.email; }
  getPasswordHash(): string { return this.passwordHash; }
  getRole(): string { return this.role; }
  getFirstName(): string { return this.firstName; }
  getLastName(): string { return this.lastName; }
  isActive(): boolean { return this.active; }
  getLastLoginAt(): Date | null { return this.lastLoginAt; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateProfile(firstName: string, lastName: string, email: string): void {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.updatedAt = new Date();
  }

  changeRole(newRole: string): void {
    this.role = newRole;
    this.updatedAt = new Date();
  }

  recordLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getDisplayName(): string {
    return `${this.getFullName()} (${this.email})`;
  }

  hasRole(role: string): boolean {
    return this.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.role);
  }

  isAdmin(): boolean {
    return this.role === 'admin' || this.role === 'tenant_admin' || this.role === 'saas_admin';
  }

  canAccessTenant(tenantId: string): boolean {
    return this.tenantId === tenantId || this.role === 'saas_admin';
  }
}