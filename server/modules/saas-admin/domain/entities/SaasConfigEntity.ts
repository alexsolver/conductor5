// Domain entities for SaaS Admin module
export interface SaasAdminEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  modifiedAt: Date;
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
  modifiedAt: Date;
}

export class SaasConfigEntity implements SaasConfig {
  constructor(
    public id: string,
    public tenantId: string,
    public configKey: string,
    public configValue: string,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public modifiedAt: Date = new Date()
  ) {}

  modify(configKey?: string, configValue?: string, isActive?: boolean): void {
    if (configKey !== undefined) this.configKey = configKey;
    if (configValue !== undefined) this.configValue = configValue;
    if (isActive !== undefined) this.isActive = isActive;
    this.modifiedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.modifiedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.modifiedAt = new Date();
  }
}