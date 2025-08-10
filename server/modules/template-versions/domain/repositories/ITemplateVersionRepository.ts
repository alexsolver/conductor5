
export interface ITemplateVersionRepository {
  create(tenantId: string, data: any): Promise<any>;
  findById(tenantId: string, id: string): Promise<any>;
  findAll(tenantId: string): Promise<any[]>;
  update(tenantId: string, id: string, data: any): Promise<any>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
