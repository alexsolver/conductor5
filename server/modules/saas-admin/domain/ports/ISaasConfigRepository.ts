
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string): Promise<SaasConfig | null>;
  findAll(): Promise<SaasConfig[]>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>): Promise<SaasConfig | null>;
  delete(id: string): Promise<boolean>;
}
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string, tenantId: string): Promise<SaasConfig | null>;
  findAll(tenantId: string): Promise<SaasConfig[]>;
  findByKey(configKey: string, tenantId: string): Promise<SaasConfig | null>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>, tenantId: string): Promise<SaasConfig | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
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
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string): Promise<SaasConfig | null>;
  findAll(): Promise<SaasConfig[]>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>): Promise<SaasConfig | null>;
  delete(id: string): Promise<boolean>;
  findByKey(key: string): Promise<SaasConfig | null>;
}
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string): Promise<SaasConfig | null>;
  findAll(): Promise<SaasConfig[]>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>): Promise<SaasConfig | null>;
  delete(id: string): Promise<boolean>;
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
import { SaasConfig } from '../entities/SaasConfig';

export interface ISaasConfigRepository {
  findById(id: string): Promise<SaasConfig | null>;
  findAll(): Promise<SaasConfig[]>;
  create(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>): Promise<SaasConfig | null>;
  delete(id: string): Promise<boolean>;
}
export interface ISaasConfigRepository {
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
  create(config: any): Promise<any>;
  update(id: string, config: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  findByTenantId(tenantId: string): Promise<any[]>;
}
