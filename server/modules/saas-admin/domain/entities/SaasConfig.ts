// Removida dependência do drizzle-orm - violação de Clean Architecture
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
export interface SaasConfigProps {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SaasConfig {
  private constructor(
    public readonly id: string,
    public readonly key: string,
    public readonly value: string,
    public readonly type: 'string' | 'number' | 'boolean' | 'json',
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(props: Omit<SaasConfigProps, 'id' | 'createdAt' | 'updatedAt'>): SaasConfig {
    return new SaasConfig(
      crypto.randomUUID(),
      props.key,
      props.value,
      props.type,
      props.isActive ?? true
    );
  }

  static reconstruct(props: SaasConfigProps): SaasConfig {
    return new SaasConfig(
      props.id,
      props.key,
      props.value,
      props.type,
      props.isActive ?? true,
      props.createdAt,
      props.updatedAt
    );
  }

  updateValue(newValue: string): SaasConfig {
    return new SaasConfig(
      this.id,
      this.key,
      newValue,
      this.type,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }
}