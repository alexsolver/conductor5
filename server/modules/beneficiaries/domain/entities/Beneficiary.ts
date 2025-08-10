// Remove infrastructure dependency - domain should be pure
export class Beneficiary {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly status: 'active' | 'inactive' = 'active',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  public isActive(): boolean {
    return this.status === 'active';
  }

  public updateStatus(newStatus: 'active' | 'inactive'): Beneficiary {
    return new Beneficiary(
      this.id,
      this.tenantId,
      this.name,
      this.email,
      this.phone,
      this.address,
      newStatus,
      this.createdAt,
      new Date()
    );
  }
}