
export interface ISaasAdminRepository {
  findAll(tenantId: string): Promise<any[]>;
  findById(id: string, tenantId: string): Promise<any | null>;
  create(data: any, tenantId: string): Promise<any>;
  update(id: string, data: any, tenantId: string): Promise<any>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
export interface ISaasAdminRepository {
  findById(id: string): Promise<SaasConfig | null>;
  findAll(): Promise<SaasConfig[]>;
  save(config: SaasConfig): Promise<SaasConfig>;
  update(id: string, config: Partial<SaasConfig>): Promise<SaasConfig>;
  delete(id: string): Promise<void>;
}
export interface ISaasAdminRepository {
  createConfig(config: any): Promise<any>;
  findConfig(key: string): Promise<any | null>;
  updateConfig(key: string, value: any): Promise<any>;
  deleteConfig(key: string): Promise<void>;
  getAllConfigs(): Promise<any[]>;
}
