
/**
 * DOMAIN ENTITY - BENEFICIARY
 * Clean Architecture: Pure domain entity without infrastructure concerns
 */

export class Beneficiary {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly birthDate?: string,
    public readonly rg?: string,
    public readonly cpfCnpj?: string,
    public readonly isActive: boolean = true,
    public readonly customerCode?: string,
    public readonly customerId?: string,
    public readonly phone?: string,
    public readonly cellPhone?: string,
    public readonly contactPerson?: string,
    public readonly contactPhone?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly version: number = 1
  ) {}

  // Domain methods only - no database or infrastructure logic
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  public isActiveStatus(): boolean {
    return this.isActive;
  }

  public canBeAssignedToTicket(): boolean {
    return this.isActive;
  }

  public validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  public hasCustomer(): boolean {
    return !!this.customerId;
  }

  public hasContactInfo(): boolean {
    return !!(this.phone || this.cellPhone || this.contactPerson);
  }

  // Factory method
  public static create(
    tenantId: string,
    firstName: string,
    lastName: string,
    email: string,
    birthDate?: string,
    rg?: string,
    cpfCnpj?: string,
    customerCode?: string,
    customerId?: string,
    phone?: string,
    cellPhone?: string,
    contactPerson?: string,
    contactPhone?: string
  ): Beneficiary {
    return new Beneficiary(
      crypto.randomUUID(),
      tenantId,
      firstName,
      lastName,
      email,
      birthDate,
      rg,
      cpfCnpj,
      true,
      customerCode,
      customerId,
      phone,
      cellPhone,
      contactPerson,
      contactPhone,
      new Date(),
      new Date()
    );
  }

  // Update method that returns new instance (immutability)
  public update(changes: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    rg: string;
    cpfCnpj: string;
    isActive: boolean;
    customerCode: string;
    customerId: string;
    phone: string;
    cellPhone: string;
    contactPerson: string;
    contactPhone: string;
  }>): Beneficiary {
    return new Beneficiary(
      this.id,
      this.tenantId,
      changes.firstName ?? this.firstName,
      changes.lastName ?? this.lastName,
      changes.email ?? this.email,
      changes.birthDate ?? this.birthDate,
      changes.rg ?? this.rg,
      changes.cpfCnpj ?? this.cpfCnpj,
      changes.isActive ?? this.isActive,
      changes.customerCode ?? this.customerCode,
      changes.customerId ?? this.customerId,
      changes.phone ?? this.phone,
      changes.cellPhone ?? this.cellPhone,
      changes.contactPerson ?? this.contactPerson,
      changes.contactPhone ?? this.contactPhone,
      this.createdAt,
      new Date(),
      this.version + 1
    );
  }
}
