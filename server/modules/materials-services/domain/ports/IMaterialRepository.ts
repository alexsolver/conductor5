
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
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  search(query: string, tenantId: string): Promise<Material[]>;
}
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
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  findBySupplier(supplierId: string, tenantId: string): Promise<Material[]>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(entity: Material): Promise<Material>;
  update(id: string, entity: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  findBySupplier(supplierId: string, tenantId: string): Promise<Material[]>;
}
export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  search(query: string, tenantId: string): Promise<Material[]>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string, filters?: any): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  search(query: string, tenantId: string): Promise<Material[]>;
}
export interface IMaterialRepository {
  findById(id: string): Promise<Material | null>;
  findAll(): Promise<Material[]>;
  save(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>): Promise<Material>;
  delete(id: string): Promise<void>;
}
export interface IMaterialRepository {
  create(material: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(tenantId: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}
export interface IMaterialRepository {
  create(material: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(tenantId: string): Promise<any[]>;
  update(id: string, material: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByTenantId(tenantId: string): Promise<any[]>;
}
