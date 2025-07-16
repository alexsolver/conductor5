// Domain Entity - Pure business logic, no dependencies
export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly firstName: string | null = null,
    public readonly lastName: string | null = null,
    public readonly phone: string | null = null,
    public readonly company: string | null = null,
    public readonly tags: string[] = [],
    public readonly metadata: Record<string, any> = {},
    // Professional fields
    public readonly verified: boolean = false,
    public readonly active: boolean = true,
    public readonly suspended: boolean = false,
    public readonly lastLogin: Date | null = null,
    public readonly timezone: string = 'UTC',
    public readonly locale: string = 'en-US',
    public readonly language: string = 'en',
    public readonly externalId: string | null = null,
    public readonly role: string = 'customer',
    public readonly notes: string | null = null,
    public readonly avatar: string | null = null,
    public readonly signature: string | null = null,
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

  get isActive(): boolean {
    return this.active && !this.suspended;
  }

  get canReceiveSupport(): boolean {
    return this.isActive && this.verified;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  isFromCompany(company: string): boolean {
    return this.company?.toLowerCase() === company.toLowerCase();
  }

  // Status management
  canBeSuspended(): boolean {
    return this.active && !this.suspended;
  }

  canBeActivated(): boolean {
    return !this.active || this.suspended;
  }

  // Factory methods
  static create(props: {
    tenantId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    company?: string | null;
    tags?: string[];
    metadata?: Record<string, any>;
    verified?: boolean;
    timezone?: string;
    locale?: string;
    language?: string;
    role?: string;
  }): Customer {
    // Business validation
    if (!props.email) {
      throw new Error('Customer email is required');
    }
    
    if (!props.tenantId) {
      throw new Error('Customer must belong to a tenant');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.email)) {
      throw new Error('Invalid email format');
    }

    return new Customer(
      crypto.randomUUID(),
      props.tenantId,
      props.email,
      props.firstName,
      props.lastName,
      props.phone,
      props.company,
      props.tags || [],
      props.metadata || {},
      props.verified || false,
      true, // active by default
      false, // not suspended by default
      null, // lastLogin
      props.timezone || 'UTC',
      props.locale || 'en-US',
      props.language || 'en',
      null, // externalId
      props.role || 'customer',
      null, // notes
      null, // avatar
      null, // signature
      new Date(),
      new Date()
    );
  }

  // Update methods (immutable)
  updateProfile(changes: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    company?: string | null;
    timezone?: string;
    locale?: string;
    language?: string;
  }): Customer {
    return new Customer(
      this.id,
      this.tenantId,
      this.email,
      changes.firstName !== undefined ? changes.firstName : this.firstName,
      changes.lastName !== undefined ? changes.lastName : this.lastName,
      changes.phone !== undefined ? changes.phone : this.phone,
      changes.company !== undefined ? changes.company : this.company,
      this.tags,
      this.metadata,
      this.verified,
      this.active,
      this.suspended,
      this.lastLogin,
      changes.timezone || this.timezone,
      changes.locale || this.locale,
      changes.language || this.language,
      this.externalId,
      this.role,
      this.notes,
      this.avatar,
      this.signature,
      this.createdAt,
      new Date()
    );
  }

  suspend(reason?: string): Customer {
    if (!this.canBeSuspended()) {
      throw new Error('Customer cannot be suspended');
    }

    const metadata = reason ? { ...this.metadata, suspensionReason: reason } : this.metadata;

    return new Customer(
      this.id,
      this.tenantId,
      this.email,
      this.firstName,
      this.lastName,
      this.phone,
      this.company,
      this.tags,
      metadata,
      this.verified,
      false, // inactive
      true, // suspended
      this.lastLogin,
      this.timezone,
      this.locale,
      this.language,
      this.externalId,
      this.role,
      this.notes,
      this.avatar,
      this.signature,
      this.createdAt,
      new Date()
    );
  }

  activate(): Customer {
    if (!this.canBeActivated()) {
      throw new Error('Customer cannot be activated');
    }

    return new Customer(
      this.id,
      this.tenantId,
      this.email,
      this.firstName,
      this.lastName,
      this.phone,
      this.company,
      this.tags,
      this.metadata,
      this.verified,
      true, // active
      false, // not suspended
      this.lastLogin,
      this.timezone,
      this.locale,
      this.language,
      this.externalId,
      this.role,
      this.notes,
      this.avatar,
      this.signature,
      this.createdAt,
      new Date()
    );
  }
}