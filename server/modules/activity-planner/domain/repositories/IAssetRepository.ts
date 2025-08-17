/**
 * IAssetRepository - Interface do repositório de ativos
 * Define contratos para operações de persistência de ativos
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { Asset, InsertAsset } from '../entities/Asset';

export interface AssetFilters {
  locationId?: string;
  parentAssetId?: string;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  tag?: string;
  search?: string;
  needsMaintenance?: boolean;
}

export interface AssetListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'tag' | 'name' | 'criticality' | 'lastMaintenanceDate' | 'nextMaintenanceDate';
  sortOrder?: 'asc' | 'desc';
}

export interface AssetHierarchy {
  asset: Asset;
  children: AssetHierarchy[];
  parent?: Asset;
  depth: number;
}

export interface IAssetRepository {
  create(tenantId: string, asset: InsertAsset): Promise<Asset>;
  
  findById(tenantId: string, id: string): Promise<Asset | null>;
  
  findByTag(tenantId: string, tag: string): Promise<Asset | null>;
  
  findMany(
    tenantId: string, 
    filters?: AssetFilters, 
    options?: AssetListOptions
  ): Promise<{
    assets: Asset[];
    total: number;
    page: number;
    limit: number;
  }>;
  
  findByLocation(
    tenantId: string, 
    locationId: string, 
    includeChildren?: boolean
  ): Promise<Asset[]>;
  
  findChildren(tenantId: string, parentAssetId: string): Promise<Asset[]>;
  
  getHierarchy(tenantId: string, assetId: string): Promise<AssetHierarchy>;
  
  getHierarchyByLocation(tenantId: string, locationId: string): Promise<AssetHierarchy[]>;
  
  findNeedingMaintenance(tenantId: string): Promise<Asset[]>;
  
  updateMeter(
    tenantId: string, 
    assetId: string, 
    meterName: string, 
    value: number,
    updatedBy: string
  ): Promise<void>;
  
  updateMaintenanceStatus(
    tenantId: string, 
    assetId: string, 
    lastMaintenanceDate: Date,
    nextMaintenanceDate?: Date,
    updatedBy?: string
  ): Promise<void>;
  
  update(tenantId: string, id: string, updates: Partial<Asset>, updatedBy: string): Promise<Asset>;
  
  delete(tenantId: string, id: string): Promise<void>;
  
  softDelete(tenantId: string, id: string, deletedBy: string): Promise<void>;
  
  count(tenantId: string, filters?: AssetFilters): Promise<number>;
  
  countByCriticality(tenantId: string): Promise<{
    low: number;
    medium: number;
    high: number;
    critical: number;
  }>;
  
  countByStatus(tenantId: string): Promise<{
    active: number;
    inactive: number;
    maintenance: number;
    decommissioned: number;
  }>;
  
  getMaintenanceMetrics(tenantId: string, assetId: string): Promise<{
    mtbf: number;
    mttr: number;
    reliability: number;
    availability: number;
  }>;
}