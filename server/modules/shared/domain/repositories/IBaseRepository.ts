// Domain layer não deve importar ORM diretamente
// Removed drizzle import - domain layer should not depend on infrastructure
export interface IBaseRepository<T> {
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>, tenantId: string): Promise<T | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
export interface IBaseRepository<T> {
  create(tenantId: string, data: Partial<T>): Promise<T>;
  findById(tenantId: string, id: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  update(tenantId: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface IRepository<T> extends IBaseRepository<T> {
  findByTenantId(tenantId: string): Promise<T[]>;
  findByTenantIdAndId(tenantId: string, id: string): Promise<T | null>;
}
export interface IBaseRepository<T> {
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>, tenantId: string): Promise<T | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  count(tenantId: string): Promise<number>;
  exists(id: string, tenantId: string): Promise<boolean>;
}
