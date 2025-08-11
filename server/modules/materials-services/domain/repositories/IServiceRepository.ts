/**
 * Service Repository Interface
 * Clean Architecture - Domain Layer
 */

import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  findByCategory(category: string, tenantId: string): Promise<Service[]>;
  findBySkill(skill: string, tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, tenantId: string, data: Partial<Service>): Promise<Service>;
  delete(id: string, tenantId: string): Promise<void>;
}
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findByTenant(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCode(code: string, tenantId: string): Promise<Service | null>;
}
