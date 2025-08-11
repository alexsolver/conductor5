/**
 * Create Material DTO
 * Clean Architecture - Application Layer
 */

export interface CreateMaterialDTO {
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit?: string;
  price?: number;
  cost?: number;
  supplier?: string;
  sku?: string;
  stockQuantity?: number;
  minStock?: number;
  maxStock?: number;
  specifications?: Record<string, any>;
}