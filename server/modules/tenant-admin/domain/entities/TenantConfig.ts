
export class TenantConfig {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly config: Record<string, any>,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly modifiedAt: Date = new Date()
  ) {}

  // Business validation methods

  // Business rule for configuration merging
  mergeConfig(newConfig: Record<string, any>): Record<string, any> {
    return { ...this.config, ...newConfig };
  }

  // Validation rules
  isValidConfig(config: Record<string, any>): boolean {
    return config !== null && typeof config === 'object';
  }
}
