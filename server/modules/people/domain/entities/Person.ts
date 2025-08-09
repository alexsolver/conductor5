
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
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(data: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    tenantId?: string;
  }): Person {
    return new Person(
      data.id,
      data.name,
      data.email,
      data.phone,
      data.document,
      data.tenantId
    );
  }

  update(data: { 
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
