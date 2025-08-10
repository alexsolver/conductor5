
export interface CreateMaterialDTO {
  name: string;
  code: string;
  description?: string;
  price: number;
  unit: string;
  categoryId?: string;
  tenantId: string;
}

export interface CreateServiceDTO {
  name: string;
  code: string;
  description?: string;
  price: number;
  duration?: number;
  categoryId?: string;
  tenantId: string;
}
