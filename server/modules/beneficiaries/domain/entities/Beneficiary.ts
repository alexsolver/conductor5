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

  // Domain entity should not know about DTOs - moved to application layer
  static create(
    id: string,
    tenantId: string,
    name: string,
    email: string,
    phone?: string,
    document?: string,
    address?: string
  ): Beneficiary {
    return new Beneficiary(
      id,
      tenantId,
      name,
      email,
      phone,
      document,
      address
    );
  }

  validate(): boolean {
    return !!(this.name && this.email && this.tenantId);
  }
}