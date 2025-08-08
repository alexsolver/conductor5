
export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string | null = null,
    public readonly mobilePhone: string | null = null,
    public readonly customerType: string = "PF",
    public readonly cpf: string | null = null,
    public readonly cnpj: string | null = null,
    public readonly companyName: string | null = null,
    public readonly contactPerson: string | null = null,
    public readonly state: string | null = null,
    public readonly address: string | null = null,
    public readonly addressNumber: string | null = null,
    public readonly complement: string | null = null,
    public readonly neighborhood: string | null = null,
    public readonly city: string | null = null,
    public readonly zipCode: string | null = null,
    public readonly isActive: boolean = true,
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

  get isPF(): boolean {
    return this.customerType === "PF";
  }

  get isPJ(): boolean {
    return this.customerType === "PJ";
  }

  get displayName(): string {
    if (this.isPJ && this.companyName) {
      return this.companyName;
    }
    return this.fullName;
  }

  // Validation rules
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.email || !this.isValidEmail) {
      errors.push('Email válido é obrigatório');
    }
    
    if (!this.firstName || !this.lastName) {
      errors.push('Nome e sobrenome são obrigatórios');
    }
    
    if (this.customerType === 'PJ' && !this.companyName) {
      errors.push('Nome da empresa é obrigatório para Pessoa Jurídica');
    }
    
    if (this.customerType === 'PF' && this.cpf) {
      // Basic CPF validation (11 digits)
      const cpfDigits = this.cpf.replace(/\D/g, '');
      if (cpfDigits.length !== 11) {
        errors.push('CPF deve ter 11 dígitos');
      }
    }
    
    if (this.customerType === 'PJ' && this.cnpj) {
      // Basic CNPJ validation (14 digits)
      const cnpjDigits = this.cnpj.replace(/\D/g, '');
      if (cnpjDigits.length !== 14) {
        errors.push('CNPJ deve ter 14 dígitos');
      }
    }
    
    return errors;
  }

  // Factory methods
  static create(props: {
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    mobilePhone?: string | null;
    customerType?: string;
    cpf?: string | null;
    cnpj?: string | null;
    companyName?: string | null;
    contactPerson?: string | null;
    state?: string | null;
    address?: string | null;
    addressNumber?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    zipCode?: string | null;
  }): Customer {
    const customer = new Customer(
      crypto.randomUUID(),
      props.tenantId,
      props.email,
      props.firstName,
      props.lastName,
      props.phone,
      props.mobilePhone,
      props.customerType || "PF",
      props.cpf,
      props.cnpj,
      props.companyName,
      props.contactPerson,
      props.state,
      props.address,
      props.addressNumber,
      props.complement,
      props.neighborhood,
      props.city,
      props.zipCode,
      true,
      new Date(),
      new Date()
    );

    // Validate before creating
    const errors = customer.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return customer;
  }

  update(props: Partial<{
    firstName: string;
    lastName: string;
    phone: string | null;
    mobilePhone: string | null;
    customerType: string;
    cpf: string | null;
    cnpj: string | null;
    companyName: string | null;
    contactPerson: string | null;
    state: string | null;
    address: string | null;
    addressNumber: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    zipCode: string | null;
    isActive: boolean;
  }>): Customer {
    const updated = new Customer(
      this.id,
      this.tenantId,
      this.email,
      props.firstName !== undefined ? props.firstName : this.firstName,
      props.lastName !== undefined ? props.lastName : this.lastName,
      props.phone !== undefined ? props.phone : this.phone,
      props.mobilePhone !== undefined ? props.mobilePhone : this.mobilePhone,
      props.customerType !== undefined ? props.customerType : this.customerType,
      props.cpf !== undefined ? props.cpf : this.cpf,
      props.cnpj !== undefined ? props.cnpj : this.cnpj,
      props.companyName !== undefined ? props.companyName : this.companyName,
      props.contactPerson !== undefined ? props.contactPerson : this.contactPerson,
      props.state !== undefined ? props.state : this.state,
      props.address !== undefined ? props.address : this.address,
      props.addressNumber !== undefined ? props.addressNumber : this.addressNumber,
      props.complement !== undefined ? props.complement : this.complement,
      props.neighborhood !== undefined ? props.neighborhood : this.neighborhood,
      props.city !== undefined ? props.city : this.city,
      props.zipCode !== undefined ? props.zipCode : this.zipCode,
      props.isActive !== undefined ? props.isActive : this.isActive,
      this.createdAt,
      new Date()
    );

    // Validate updated customer
    const errors = updated.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return updated;
  }
}
