
export class Person {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly document?: string,
    public readonly tenantId?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly modifiedAt: Date = new Date()
  ) {}

  // CLEANED: Factory methods removed - handled by repository layer
  // Domain entities focus purely on business logic

  modify(data: { 
    name?: string; 
    email?: string; 
    phone?: string; 
    document?: string; 
  }): Person {
    return new Person(
      this.id,
      data.name ?? this.name,
      data.email ?? this.email,
      data.phone ?? this.phone,
      data.document ?? this.document,
      this.tenantId,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }
}
