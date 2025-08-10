
export interface ISaasConfigRepository {
  create(config: any): Promise<any>;
  findByTenant(tenantId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string): Promise<SaasConfig | null>;
  findAll(): Promise<SaasConfig[]>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>): Promise<SaasConfig | null>;
  delete(id: string): Promise<boolean>;
  findByKey(key: string): Promise<SaasConfig | null>;
}
