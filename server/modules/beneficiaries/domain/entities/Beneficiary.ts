
export class Beneficiary {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly tenantId: string,
    public readonly customerId?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    name: string,
    email: string,
    tenantId: string,
    customerId?: string
  ): Beneficiary {
    return new Beneficiary(
      crypto.randomUUID(),
      name,
      email,
      tenantId,
      customerId
    );
  }

  update(data: Partial<Pick<Beneficiary, 'name' | 'email' | 'isActive'>>): Beneficiary {
    return new Beneficiary(
      this.id,
      data.name ?? this.name,
      data.email ?? this.email,
      this.tenantId,
      this.customerId,
      data.isActive ?? this.isActive,
      this.createdAt,
      new Date()
    );
  }
}
