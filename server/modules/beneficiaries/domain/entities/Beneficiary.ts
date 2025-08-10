// Domain layer não deve depender de Application layer

// Removed dependency violation - Domain Layer should not depend on Application Layer DTOs

export class Beneficiary {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly tenantId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    tenantId: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.tenantId = tenantId;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // Removed invalid domain dependency - DTOs should not be imported in Domain Layer
  static fromData(data: {
    firstName: string;
    lastName: string;
    email: string;
    cpf?: string;
    phone?: string;
    birthDate?: Date;
    isActive?: boolean;
    tenantId: string;
  }): Beneficiary {
    return new Beneficiary(
      data.firstName,
      data.lastName,
      data.email,
      data.cpf,
      data.phone,
      data.birthDate,
      data.isActive,
      data.tenantId
    );
  }

  validate(): boolean {
    return !!(this.name && this.email && this.tenantId);
  }
}