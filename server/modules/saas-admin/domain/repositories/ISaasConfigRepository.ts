
export interface ISaasConfigRepository {
  create(config: any): Promise<any>;
  findByTenant(tenantId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}
