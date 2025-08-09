
import { Location } from '../entities/Location';

export interface ILocationRepository {
  findById(id: string, tenantId: string): Promise<Location | null>;
  findAll(tenantId: string): Promise<Location[]>;
  findByType(type: string, tenantId: string): Promise<Location[]>;
  findByParentId(parentId: string, tenantId: string): Promise<Location[]>;
  create(location: Location): Promise<Location>;
  update(id: string, location: Partial<Location>, tenantId: string): Promise<Location | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
