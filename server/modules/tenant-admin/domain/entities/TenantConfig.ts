
export class TenantConfig {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly config: Record<string, any>,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Factory method moved to repository or service layer for clean domain separation
  // Domain entities should focus on business logic, not object construction

  // Business rule for configuration updates
  mergeConfig(newConfig: Record<string, any>): Record<string, any> {
    return { ...this.config, ...newConfig };
  }

  // Validation rules
  isValidConfig(config: Record<string, any>): boolean {
    return config !== null && typeof config === 'object';
  }
}
