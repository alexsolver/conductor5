// Domain entities for SaaS Admin module
export interface SaasAdminEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaasConfiguration extends SaasAdminEntity {
  configKey: string;
  configValue: string;
  description?: string;
}

// Domain entities should be framework-agnostic
// CLEANED: Removed circular reference

export interface SaasConfig {
  id: string;
  tenantId: string;
  configKey: string;
  configValue: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SaasConfigEntity implements SaasConfig {
  constructor(
    public id: string,
    public tenantId: string,
    public configKey: string,
    public configValue: string,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  update(updates: Partial<Omit<SaasConfig, 'id' | 'createdAt'>>): void {
    Object.assign(this, updates);
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