/**
 * Material Repository Interface
 * Clean Architecture - Domain Layer
 */

import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findAll(tenantId: string): Promise<Material[]>;
  findByCategory(category: string, tenantId: string): Promise<Material[]>;
  findBySku(sku: string, tenantId: string): Promise<Material | null>;
  findLowStockItems(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, tenantId: string, data: Partial<Material>): Promise<Material>;
  delete(id: string, tenantId: string): Promise<void>;
  updateStock(id: string, tenantId: string, quantity: number): Promise<Material>;
}
import { Material } from '../entities/Material';

export interface IMaterialRepository {
  findById(id: string, tenantId: string): Promise<Material | null>;
  findByTenant(tenantId: string): Promise<Material[]>;
  create(material: Material): Promise<Material>;
  update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCode(code: string, tenantId: string): Promise<Material | null>;
}
