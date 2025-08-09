
export interface TenantConfigUpdatedEvent {
  id: string;
  tenantConfigId: string;
  tenantId: string;
  config: any;
  updatedAt: Date;
  eventType: 'TenantConfigUpdated';
}
