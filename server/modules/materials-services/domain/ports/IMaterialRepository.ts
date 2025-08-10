
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCode(code: string, tenantId: string): Promise<Material | null>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  search(query: string, tenantId: string): Promise<Material[]>;
}
