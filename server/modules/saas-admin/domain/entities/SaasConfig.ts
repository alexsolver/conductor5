// Domain entity - clean architecture compliance
export class SaasConfig {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly configKey: string,
    public readonly configValue: string,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly modifiedAt: Date = new Date()
  ) {}

  // CLEANED: Factory method removed - creation logic moved to repository layer

  validate(): boolean {
    return !!(this.configKey && this.configValue && this.tenantId);
  }

  isFeatureEnabled(): boolean {
    return this.configValue.toLowerCase() === 'true' && this.isActive;
  }
}