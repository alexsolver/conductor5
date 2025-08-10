// Domain layer should not import infrastructure dependencies
export * from './Item';
export * from './Supplier';
export * from './Stock';
export * from './Service';

// Entities do módulo materials-services
export interface Material {
  id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  tenantId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  tenantId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stock {
  id: string;
  materialId: string;
  quantity: number;
  location: string;
  tenantId: string;
  lastUpdated: Date;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  tenantId: string;
  active: boolean;
}