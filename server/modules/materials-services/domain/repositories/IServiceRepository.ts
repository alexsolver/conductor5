
import { Service } from '../entities/Service';

export interface IServiceRepository {
  findById(id: string, tenantId: string): Promise<Service | null>;
  findAll(tenantId: string): Promise<Service[]>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Service[]>;
  findByStatus(status: string, tenantId: string): Promise<Service[]>;
}
