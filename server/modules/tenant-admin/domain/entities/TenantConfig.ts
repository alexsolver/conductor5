
export class TenantConfig {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly config: Record<string, any>,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(data: {
    id: string;
    tenantId: string;
    config: Record<string, any>;
  }): TenantConfig {
    return new TenantConfig(
      data.id,
      data.tenantId,
      data.config
    );
  }

  update(config: Record<string, any>): TenantConfig {
    return new TenantConfig(
      this.id,
      this.tenantId,
      { ...this.config, ...config },
      this.isActive,
      this.createdAt,
      new Date()
    );
  }
}
