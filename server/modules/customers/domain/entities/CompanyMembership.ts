/**
 * CompanyMembership Domain Entity
 * Clean Architecture - Domain Layer
 * Represents the relationship between a customer and a company
 */

export class CompanyMembership {
  constructor(
    private readonly id: string,
    private readonly customerId: string,
    private readonly companyId: string,
    private role: 'member' | 'admin' | 'owner' | 'contact' = 'member',
    private title: string | null = null,
    private department: string | null = null,
    private permissions: {
      canCreateTickets?: boolean;
      canViewAllTickets?: boolean;
      canManageUsers?: boolean;
      canViewBilling?: boolean;
      canManageSettings?: boolean;
    } = {},
    private isActive: boolean = true,
    private isPrimary: boolean = false,
    private readonly joinedAt: Date = new Date(),
    private leftAt: Date | null = null,
    private readonly addedBy: string
  ) {
    this.validateBusinessRules();
  }

  // Getters
  getId(): string { return this.id; }
  getCustomerId(): string { return this.customerId; }
  getCompanyId(): string { return this.companyId; }
  getRole(): string { return this.role; }
  getTitle(): string | null { return this.title; }
  getDepartment(): string | null { return this.department; }
  getPermissions(): any { return this.permissions; }
  isActiveMembership(): boolean { return this.isActive; }
  isPrimaryMembership(): boolean { return this.isPrimary; }
  getJoinedAt(): Date { return this.joinedAt; }
  getLeftAt(): Date | null { return this.leftAt; }
  getAddedBy(): string { return this.addedBy; }

  // Business Methods
  canCreateTickets(): boolean {
    return this.isActive && (
      this.permissions.canCreateTickets === true ||
      this.role === 'admin' ||
      this.role === 'owner'
    );
  }

  canViewAllTickets(): boolean {
    return this.isActive && (
      this.permissions.canViewAllTickets === true ||
      this.role === 'admin' ||
      this.role === 'owner'
    );
  }

  canManageUsers(): boolean {
    return this.isActive && (
      this.permissions.canManageUsers === true ||
      this.role === 'admin' ||
      this.role === 'owner'
    );
  }

  canManageSettings(): boolean {
    return this.isActive && (
      this.permissions.canManageSettings === true ||
      this.role === 'owner'
    );
  }

  canViewBilling(): boolean {
    return this.isActive && (
      this.permissions.canViewBilling === true ||
      this.role === 'admin' ||
      this.role === 'owner'
    );
  }

  isOwner(): boolean {
    return this.role === 'owner';
  }

  isAdmin(): boolean {
    return this.role === 'admin' || this.role === 'owner';
  }

  getDisplayInfo(): { title: string; department: string } {
    return {
      title: this.title || 'Member',
      department: this.department || 'General'
    };
  }

  // Business Rules Validation
  private validateBusinessRules(): void {
    if (!this.customerId) {
      throw new Error('Customer ID is required');
    }

    if (!this.companyId) {
      throw new Error('Company ID is required');
    }

    if (!this.addedBy) {
      throw new Error('Membership must have an adder');
    }

    if (this.leftAt && this.leftAt <= this.joinedAt) {
      throw new Error('Left date must be after joined date');
    }
  }

  // Update Methods
  updateRole(role: 'member' | 'admin' | 'owner' | 'contact'): CompanyMembership {
    return new CompanyMembership(
      this.id,
      this.customerId,
      this.companyId,
      role,
      this.title,
      this.department,
      this.permissions,
      this.isActive,
      this.isPrimary,
      this.joinedAt,
      this.leftAt,
      this.addedBy
    );
  }

  updateJobInfo(title: string | null, department: string | null): CompanyMembership {
    return new CompanyMembership(
      this.id,
      this.customerId,
      this.companyId,
      this.role,
      title,
      department,
      this.permissions,
      this.isActive,
      this.isPrimary,
      this.joinedAt,
      this.leftAt,
      this.addedBy
    );
  }

  updatePermissions(permissions: {
    canCreateTickets?: boolean;
    canViewAllTickets?: boolean;
    canManageUsers?: boolean;
    canViewBilling?: boolean;
    canManageSettings?: boolean;
  }): CompanyMembership {
    return new CompanyMembership(
      this.id,
      this.customerId,
      this.companyId,
      this.role,
      this.title,
      this.department,
      { ...this.permissions, ...permissions },
      this.isActive,
      this.isPrimary,
      this.joinedAt,
      this.leftAt,
      this.addedBy
    );
  }

  deactivate(): CompanyMembership {
    return new CompanyMembership(
      this.id,
      this.customerId,
      this.companyId,
      this.role,
      this.title,
      this.department,
      this.permissions,
      false,
      false, // Also remove primary status
      this.joinedAt,
      new Date(),
      this.addedBy
    );
  }

  activate(): CompanyMembership {
    return new CompanyMembership(
      this.id,
      this.customerId,
      this.companyId,
      this.role,
      this.title,
      this.department,
      this.permissions,
      true,
      this.isPrimary,
      this.joinedAt,
      null, // Clear left date
      this.addedBy
    );
  }

  setPrimary(isPrimary: boolean): CompanyMembership {
    return new CompanyMembership(
      this.id,
      this.customerId,
      this.companyId,
      this.role,
      this.title,
      this.department,
      this.permissions,
      this.isActive,
      isPrimary,
      this.joinedAt,
      this.leftAt,
      this.addedBy
    );
  }

  // CLEANED: Factory methods removed - creation and persistence mapping moved to repository layer
  // Domain entities should focus on business logic, not object construction
}