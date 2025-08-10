
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  findByStatus(status: string, tenantId: string): Promise<Material[]>;
}
export interface IMaterialRepository {
  create(material: Material): Promise<Material>;
  findById(id: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  update(id: string, material: Partial<Material>): Promise<Material>;
  delete(id: string): Promise<void>;
}
export interface IMaterialRepository {
  findById(id: string): Promise<Material | null>;
  findAll(): Promise<Material[]>;
  save(material: Material): Promise<void>;
  delete(id: string): Promise<void>;
}
