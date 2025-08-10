
export interface ISaasAdminRepository {
  findAll(tenantId: string): Promise<any[]>;
  findById(id: string, tenantId: string): Promise<any | null>;
  create(data: any, tenantId: string): Promise<any>;
  update(id: string, data: any, tenantId: string): Promise<any>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
