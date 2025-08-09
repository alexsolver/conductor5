
import { TenantConfigCreatedEvent, TenantConfigUpdatedEvent } from '../events';

export class TenantConfigDomainService {
  validateConfig(config: any): boolean {
    // Domain validation logic
    return config && typeof config === 'object';
  }

  createTenantConfigEvent(tenantConfigId: string, tenantId: string, config: any): TenantConfigCreatedEvent {
    return {
      id: crypto.randomUUID(),
      tenantConfigId,
      tenantId,
      config,
      createdAt: new Date(),
      eventType: 'TenantConfigCreated'
    };
  }

  updateTenantConfigEvent(tenantConfigId: string, tenantId: string, config: any): TenantConfigUpdatedEvent {
    return {
      id: crypto.randomUUID(),
      tenantConfigId,
      tenantId,
      config,
      updatedAt: new Date(),
      eventType: 'TenantConfigUpdated'
    };
  }
}
