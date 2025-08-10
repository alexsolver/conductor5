
export interface IScheduleEntityRepository {
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  create(entity: any): Promise<any>;
  update(id: string, entity: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByTenantId(tenantId: string): Promise<any[]>;
  findByUserId(userId: string): Promise<any[]>;
}
