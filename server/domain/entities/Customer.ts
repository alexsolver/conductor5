
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

  get fullAddress(): string {
    const parts = [
      this.address,
      this.addressNumber,
      this.complement,
      this.neighborhood,
      this.city,
      this.state,
      this.zipCode
    ].filter(Boolean);
    return parts.join(', ');
  }

  // Validation methods
  get isValidCPF(): boolean {
    if (!this.cpf || this.customerType !== "PF") return true;
    return this.cpf.replace(/\D/g, '').length === 11;
  }

  get isValidCNPJ(): boolean {
    if (!this.cnpj || this.customerType !== "PJ") return true;
    return this.cnpj.replace(/\D/g, '').length === 14;
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
    // Business validation
    if (!props.email) {
      throw new Error('Customer email is required');
    }
    
    if (!props.tenantId) {
      throw new Error('Customer must belong to a tenant');
    }

    if (!props.firstName || !props.lastName) {
      throw new Error('Customer first name and last name are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.email)) {
      throw new Error('Invalid email format');
    }

    // Validate customer type specific fields
    if (props.customerType === "PJ" && !props.companyName) {
      throw new Error('Company name is required for PJ customers');
    }

    if (props.customerType === "PF" && props.cpf) {
      const cpfDigits = props.cpf.replace(/\D/g, '');
      if (cpfDigits.length !== 11) {
        throw new Error('CPF must have 11 digits');
      }
    }

    if (props.customerType === "PJ" && props.cnpj) {
      const cnpjDigits = props.cnpj.replace(/\D/g, '');
      if (cnpjDigits.length !== 14) {
        throw new Error('CNPJ must have 14 digits');
      }
    }

    return new Customer(
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
    // Validate changes
    if (props.customerType === "PJ" && props.companyName === null && !this.companyName) {
      throw new Error('Company name is required for PJ customers');
    }

    return new Customer(
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
  }
}
