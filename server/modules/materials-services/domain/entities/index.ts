// Domain entities for Materials and Services module

// Removidos imports de infrastructure - Domain deve ser independente

// Domain entities should not depend on ORM libraries

export interface Item {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  unitPrice: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewItem {
  tenantId: string;
  name: string;
  description?: string;
  unitPrice: number;
  category: string;
  isActive?: boolean;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactInfo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSupplier {
  tenantId: string;
  name: string;
  contactInfo?: string;
  isActive?: boolean;
}

export interface SupplierItem {
  id: string;
  supplierId: string;
  itemId: string;
  supplierPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSupplierItem {
  supplierId: string;
  itemId: string;
  supplierPrice: number;
  isActive?: boolean;
}

export interface Stock {
  id: string;
  tenantId: string;
  itemId: string;
  quantity: number;
  minQuantity: number;
  location?: string;
  updatedAt: Date;
}

export interface NewStock {
  tenantId: string;
  itemId: string;
  quantity: number;
  minQuantity: number;
  location?: string;
}

export interface AssetManagement {
  id: string;
  tenantId: string;
  itemId: string;
  assetTag: string;
  status: string;
  location?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewAssetManagement {
  tenantId: string;
  itemId: string;
  assetTag: string;
  status: string;
  location?: string;
  assignedTo?: string;
}

export interface Compliance {
  id: string;
  tenantId: string;
  itemId: string;
  complianceType: string;
  status: string;
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCompliance {
  tenantId: string;
  itemId: string;
  complianceType: string;
  status: string;
  validUntil?: Date;
  notes?: string;
}

export interface CustomerItemMapping {
  id: string;
  tenantId: string;
  customerId: string;
  itemId: string;
  customerSpecificName?: string;
  customerSpecificPrice?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCustomerItemMapping {
  tenantId: string;
  customerId: string;
  itemId: string;
  customerSpecificName?: string;
  customerSpecificPrice?: number;
  isActive?: boolean;
}

export interface ItemHierarchy {
  id: string;
  tenantId: string;
  parentItemId?: string;
  childItemId: string;
  hierarchyType: string;
  createdAt: Date;
}

export interface NewItemHierarchy {
  tenantId: string;
  parentItemId?: string;
  childItemId: string;
  hierarchyType: string;
}

export interface ItemGroup {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewItemGroup {
  tenantId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface TicketMaterial {
  id: string;
  tenantId: string;
  ticketId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTicketMaterial {
  tenantId: string;
  ticketId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

export interface LPU {
  id: string;
  tenantId: string;
  itemId: string;
  basePrice: number;
  margin: number;
  finalPrice: number;
  validFrom: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewLPU {
  tenantId: string;
  itemId: string;
  basePrice: number;
  margin: number;
  finalPrice: number;
  validFrom: Date;
  validUntil?: Date;
}