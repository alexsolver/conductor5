/**
 * AssetApplicationService - Serviço de aplicação para ativos
 * Orquestra casos de uso e operações de ativos
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { Asset, InsertAsset } from '../../domain/entities/Asset';
import { 
  IAssetRepository, 
  AssetFilters, 
  AssetListOptions, 
  AssetHierarchy 
} from '../../domain/repositories/IAssetRepository';

export interface AssetStatistics {
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
  maintenanceOverdue: number;
}

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
    
    // Validar se tag é única
    const existingAsset = await this.assetRepository.findByTag(tenantId, assetData.tag);
    if (existingAsset) {
      throw new Error('Tag de ativo já existe');
    }

    // Validar parent asset se especificado
    if (assetData.parentAssetId) {
      const parentAsset = await this.assetRepository.findById(tenantId, assetData.parentAssetId);
      if (!parentAsset) {
        throw new Error('Ativo pai não encontrado');
      }
    }

    const asset = await this.assetRepository.create(tenantId, {
      ...assetData,
      createdBy
    });

    console.log('✅ [AssetApplicationService] Asset created successfully:', asset.id);
    return asset;
  }

  async getAssetById(tenantId: string, assetId: string): Promise<Asset | null> {
    console.log('🔍 [AssetApplicationService] Getting asset by ID:', assetId);
    return await this.assetRepository.findById(tenantId, assetId);
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
    return await this.assetRepository.findMany(tenantId, filters, options);
  }

  async getAssetsByLocation(
    tenantId: string, 
    locationId: string, 
    includeChildren: boolean = false
  ): Promise<Asset[]> {
    console.log('🔍 [AssetApplicationService] Getting assets by location:', locationId);
    return await this.assetRepository.findByLocation(tenantId, locationId, includeChildren);
  }

  async getAssetHierarchy(tenantId: string, assetId: string): Promise<AssetHierarchy> {
    console.log('🔍 [AssetApplicationService] Getting asset hierarchy:', assetId);
    return await this.assetRepository.getHierarchy(tenantId, assetId);
  }

  async getAssetHierarchyByLocation(tenantId: string, locationId: string): Promise<AssetHierarchy[]> {
    console.log('🔍 [AssetApplicationService] Getting hierarchy by location:', locationId);
    return await this.assetRepository.getHierarchyByLocation(tenantId, locationId);
  }

  async updateAsset(
    tenantId: string, 
    assetId: string, 
    updates: Partial<InsertAsset>, 
    updatedBy: string
  ): Promise<Asset> {
    console.log('🔧 [AssetApplicationService] Updating asset:', assetId);
    
    // Verificar se asset existe
    const existingAsset = await this.assetRepository.findById(tenantId, assetId);
    if (!existingAsset) {
      throw new Error('Ativo não encontrado');
    }

    // Validar tag única se sendo alterada
    if (updates.tag && updates.tag !== existingAsset.tag) {
      const assetWithTag = await this.assetRepository.findByTag(tenantId, updates.tag);
      if (assetWithTag && assetWithTag.id !== assetId) {
        throw new Error('Tag de ativo já existe');
      }
    }

    // Validar parent asset se sendo alterado
    if (updates.parentAssetId) {
      const parentAsset = await this.assetRepository.findById(tenantId, updates.parentAssetId);
      if (!parentAsset) {
        throw new Error('Ativo pai não encontrado');
      }
      
      // Evitar referência circular
      if (updates.parentAssetId === assetId) {
        throw new Error('Ativo não pode ser pai de si mesmo');
      }
    }

    const updatedAsset = await this.assetRepository.update(tenantId, assetId, updates, updatedBy);
    
    console.log('✅ [AssetApplicationService] Asset updated successfully');
    return updatedAsset;
  }

  async updateAssetMeter(
    tenantId: string, 
    assetId: string, 
    meterName: string, 
    value: number,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [AssetApplicationService] Updating asset meter:', { assetId, meterName, value });
    
    // Verificar se asset existe
    const asset = await this.assetRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Ativo não encontrado');
    }

    await this.assetRepository.updateMeter(tenantId, assetId, meterName, value, updatedBy);
    
    console.log('✅ [AssetApplicationService] Asset meter updated successfully');
  }

  async updateMaintenanceStatus(
    tenantId: string,
    assetId: string,
    lastMaintenanceDate: Date,
    nextMaintenanceDate?: Date,
    updatedBy?: string
  ): Promise<void> {
    console.log('🔧 [AssetApplicationService] Updating maintenance status:', assetId);
    
    await this.assetRepository.updateMaintenanceStatus(
      tenantId, 
      assetId, 
      lastMaintenanceDate, 
      nextMaintenanceDate, 
      updatedBy
    );
    
    console.log('✅ [AssetApplicationService] Maintenance status updated successfully');
  }

  async deactivateAsset(tenantId: string, assetId: string, deletedBy: string): Promise<void> {
    console.log('🗑️ [AssetApplicationService] Deactivating asset:', assetId);
    
    // Verificar se asset existe
    const asset = await this.assetRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Ativo não encontrado');
    }

    // Verificar se tem filhos ativos
    const children = await this.assetRepository.findChildren(tenantId, assetId);
    if (children.length > 0) {
      throw new Error('Não é possível desativar ativo que possui sub-ativos ativos');
    }

    await this.assetRepository.softDelete(tenantId, assetId, deletedBy);
    
    console.log('✅ [AssetApplicationService] Asset deactivated successfully');
  }

  async deleteAsset(tenantId: string, assetId: string): Promise<void> {
    console.log('🗑️ [AssetApplicationService] Deleting asset permanently:', assetId);
    
    // Verificar se asset existe
    const asset = await this.assetRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Ativo não encontrado');
    }

    // Verificar se tem filhos
    const children = await this.assetRepository.findChildren(tenantId, assetId);
    if (children.length > 0) {
      throw new Error('Não é possível excluir ativo que possui sub-ativos');
    }

    await this.assetRepository.delete(tenantId, assetId);
    
    console.log('✅ [AssetApplicationService] Asset deleted permanently');
  }

  async getAssetsNeedingMaintenance(tenantId: string): Promise<Asset[]> {
    console.log('🔍 [AssetApplicationService] Getting assets needing maintenance');
    return await this.assetRepository.findNeedingMaintenance(tenantId);
  }

  async getAssetStatistics(tenantId: string): Promise<AssetStatistics> {
    console.log('📊 [AssetApplicationService] Getting asset statistics');
    
    const [
      total,
      byCriticality,
      byStatus,
      needingMaintenanceList
    ] = await Promise.all([
      this.assetRepository.count(tenantId),
      this.assetRepository.countByCriticality(tenantId),
      this.assetRepository.countByStatus(tenantId),
      this.assetRepository.findNeedingMaintenance(tenantId)
    ]);

    const needingMaintenance = needingMaintenanceList.length;
    
    // Calcular overdue (consideramos overdue se passou mais de 7 dias da data programada)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const maintenanceOverdue = needingMaintenanceList.filter(asset => 
      asset.nextMaintenanceDate && asset.nextMaintenanceDate < sevenDaysAgo
    ).length;

    const statistics: AssetStatistics = {
      total,
      byCriticality,
      byStatus,
      needingMaintenance,
      maintenanceOverdue
    };

    console.log('✅ [AssetApplicationService] Asset statistics calculated:', statistics);
    return statistics;
  }

  async getMaintenanceMetrics(tenantId: string, assetId: string): Promise<{
    mtbf: number;
    mttr: number;
    reliability: number;
    availability: number;
  }> {
    console.log('📊 [AssetApplicationService] Getting maintenance metrics for asset:', assetId);
    
    const metrics = await this.assetRepository.getMaintenanceMetrics(tenantId, assetId);
    
    console.log('✅ [AssetApplicationService] Maintenance metrics obtained:', metrics);
    return metrics;
  }

  async validateAssetHierarchy(tenantId: string, assetId: string, parentAssetId: string): Promise<boolean> {
    console.log('🔍 [AssetApplicationService] Validating asset hierarchy:', { assetId, parentAssetId });
    
    // Não pode ser pai de si mesmo
    if (assetId === parentAssetId) {
      return false;
    }

    // Verificar se não cria referência circular
    let currentParentId: string | null = parentAssetId;
    const visitedIds = new Set<string>();
    
    while (currentParentId && !visitedIds.has(currentParentId)) {
      visitedIds.add(currentParentId);
      
      if (currentParentId === assetId) {
        // Encontrou referência circular
        return false;
      }
      
      const parentAsset = await this.assetRepository.findById(tenantId, currentParentId);
      currentParentId = parentAsset?.parentAssetId || null;
    }

    return true;
  }
}