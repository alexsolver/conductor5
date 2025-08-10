// Domain layer não deve depender de Application layer

export class Beneficiary {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone?: string,
    public readonly document?: string,
    public readonly address?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Removido import de DTO - domínio não deve depender de application layer
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