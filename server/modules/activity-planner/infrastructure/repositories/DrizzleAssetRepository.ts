/**
 * DrizzleAssetRepository - Implementação do repositório de ativos usando Drizzle ORM
 * Persistência de dados de ativos no PostgreSQL
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { eq, and, sql, desc, asc, ilike, isNull, isNotNull, count } from 'drizzle-orm';
import { db } from '../../../../db';
import { Asset, InsertAsset } from '../../domain/entities/Asset';
import { 
  IAssetRepository, 
  AssetFilters, 
  AssetListOptions, 
  AssetHierarchy 
} from '../../domain/repositories/IAssetRepository';
import { assets } from '@shared/schema-activity-planner';

export class DrizzleAssetRepository implements IAssetRepository {
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  private getTenantAssets(tenantId: string) {
    return db.select().from(assets).where(eq(assets.tenantId, tenantId));
  }

  async create(tenantId: string, assetData: InsertAsset): Promise<Asset> {
    console.log('🔧 [DrizzleAssetRepository] Creating asset:', assetData.tag);
    
    const [newAsset] = await db
      .insert(assets)
      .values({
        ...assetData,
        tenantId,
        updatedBy: assetData.createdBy
      })
      .returning();

    console.log('✅ [DrizzleAssetRepository] Asset created:', newAsset.id);
    return newAsset;
  }

  async findById(tenantId: string, id: string): Promise<Asset | null> {
    console.log('🔍 [DrizzleAssetRepository] Finding asset by ID:', id);
    
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.id, id),
        eq(assets.isActive, true)
      ))
      .limit(1);

    return asset || null;
  }

  async findByTag(tenantId: string, tag: string): Promise<Asset | null> {
    console.log('🔍 [DrizzleAssetRepository] Finding asset by tag:', tag);
    
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.tag, tag),
        eq(assets.isActive, true)
      ))
      .limit(1);

    return asset || null;
  }

  async findMany(
    tenantId: string, 
    filters: AssetFilters = {}, 
    options: AssetListOptions = {}
  ): Promise<{
    assets: Asset[];
    total: number;
    page: number;
    limit: number;
  }> {
    console.log('🔍 [DrizzleAssetRepository] Finding assets with filters:', filters);
    
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = options;
    
    let query = db
      .select()
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.isActive, true)
      ));

    // Aplicar filtros
    const conditions = [
      eq(assets.tenantId, tenantId),
      eq(assets.isActive, true)
    ];

    if (filters.locationId) {
      conditions.push(eq(assets.locationId, filters.locationId));
    }

    if (filters.parentAssetId) {
      conditions.push(eq(assets.parentAssetId, filters.parentAssetId));
    }

    if (filters.criticality) {
      conditions.push(eq(assets.criticality, filters.criticality));
    }

    if (filters.status) {
      conditions.push(eq(assets.status, filters.status));
    }

    if (filters.tag) {
      conditions.push(ilike(assets.tag, `%${filters.tag}%`));
    }

    if (filters.search) {
      conditions.push(
        sql`(${assets.name} ILIKE ${'%' + filters.search + '%'} OR ${assets.tag} ILIKE ${'%' + filters.search + '%'})`
      );
    }

    if (filters.needsMaintenance) {
      conditions.push(
        sql`${assets.nextMaintenanceDate} <= NOW()`
      );
    }

    query = db
      .select()
      .from(assets)
      .where(and(...conditions));

    // Aplicar ordenação
    const orderBy = sortOrder === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'tag':
        query = query.orderBy(orderBy(assets.tag));
        break;
      case 'criticality':
        query = query.orderBy(orderBy(assets.criticality));
        break;
      case 'lastMaintenanceDate':
        query = query.orderBy(orderBy(assets.lastMaintenanceDate));
        break;
      case 'nextMaintenanceDate':
        query = query.orderBy(orderBy(assets.nextMaintenanceDate));
        break;
      default:
        query = query.orderBy(orderBy(assets.name));
    }

    // Paginação
    const offset = (page - 1) * limit;
    const paginatedQuery = query.limit(limit).offset(offset);

    // Contar total
    const totalQuery = db
      .select({ count: count() })
      .from(assets)
      .where(and(...conditions));

    const [assetsList, totalResult] = await Promise.all([
      paginatedQuery,
      totalQuery
    ]);

    console.log(`✅ [DrizzleAssetRepository] Found ${assetsList.length} assets`);
    
    return {
      assets: assetsList,
      total: totalResult[0]?.count || 0,
      page,
      limit
    };
  }

  async findByLocation(
    tenantId: string, 
    locationId: string, 
    includeChildren: boolean = false
  ): Promise<Asset[]> {
    console.log('🔍 [DrizzleAssetRepository] Finding assets by location:', locationId);
    
    const assetsList = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.locationId, locationId),
        eq(assets.isActive, true)
      ))
      .orderBy(asc(assets.name));

    return assetsList;
  }

  async findChildren(tenantId: string, parentAssetId: string): Promise<Asset[]> {
    console.log('🔍 [DrizzleAssetRepository] Finding children of asset:', parentAssetId);
    
    const children = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.parentAssetId, parentAssetId),
        eq(assets.isActive, true)
      ))
      .orderBy(asc(assets.name));

    return children;
  }

  async getHierarchy(tenantId: string, assetId: string): Promise<AssetHierarchy> {
    console.log('🔍 [DrizzleAssetRepository] Getting hierarchy for asset:', assetId);
    
    const asset = await this.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    const children = await this.findChildren(tenantId, assetId);
    const childrenHierarchy = await Promise.all(
      children.map((child: Asset) => this.getHierarchy(tenantId, child.id))
    );

    let parent: Asset | undefined;
    if (asset.parentAssetId) {
      parent = await this.findById(tenantId, asset.parentAssetId) || undefined;
    }

    return {
      asset,
      children: childrenHierarchy,
      parent,
      depth: 0 // Será calculado pela aplicação se necessário
    };
  }

  async getHierarchyByLocation(tenantId: string, locationId: string): Promise<AssetHierarchy[]> {
    console.log('🔍 [DrizzleAssetRepository] Getting hierarchy by location:', locationId);
    
    // Pegar apenas os assets raiz (sem parent) da localização
    const rootAssets = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.locationId, locationId),
        isNull(assets.parentAssetId),
        eq(assets.isActive, true)
      ))
      .orderBy(asc(assets.name));

    const hierarchies = await Promise.all(
      rootAssets.map((asset: Asset) => this.getHierarchy(tenantId, asset.id))
    );

    return hierarchies;
  }

  async findNeedingMaintenance(tenantId: string): Promise<Asset[]> {
    console.log('🔍 [DrizzleAssetRepository] Finding assets needing maintenance');
    
    const assetsList = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.isActive, true),
        sql`${assets.nextMaintenanceDate} <= NOW()`
      ))
      .orderBy(asc(assets.nextMaintenanceDate));

    console.log(`✅ [DrizzleAssetRepository] Found ${assetsList.length} assets needing maintenance`);
    return assetsList;
  }

  async updateMeter(
    tenantId: string, 
    assetId: string, 
    meterName: string, 
    value: number,
    updatedBy: string
  ): Promise<void> {
    console.log('🔧 [DrizzleAssetRepository] Updating meter:', { assetId, meterName, value });
    
    const asset = await this.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    const currentMeters = asset.metersJson || {};
    const updatedMeters = {
      ...currentMeters,
      [meterName]: value
    };

    await db
      .update(assets)
      .set({
        metersJson: updatedMeters,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.id, assetId)
      ));

    console.log('✅ [DrizzleAssetRepository] Meter updated successfully');
  }

  async updateMaintenanceStatus(
    tenantId: string, 
    assetId: string, 
    lastMaintenanceDate: Date,
    nextMaintenanceDate?: Date,
    updatedBy?: string
  ): Promise<void> {
    console.log('🔧 [DrizzleAssetRepository] Updating maintenance status:', { assetId, lastMaintenanceDate, nextMaintenanceDate });
    
    const updateData: any = {
      lastMaintenanceDate,
      updatedAt: new Date()
    };

    if (nextMaintenanceDate) {
      updateData.nextMaintenanceDate = nextMaintenanceDate;
    }

    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    await db
      .update(assets)
      .set(updateData)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.id, assetId)
      ));

    console.log('✅ [DrizzleAssetRepository] Maintenance status updated successfully');
  }

  async update(tenantId: string, id: string, updates: Partial<Asset>, updatedBy: string): Promise<Asset> {
    console.log('🔧 [DrizzleAssetRepository] Updating asset:', id);
    
    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...updates,
        updatedAt: new Date(),
        updatedBy
      })
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.id, id)
      ))
      .returning();

    if (!updatedAsset) {
      throw new Error('Asset not found');
    }

    console.log('✅ [DrizzleAssetRepository] Asset updated successfully');
    return updatedAsset;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    console.log('🗑️ [DrizzleAssetRepository] Hard deleting asset:', id);
    
    await db
      .delete(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.id, id)
      ));

    console.log('✅ [DrizzleAssetRepository] Asset deleted successfully');
  }

  async softDelete(tenantId: string, id: string, deletedBy: string): Promise<void> {
    console.log('🗑️ [DrizzleAssetRepository] Soft deleting asset:', id);
    
    await db
      .update(assets)
      .set({
        isActive: false,
        updatedAt: new Date(),
        updatedBy: deletedBy
      })
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.id, id)
      ));

    console.log('✅ [DrizzleAssetRepository] Asset soft deleted successfully');
  }

  async count(tenantId: string, filters: AssetFilters = {}): Promise<number> {
    console.log('🔢 [DrizzleAssetRepository] Counting assets with filters:', filters);
    
    const conditions = [
      eq(assets.tenantId, tenantId),
      eq(assets.isActive, true)
    ];

    if (filters.locationId) {
      conditions.push(eq(assets.locationId, filters.locationId));
    }

    if (filters.criticality) {
      conditions.push(eq(assets.criticality, filters.criticality));
    }

    if (filters.status) {
      conditions.push(eq(assets.status, filters.status));
    }

    const [result] = await db
      .select({ count: count() })
      .from(assets)
      .where(and(...conditions));

    return result?.count || 0;
  }

  async countByCriticality(tenantId: string): Promise<{
    low: number;
    medium: number;
    high: number;
    critical: number;
  }> {
    console.log('🔢 [DrizzleAssetRepository] Counting assets by criticality');
    
    const results = await db
      .select({
        criticality: assets.criticality,
        count: count()
      })
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.isActive, true)
      ))
      .groupBy(assets.criticality);

    const counts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    results.forEach((result: any) => {
      if (result.criticality in counts) {
        counts[result.criticality as keyof typeof counts] = result.count;
      }
    });

    return counts;
  }

  async countByStatus(tenantId: string): Promise<{
    active: number;
    inactive: number;
    maintenance: number;
    decommissioned: number;
  }> {
    console.log('🔢 [DrizzleAssetRepository] Counting assets by status');
    
    const results = await db
      .select({
        status: assets.status,
        count: count()
      })
      .from(assets)
      .where(and(
        eq(assets.tenantId, tenantId),
        eq(assets.isActive, true)
      ))
      .groupBy(assets.status);

    const counts = {
      active: 0,
      inactive: 0,
      maintenance: 0,
      decommissioned: 0
    };

    results.forEach((result: any) => {
      if (result.status in counts) {
        counts[result.status as keyof typeof counts] = result.count;
      }
    });

    return counts;
  }

  async getMaintenanceMetrics(tenantId: string, assetId: string): Promise<{
    mtbf: number;
    mttr: number;
    reliability: number;
    availability: number;
  }> {
    console.log('📊 [DrizzleAssetRepository] Getting maintenance metrics for asset:', assetId);
    
    const asset = await this.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Valores padrão ou calculados
    const mtbf = asset.mtbf || 0;
    const mttr = asset.mttr || 0;
    
    // Cálculos básicos de confiabilidade e disponibilidade
    const reliability = mtbf > 0 ? Math.min(100, (mtbf / (mtbf + mttr)) * 100) : 0;
    const availability = (mtbf + mttr) > 0 ? (mtbf / (mtbf + mttr)) * 100 : 0;

    return {
      mtbf,
      mttr,
      reliability: Math.round(reliability * 100) / 100,
      availability: Math.round(availability * 100) / 100
    };
  }
}