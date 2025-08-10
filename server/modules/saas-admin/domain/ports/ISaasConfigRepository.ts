import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  create(config: SaasConfig): Promise<SaasConfig>;
  findById(id: string): Promise<SaasConfig | null>;
  findByTenant(tenantId: string): Promise<SaasConfig[]>;
  update(id: string, data: Partial<SaasConfig>): Promise<SaasConfig>;
  delete(id: string): Promise<void>;
  findAll(): Promise<SaasConfig[]>;
}