export interface ISaasAdminRepository {
  createConfig(config: any): Promise<any>;
  getConfig(tenantId: string): Promise<any>;
  updateConfig(id: string, data: any): Promise<any>;
  deleteConfig(id: string): Promise<void>;
}