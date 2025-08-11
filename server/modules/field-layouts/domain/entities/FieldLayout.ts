export class FieldLayout {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly fields: any[],
    public readonly tenantId: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly modifiedAt: Date = new Date()
  ) {}

  // CLEAN ARCHITECTURE: Factory method removed from domain entity
  // Creation logic should be handled by repository or application layer

  modify(data: { name?: string; fields?: any[] }): FieldLayout {
    return new FieldLayout(
      this.id,
      data.name ?? this.name,
      data.fields ?? this.fields,
      this.tenantId,
      this.isActive,
      this.createdAt,
      new Date() // modifiedAt
    );
  }
}