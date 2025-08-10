
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
