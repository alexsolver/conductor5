
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
export interface Channel {
  id: string;
  tenantId: string;
  integrationId?: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  features?: string[];
  description?: string;
  icon?: string;
  lastSync?: Date;
  metrics?: {
    totalMessages: number;
    unreadMessages: number;
    errorRate: number;
    uptime: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Channel {
  static create(data: Partial<Channel> & { id: string; tenantId: string; name: string; type: string }): Channel {
    return {
      id: data.id,
      tenantId: data.tenantId,
      integrationId: data.integrationId,
      name: data.name,
      type: data.type,
      status: data.status || 'inactive',
      config: data.config || {},
      features: data.features || [],
      description: data.description || '',
      icon: data.icon || 'Settings',
      lastSync: data.lastSync || new Date(),
      metrics: data.metrics || {
        totalMessages: 0,
        unreadMessages: 0,
        errorRate: 0,
        uptime: 100
      },
      metadata: data.metadata || {},
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    };
  }
}
