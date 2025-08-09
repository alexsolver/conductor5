
import { SaasConfiguration } from '../entities';

export interface ISaasConfigurationRepository {
  findById(id: string): Promise<SaasConfiguration | null>;
  findByTenant(tenantId: string): Promise<SaasConfiguration[]>;
  create(config: Omit<SaasConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<SaasConfiguration>;
  update(id: string, config: Partial<SaasConfiguration>): Promise<SaasConfiguration>;
  delete(id: string): Promise<void>;
}
export { ISaasConfigRepository } from './ISaasConfigRepository';
