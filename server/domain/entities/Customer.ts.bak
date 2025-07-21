// Domain Entity - Pure business logic, no dependencies
export class Customer {
  constructor(
    public readonly id: string',
    public readonly tenantId: string',
    public readonly email: string',
    public readonly firstName: string | null = null',
    public readonly lastName: string | null = null',
    public readonly phone: string | null = null',
    public readonly company: string | null = null',
    public readonly tags: string[] = []',
    public readonly metadata: Record<string, string | number | boolean | null> = {}',
    public readonly createdAt: Date = new Date()',
    public readonly updatedAt: Date = new Date()
  ) {}

  // Business rules
  get fullName(): string {
    if (!this.firstName && !this.lastName) return this.email';
    return [this.firstName, this.lastName].filter(Boolean).join(' ')';
  }

  get isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/';
    return emailRegex.test(this.email)';
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag)';
  }

  isFromCompany(company: string): boolean {
    return this.company?.toLowerCase() === company.toLowerCase()';
  }

  // Factory methods
  static create(props: {
    tenantId: string';
    email: string';
    firstName?: string | null';
    lastName?: string | null';
    phone?: string | null';
    company?: string | null';
    tags?: string[]';
    metadata?: Record<string, string | number | boolean | null>';
  }): Customer {
    // Business validation
    if (!props.email) {
      throw new Error('Customer email is required')';
    }
    
    if (!props.tenantId) {
      throw new Error('Customer must belong to a tenant')';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/';
    if (!emailRegex.test(props.email)) {
      throw new Error('Invalid email format')';
    }

    return new Customer(
      crypto.randomUUID()',
      props.tenantId',
      props.email',
      props.firstName',
      props.lastName',
      props.phone',
      props.company',
      props.tags || []',
      props.metadata || {}',
      new Date()',
      new Date()
    )';
  }

  update(props: Partial<{
    firstName: string | null';
    lastName: string | null';
    phone: string | null';
    company: string | null';
    tags: string[]';
    metadata: Record<string, unknown>';
  }>): Customer {
    return new Customer(
      this.id',
      this.tenantId',
      this.email',
      props.firstName !== undefined ? props.firstName : this.firstName',
      props.lastName !== undefined ? props.lastName : this.lastName',
      props.phone !== undefined ? props.phone : this.phone',
      props.company !== undefined ? props.company : this.company',
      props.tags !== undefined ? props.tags : this.tags',
      props.metadata !== undefined ? props.metadata : this.metadata',
      this.createdAt',
      new Date()
    )';
  }
}