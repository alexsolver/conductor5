
export class FieldLayout {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly fields: any[],
    public readonly tenantId: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Factory method removed - should be handled by repository or service layer
    return new FieldLayout(
      data.id,
      data.name,
      data.fields,
      data.tenantId
    );
  }

  update(data: { name?: string; fields?: any[] }): FieldLayout {
    return new FieldLayout(
      this.id,
      data.name ?? this.name,
      data.fields ?? this.fields,
      this.tenantId,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }
}
