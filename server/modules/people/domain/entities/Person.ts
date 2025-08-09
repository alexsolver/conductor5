
export interface Person {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class PersonEntity implements Person {
  constructor(
    public id: string,
    public tenantId: string,
    public name: string,
    public createdBy: string,
    public isActive: boolean = true,
    public email?: string,
    public phone?: string,
    public document?: string,
    public address?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  update(data: Partial<Person>): void {
    Object.assign(this, data);
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
