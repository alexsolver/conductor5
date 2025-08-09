
export interface SaasConfigurationCreatedEvent {
  type: 'SaasConfigurationCreated';
  aggregateId: string;
  tenantId: string;
  configKey: string;
  timestamp: Date;
}

export interface SaasConfigurationUpdatedEvent {
  type: 'SaasConfigurationUpdated';
  aggregateId: string;
  tenantId: string;
  changes: Record<string, any>;
  timestamp: Date;
}
