
export interface TenantConfig {
  id: string;
  tenantId: string;
  configKey: string;
  configValue: any;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class TenantConfigEntity implements TenantConfig {
  constructor(
    public id: string,
    public tenantId: string,
    public configKey: string,
    public configValue: any,
    public createdBy: string,
    public isActive: boolean = true,
    public description?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  update(data: Partial<TenantConfig>): void {
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
