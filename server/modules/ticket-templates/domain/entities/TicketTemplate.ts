
export class TicketTemplate {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly content: any,
    public readonly category?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Factory method removed - should be handled by repository or service layer
  // Domain entities should focus on business logic, not object construction

  isValid(): boolean {
    return this.name.length > 0 && this.tenantId.length > 0;
  }
}
