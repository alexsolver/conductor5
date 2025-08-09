
export interface TenantConfigCreatedEvent {
  id: string;
  tenantConfigId: string;
  tenantId: string;
  config: any;
  createdAt: Date;
  eventType: 'TenantConfigCreated';
}
