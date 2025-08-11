
export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly address: string,
    public readonly companyId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain methods only - no DTOs or presentation logic
  public updateContactInfo(email: string, phone: string): Customer {
    return new Customer(
      this.id,
      this.tenantId,
      this.name,
      email,
      phone,
      this.address,
      this.companyId,
      this.createdAt,
      new Date()
    );
  }

  public isActive(): boolean {
    return true; // Add business logic here
  }
}
