// Domain entities for Materials and Services module

export interface Item {
  id: string;
  tenantId: string;
  active: boolean;
  type: string;
  name: string;
  integrationCode?: string;
  description?: string;
  measurementUnit?: string;
  maintenancePlan?: string;
  groupName?: string;
  defaultChecklist?: any;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ItemAttachment {
  id: string;
  tenantId: string;
  itemId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  description?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface ItemLink {
  id: string;
  tenantId: string;
  parentItemId: string;
  linkedItemId?: string;
  linkedCustomerId?: string;
  linkedSupplierId?: string;
  linkType: 'item_item' | 'item_customer' | 'item_supplier';
  relationship?: string;
  customerAlias?: string;
  customerSku?: string;
  customerBarcode?: string;
  customerQrCode?: string;
  isAsset?: boolean;
  supplierPartNumber?: string;
  supplierDescription?: string;
  supplierQrCode?: string;
  supplierBarcode?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  active: boolean;
  name: string;
  tradeName?: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  website?: string;
  contactPerson?: string;
  paymentTerms?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface SupplierCatalog {
  id: string;
  tenantId: string;
  supplierId: string;
  itemId: string;
  supplierItemCode?: string;
  supplierDescription?: string;
  unitPrice?: number;
  currency?: string;
  leadTime?: number;
  minimumOrderQuantity?: number;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}