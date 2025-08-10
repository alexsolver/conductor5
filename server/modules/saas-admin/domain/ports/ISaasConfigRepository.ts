import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  create(config: SaasConfig): Promise<SaasConfig>;
  findById(id: string): Promise<SaasConfig | null>;
  findByTenant(tenantId: string): Promise<SaasConfig[]>;
  update(id: string, data: Partial<SaasConfig>): Promise<SaasConfig>;
  delete(id: string): Promise<void>;
  findAll(): Promise<SaasConfig[]>;
}
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string, tenantId: string): Promise<SaasConfig | null>;
  findAll(tenantId: string): Promise<SaasConfig[]>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>, tenantId: string): Promise<SaasConfig | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
