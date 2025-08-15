
export interface Channel {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'webhook';
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  isEnabled: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ChannelEntity implements Channel {
  constructor(
    public id: string,
    public name: string,
    public type: 'email' | 'whatsapp' | 'telegram' | 'sms' | 'webhook',
    public status: 'active' | 'inactive' | 'error',
    public config: Record<string, any>,
    public isEnabled: boolean,
    public tenantId: string,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  public activate(): void {
    this.isEnabled = true;
    this.status = 'active';
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isEnabled = false;
    this.status = 'inactive';
    this.updatedAt = new Date();
  }

  public updateConfig(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig };
    this.updatedAt = new Date();
  }
}
