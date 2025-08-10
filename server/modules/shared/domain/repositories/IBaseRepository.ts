
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
  findAll(): Promise<T[]>;
}
export interface IBaseRepository<T> {
  create(tenantId: string, data: Partial<T>): Promise<T>;
  findById(tenantId: string, id: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  update(tenantId: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
