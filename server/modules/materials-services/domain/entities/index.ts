// Domain entities for Materials and Services module

export interface Item {
  id: string;
  tenantId: string;
  active: boolean;
  type: 'material' | 'service' | 'asset';
  name: string;
  integrationCode?: string;
  description?: string;
  measurementUnit: string;
  maintenancePlan?: string;
  category?: string;
  defaultChecklist?: any;
  status: 'active' | 'under_review' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  tradeName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  performanceRating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  parentAssetId?: string;
  assetLevel?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'disposed';
  currentLocationId?: string;
  coordinates?: any;
  acquisitionDate?: Date;
  acquisitionCost?: number;
  warrantyExpiry?: Date;
  hourMeter?: number;
  kilometerMeter?: number;
  usageTime?: number;
  qrCode?: string;
  rfidTag?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface StockLevel {
  id: string;
  tenantId: string;
  itemId: string;
  locationId: string;
  currentStock: number;
  minimumLevel: number;
  maximumLevel: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export interface PriceList {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  version: string;
  customerId?: string;
  contractId?: string;
  costCenterId?: string;
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
  currency: string;
  automaticMargin?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}