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

export class SaasConfig {
  constructor(
    public id: string,
    public tenantId: string,
    public configKey: string,
    public configValue: string,
    public active: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(tenantId: string, key: string, value: string): SaasConfig {
    return new SaasConfig(
      crypto.randomUUID(),
      tenantId,
      key,
      value
    );
  }

  update(value: string): void {
    this.configValue = value;
    this.updatedAt = new Date();
  }
}