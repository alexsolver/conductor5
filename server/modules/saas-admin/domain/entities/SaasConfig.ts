export interface SaasConfig {
  id: string;
  tenantId: string;
  configKey: string;
  configValue: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SaasConfig extends BaseEntity {
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
export class SaasConfig {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly configKey: string,
    public readonly configValue: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(tenantId: string, configKey: string, configValue: string): SaasConfig {
    return new SaasConfig(
      crypto.randomUUID(),
      tenantId,
      configKey,
      configValue
    );
  }

  update(configValue: string): SaasConfig {
    return new SaasConfig(
      this.id,
      this.tenantId,
      this.configKey,
      configValue,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  deactivate(): SaasConfig {
    return new SaasConfig(
      this.id,
      this.tenantId,
      this.configKey,
      this.configValue,
      false,
      this.createdAt,
      new Date()
    );
  }
}
