
export interface FieldLayout {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  layout: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class FieldLayout implements FieldLayout {
  constructor(
    public id: string,
    public tenantId: string,
    public name: string,
    public layout: Record<string, any>,
    public isActive: boolean,
    public createdBy: string,
    public description?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  update(data: Partial<FieldLayout>): void {
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
