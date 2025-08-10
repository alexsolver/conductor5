// Domain entity - clean architecture compliance
export interface SaasConfig {
  id: string;
  tenantId: string;
  configKey: string;
  configValue: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Domain entities should not import infrastructure dependencies
export class SaasConfig {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly configKey: string,
    public readonly configValue: string,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    configKey: string,
    configValue: string,
    description?: string
  ): SaasConfig {
    return new SaasConfig(
      id,
      tenantId,
      configKey,
      configValue,
      description
    );
  }

  validate(): boolean {
    return !!(this.configKey && this.configValue && this.tenantId);
  }

  isFeatureEnabled(): boolean {
    return this.configValue.toLowerCase() === 'true' && this.isActive;
  }
}