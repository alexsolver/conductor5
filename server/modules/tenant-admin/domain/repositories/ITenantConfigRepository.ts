
import { TenantConfig } from '../entities/TenantConfig';

export interface ITenantConfigRepository {
  findById(id: string, tenantId: string): Promise<TenantConfig | null>;
  findAll(tenantId: string): Promise<TenantConfig[]>;
  create(entity: TenantConfig): Promise<TenantConfig>;
  update(id: string, entity: Partial<TenantConfig>, tenantId: string): Promise<TenantConfig | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByKey(configKey: string, tenantId: string): Promise<TenantConfig | null>;
}
