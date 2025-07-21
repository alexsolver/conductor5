// User Domain Entity - Clean Architecture
export type UserRole = 'admin' | 'agent' | 'customer''[,;]

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly firstName: string | null = null,
    public readonly lastName: string | null = null,
    public readonly role: UserRole = 'agent''[,;]
    public readonly tenantId: string | null = null,
    public readonly profileImageUrl: string | null = null,
    public readonly isActive: boolean = true,
    public readonly lastLoginAt: Date | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Business rules
  get fullName(): string {
    if (!this.firstName && !this.lastName) return this.email;
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  get isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  get isAdmin(): boolean {
    return this.role === 'admin''[,;]
  }

  get isAgent(): boolean {
    return this.role === 'agent''[,;]
  }

  canAccessTenant(tenantId: string): boolean {
    return this.tenantId === tenantId || this.isAdmin;
  }

  // Factory methods
  static create(props: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    tenantId?: string;
    profileImageUrl?: string;
  }): User {
    // Business validation
    if (!props.email) {
      throw new Error('User email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.email)) {
      throw new Error('Invalid email format');
    }

    if (!props.passwordHash) {
      throw new Error('Password hash is required');
    }

    return new User(
      crypto.randomUUID(),
      props.email.toLowerCase(),
      props.passwordHash,
      props.firstName || null,
      props.lastName || null,
      props.role || 'agent''[,;]
      props.tenantId || null,
      props.profileImageUrl || null,
      true,
      null,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<{
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
    profileImageUrl: string;
    isActive: boolean;
  }>): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      props.firstName !== undefined ? props.firstName : this.firstName,
      props.lastName !== undefined ? props.lastName : this.lastName,
      props.role !== undefined ? props.role : this.role,
      props.tenantId !== undefined ? props.tenantId : this.tenantId,
      props.profileImageUrl !== undefined ? props.profileImageUrl : this.profileImageUrl,
      props.isActive !== undefined ? props.isActive : this.isActive,
      this.lastLoginAt,
      this.createdAt,
      new Date()
    );
  }

  updatePassword(newPasswordHash: string): User {
    return new User(
      this.id,
      this.email,
      newPasswordHash,
      this.firstName,
      this.lastName,
      this.role,
      this.tenantId,
      this.profileImageUrl,
      this.isActive,
      this.lastLoginAt,
      this.createdAt,
      new Date()
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
      this.profileImageUrl,
      this.isActive,
      new Date(),
      this.createdAt,
      new Date()
    );
  }
}