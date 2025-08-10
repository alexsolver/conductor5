
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  findByCategory(category: string, tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<Service[]>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<Service[]>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<Service[]>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<Service[]>;
  search(query: string, tenantId: string): Promise<Service[]>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<Service[]>;
  search(query: string, tenantId: string): Promise<Service[]>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Service[]>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(entity: Service): Promise<Service>;
  update(id: string, entity: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Service[]>;
  findByProvider(providerId: string, tenantId: string): Promise<Service[]>;
}
export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<Service[]>;
  search(query: string, tenantId: string): Promise<Service[]>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string, filters?: any): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Service[]>;
  search(query: string, tenantId: string): Promise<Service[]>;
}
export interface IServiceRepository {
  findById(id: string): Promise<Service | null>;
  findAll(): Promise<Service[]>;
  save(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>): Promise<Service>;
  delete(id: string): Promise<void>;
}
