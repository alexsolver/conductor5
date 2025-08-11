
export class TemplateHierarchy {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly parentId?: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly level: number = 0,
    public readonly path: string = '',
    public readonly active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly modifiedAt: Date = new Date()
  ) {}

  // Factory method removed - should be handled by repository or service layer
  // Domain entities should focus on business logic, not object construction

  isValid(): boolean {
    return this.name.length > 0 && this.tenantId.length > 0;
  }

  isRoot(): boolean {
    return !this.parentId;
  }
}
