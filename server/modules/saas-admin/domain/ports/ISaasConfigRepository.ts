
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string): Promise<SaasConfig | null>;
  findAll(): Promise<SaasConfig[]>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>): Promise<SaasConfig | null>;
  delete(id: string): Promise<boolean>;
}
