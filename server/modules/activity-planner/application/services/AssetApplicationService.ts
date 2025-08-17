/**
 * AssetApplicationService - Serviço de aplicação para gerenciamento de ativos
 * Orquestra operações de negócio relacionadas a ativos
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { AssetEntity, Asset, InsertAsset } from '../../domain/entities/Asset';
import { 
  IAssetRepository, 
  AssetFilters, 
  AssetListOptions, 
  AssetHierarchy 
} from '../../domain/repositories/IAssetRepository';

export class AssetApplicationService {
  constructor(
    private assetRepository: IAssetRepository
  ) {}

  async createAsset(
    tenantId: string, 
    assetData: InsertAsset, 
    createdBy: string
  ): Promise<Asset> {
    console.log('🔧 [AssetApplicationService] Creating asset:', assetData.tag);

    // Verificar se o tag é único no tenant
    const existingAsset = await this.assetRepository.findByTag(tenantId, assetData.tag);
    if (existingAsset) {
      throw new Error(`Asset with tag "${assetData.tag}" already exists`);
    }

    // Validar parent asset se fornecido
    if (assetData.parentAssetId) {
      const parentAsset = await this.assetRepository.findById(tenantId, assetData.parentAssetId);
      if (!parentAsset) {
        throw new Error('Parent asset not found');
      }
    }

    const asset = await this.assetRepository.create(tenantId, {
      ...assetData,
      createdBy
    });

    console.log('✅ [AssetApplicationService] Asset created successfully:', asset.id);
    return asset;
  }

  async getAssets(
    tenantId: string,
    filters: AssetFilters = {},
    options: AssetListOptions = {}
  ): Promise<{
    assets: Asset[];
    total: number;
    page: number;
    limit: number;
  }> {
    console.log('🔍 [AssetApplicationService] Getting assets with filters:', filters);
    
    const result = await this.assetRepository.findMany(tenantId, filters, options);
    
    console.log(`✅ [AssetApplicationService] Found ${result.assets.length} assets`);
    return result;
  }

  async getAssetById(tenantId: string, assetId: string): Promise<Asset | null> {
    console.log('🔍 [AssetApplicationService] Getting asset by ID:', assetId);
    
    const asset = await this.assetRepository.findById(tenantId, assetId);
    
    if (asset) {
      console.log('✅ [AssetApplicationService] Asset found:', asset.tag);
    }
    
    return asset;
  }

  async updateAsset(
    tenantId: string,
    assetId: string,
    updates: Partial<InsertAsset>,
    updatedBy: string
  ): Promise<Asset> {
    console.log('🔧 [AssetApplicationService] Updating asset:', assetId);

    // Verificar se existe
    const existingAsset = await this.assetRepository.findById(tenantId, assetId);
    if (!existingAsset) {
      throw new Error('Asset not found');
    }

    // Se está mudando o tag, verificar unicidade
    if (updates.tag && updates.tag !== existingAsset.tag) {
      const assetWithSameTag = await this.assetRepository.findByTag(tenantId, updates.tag);
      if (assetWithSameTag && assetWithSameTag.id !== assetId) {
        throw new Error(`Asset with tag "${updates.tag}" already exists`);
      }
    }

    // Validar parent asset se fornecido
    if (updates.parentAssetId) {
      const parentAsset = await this.assetRepository.findById(tenantId, updates.parentAssetId);
      if (!parentAsset) {
        throw new Error('Parent asset not found');
      }
      
      // Evitar referência circular
      if (updates.parentAssetId === assetId) {
        throw new Error('Asset cannot be its own parent');
      }
    }

    const updatedAsset = await this.assetRepository.update(
      tenantId, 
      assetId, 
      updates, 
      updatedBy
    );

    console.log('✅ [AssetApplicationService] Asset updated successfully');
    return updatedAsset;
  }

  async deleteAsset(tenantId: string, assetId: string): Promise<void> {
    console.log('🗑️ [AssetApplicationService] Deleting asset:', assetId);

    // Verificar se tem filhos
    const children = await this.assetRepository.findChildren(tenantId, assetId);
    if (children.length > 0) {
      throw new Error('Cannot delete asset with child assets');
    }

    await this.assetRepository.delete(tenantId, assetId);

    console.log('✅ [AssetApplicationService] Asset deleted successfully');
  }

  async deactivateAsset(
    tenantId: string, 
    assetId: string, 
    deletedBy: string
  ): Promise<void> {
    console.log('🗑️ [AssetApplicationService] Deactivating asset:', assetId);

    await this.assetRepository.softDelete(tenantId, assetId, deletedBy);

    console.log('✅ [AssetApplicationService] Asset deactivated successfully');
  }

  async getAssetHierarchy(tenantId: string, assetId: string): Promise<AssetHierarchy> {
    console.log('🔍 [AssetApplicationService] Getting asset hierarchy:', assetId);

    const hierarchy = await this.assetRepository.getHierarchy(tenantId, assetId);

    console.log('✅ [AssetApplicationService] Asset hierarchy obtained');
    return hierarchy;
  }

  async getAssetHierarchyByLocation(
    tenantId: string, 
    locationId: string
  ): Promise<AssetHierarchy[]> {
    console.log('🔍 [AssetApplicationService] Getting asset hierarchy by location:', locationId);

    const hierarchies = await this.assetRepository.getHierarchyByLocation(tenantId, locationId);

    console.log(`✅ [AssetApplicationService] Found ${hierarchies.length} root assets in location`);
    return hierarchies;
  }

  async updateAssetMeter(
    tenantId: string,
    assetId: string,
    meterName: string,
    value: number,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [AssetApplicationService] Updating asset meter:', { assetId, meterName, value });

    // Verificar se o asset existe
    const asset = await this.assetRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    await this.assetRepository.updateMeter(tenantId, assetId, meterName, value, updatedBy);

    console.log('✅ [AssetApplicationService] Asset meter updated successfully');
  }

  async getAssetsNeedingMaintenance(tenantId: string): Promise<Asset[]> {
    console.log('🔍 [AssetApplicationService] Getting assets needing maintenance');

    const assets = await this.assetRepository.findNeedingMaintenance(tenantId);

    console.log(`✅ [AssetApplicationService] Found ${assets.length} assets needing maintenance`);
    return assets;
  }

  async getAssetStatistics(tenantId: string): Promise<{
    total: number;
    byCriticality: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    byStatus: {
      active: number;
      inactive: number;
      maintenance: number;
      decommissioned: number;
    };
    needingMaintenance: number;
  }> {
    console.log('📊 [AssetApplicationService] Getting asset statistics');

    const [
      total,
      byCriticality,
      byStatus,
      needingMaintenanceAssets
    ] = await Promise.all([
      this.assetRepository.count(tenantId),
      this.assetRepository.countByCriticality(tenantId),
      this.assetRepository.countByStatus(tenantId),
      this.assetRepository.findNeedingMaintenance(tenantId)
    ]);

    const stats = {
      total,
      byCriticality,
      byStatus,
      needingMaintenance: needingMaintenanceAssets.length
    };

    console.log('✅ [AssetApplicationService] Asset statistics computed');
    return stats;
  }

  async recordMaintenanceCompletion(
    tenantId: string,
    assetId: string,
    completionDate: Date,
    nextMaintenanceDate?: Date,
    updatedBy?: string
  ): Promise<void> {
    console.log('🔧 [AssetApplicationService] Recording maintenance completion:', assetId);

    // Verificar se o asset existe
    const asset = await this.assetRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    await this.assetRepository.updateMaintenanceStatus(
      tenantId,
      assetId,
      completionDate,
      nextMaintenanceDate,
      updatedBy
    );

    console.log('✅ [AssetApplicationService] Maintenance completion recorded');
  }
}