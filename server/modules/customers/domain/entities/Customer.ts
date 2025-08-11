// Domain Entity - Pure business logic, no dependencies
export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    
    // Tipo e status
    public readonly customerType: 'PF' | 'PJ' = 'PF',
    public readonly status: 'Ativo' | 'Inativo' | 'active' | 'inactive' = 'Ativo',
    
    // Informações básicas
    public readonly email: string,
    public readonly description: string | null = null,
    public readonly internalCode: string | null = null,
    
    // Dados pessoa física
    public readonly firstName: string | null = null,
    public readonly lastName: string | null = null,
    public readonly cpf: string | null = null,
    
    // Dados pessoa jurídica
    public readonly companyName: string | null = null,
    public readonly cnpj: string | null = null,
    
    // Contatos
    public readonly contactPerson: string | null = null,
    public readonly responsible: string | null = null,
    public readonly phone: string | null = null,
    public readonly mobilePhone: string | null = null,
    
    // Hierarquia
    public readonly position: string | null = null,
    public readonly supervisor: string | null = null,
    public readonly coordinator: string | null = null,
    public readonly manager: string | null = null,
    
    // Campos técnicos (mantidos para compatibilidade)
    public readonly tags: string[] = [],
    public readonly metadata: Record<string, unknown> = {},
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
    if (this.customerType === 'PJ') {
      return this.companyName || this.email;
    }
    if (!this.firstName && !this.lastName) return this.email;
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  get displayName(): string {
    if (this.customerType === 'PJ') {
      return this.companyName || 'Empresa sem nome';
    }
    return this.fullName;
  }

  get isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  get isValidDocument(): boolean {
    if (this.customerType === 'PF') {
      return this.isValidCPF();
    } else {
      return this.isValidCNPJ();
    }
  }

  private isValidCPF(): boolean {
    if (!this.cpf) return false;
    const cleanCPF = this.cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  }

  private isValidCNPJ(): boolean {
    if (!this.cnpj) return false;
    const cleanCNPJ = this.cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  }

  get isActive(): boolean {
    return this.active && !this.suspended && this.status === 'Ativo';
  }

  get canReceiveSupport(): boolean {
    return this.isActive && this.verified;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  get isPessoaFisica(): boolean {
    return this.customerType === 'PF';
  }

  get isPessoaJuridica(): boolean {
    return this.customerType === 'PJ';
  }

  // Status management
  canBeSuspended(): boolean {
    return this.active && !this.suspended;
  }

  canBeActivated(): boolean {
    return !this.active || this.suspended;
  }

  // CLEANED: Factory methods removed - creation logic moved to application layer
  // Domain entities should focus on business logic, not object construction
  }

  // Update methods (immutable)
  updateProfile(changes: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
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