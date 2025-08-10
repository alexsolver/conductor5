
export interface ISaasConfigEntityRepository {
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  create(config: any): Promise<any>;
  update(id: string, config: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByTenant(tenantId: string): Promise<any[]>;
}
