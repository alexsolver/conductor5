/**
 * DrizzleAssetRepository - Implementação CORRIGIDA do repositório de ativos usando Drizzle ORM
 * Solução para schema tenant-specific seguindo 1qa.md
 */

import { sql } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { Asset, InsertAsset } from '../../domain/entities/Asset';
import { 
  IAssetRepository, 
  AssetFilters, 
  AssetListOptions, 
  AssetHierarchy 
} from '../../domain/repositories/IAssetRepository';

export class DrizzleAssetRepository implements IAssetRepository {
  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async create(tenantId: string, assetData: InsertAsset): Promise<Asset> {
    console.log('🔧 [DrizzleAssetRepository] Creating asset:', assetData.tag);
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      INSERT INTO ${sql.identifier(schemaName)}.assets (
        tenant_id, location_id, parent_asset_id, tag, name, model, manufacturer,
        serial_number, criticality, status, meters_json, mtbf, mttr,
        failure_codes_json, specifications, installation_date, warranty_expiry_date,
        last_maintenance_date, next_maintenance_date, is_active, created_by, updated_by
      ) VALUES (
        ${tenantId}, ${assetData.locationId}, ${assetData.parentAssetId}, ${assetData.tag},
        ${assetData.name}, ${assetData.model || null}, ${assetData.manufacturer || null}, 
        ${assetData.serialNumber || null}, ${assetData.criticality}, ${assetData.status}, 
        ${JSON.stringify(assetData.metersJson) || null}, ${assetData.mtbf || null}, 
        ${assetData.mttr || null}, ${JSON.stringify(assetData.failureCodesJson) || null},
        ${JSON.stringify(assetData.specifications) || null}, ${assetData.installationDate || null},
        ${assetData.warrantyExpiryDate || null}, ${assetData.lastMaintenanceDate || null},
        ${assetData.nextMaintenanceDate || null}, ${assetData.isActive ?? true},
        ${assetData.createdBy}, ${assetData.createdBy}
      ) RETURNING *
    `) as any;

    const newAsset = result.rows[0];
    console.log('✅ [DrizzleAssetRepository] Asset created:', newAsset.id);
    return newAsset;
  }

  async findById(tenantId: string, id: string): Promise<Asset | null> {
    console.log('🔍 [DrizzleAssetRepository] Finding asset by ID:', id);
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.assets 
      WHERE tenant_id = ${tenantId} AND id = ${id} AND is_active = true 
      LIMIT 1
    `) as any;
    
    const asset = result.rows?.[0] || null;
    return asset;
  }

  async findMany(
    tenantId: string, 
    filters: AssetFilters = {}, 
    options: AssetListOptions = {}
  ): Promise<{ assets: Asset[], total: number, page: number, limit: number }> {
    console.log('🔍 [DrizzleAssetRepository] Finding assets with filters:', filters);
    
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const schemaName = this.getSchemaName(tenantId);
    
    // Query base
    let whereClause = `WHERE tenant_id = '${tenantId}' AND is_active = true`;
    let orderClause = `ORDER BY created_at DESC`;
    
    // Aplicar filtros
    if (filters.locationId) {
      whereClause += ` AND location_id = '${filters.locationId}'`;
    }
    
    if (filters.criticality) {
      whereClause += ` AND criticality = '${filters.criticality}'`;
    }
    
    if (filters.status) {
      whereClause += ` AND status = '${filters.status}'`;
    }
    
    if (filters.search) {
      whereClause += ` AND (name ILIKE '%${filters.search}%' OR tag ILIKE '%${filters.search}%')`;
    }
    
    if (filters.needsMaintenance) {
      whereClause += ` AND next_maintenance_date <= NOW()`;
    }
    
    // Aplicar ordenação
    if (sortBy && sortOrder) {
      orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    }
    
    const offset = (page - 1) * limit;
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.assets 
      WHERE tenant_id = ${tenantId} AND is_active = true
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as any;
    
    const countResult = await tenantDb.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(schemaName)}.assets 
      WHERE tenant_id = ${tenantId} AND is_active = true
    `) as any;
    
    const assetsList = result.rows || [];
    const total = parseInt(countResult.rows?.[0]?.count || '0');
    
    console.log(`✅ [DrizzleAssetRepository] Found ${assetsList.length} assets`);
    
    return {
      assets: assetsList,
      total,
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
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.assets 
      WHERE tenant_id = ${tenantId} AND location_id = ${locationId} AND is_active = true
      ORDER BY name ASC
    `) as any;

    return result.rows || [];
  }

  async findChildren(tenantId: string, parentAssetId: string): Promise<Asset[]> {
    console.log('🔍 [DrizzleAssetRepository] Finding children assets');
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.assets 
      WHERE tenant_id = ${tenantId} AND parent_asset_id = ${parentAssetId} AND is_active = true
      ORDER BY name ASC
    `) as any;

    return result.rows || [];
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
      depth: 0
    };
  }

  async getHierarchyByLocation(tenantId: string, locationId: string): Promise<AssetHierarchy[]> {
    console.log('🔍 [DrizzleAssetRepository] Getting hierarchy by location:', locationId);
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.assets 
      WHERE tenant_id = ${tenantId} AND location_id = ${locationId} 
      AND parent_asset_id IS NULL AND is_active = true
      ORDER BY name ASC
    `) as any;

    const rootAssets = result.rows || [];
    const hierarchies = await Promise.all(
      rootAssets.map((asset: Asset) => this.getHierarchy(tenantId, asset.id))
    );

    return hierarchies;
  }

  async findNeedingMaintenance(tenantId: string): Promise<Asset[]> {
    console.log('🔍 [DrizzleAssetRepository] Finding assets needing maintenance');
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.assets 
      WHERE tenant_id = ${tenantId} AND is_active = true
      AND next_maintenance_date <= NOW()
      ORDER BY next_maintenance_date ASC
    `) as any;

    const assetsList = result.rows || [];
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
    console.log('🔧 [DrizzleAssetRepository] Updating meter for asset:', assetId);
    
    const asset = await this.findById(tenantId, assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    const meters = asset.metersJson || {};
    meters[meterName] = { value, timestamp: new Date().toISOString() };

    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    await tenantDb.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.assets 
      SET meters_json = ${JSON.stringify(meters)}, updated_by = ${updatedBy}, updated_at = NOW()
      WHERE tenant_id = ${tenantId} AND id = ${assetId}
    `);

    console.log('✅ [DrizzleAssetRepository] Meter updated successfully');
  }

  async update(tenantId: string, id: string, updateData: Partial<InsertAsset>, updatedBy: string): Promise<Asset> {
    console.log('🔧 [DrizzleAssetRepository] Updating asset:', id);
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.assets 
      SET name = ${updateData.name || null}, updated_by = ${updatedBy}, updated_at = NOW()
      WHERE tenant_id = ${tenantId} AND id = ${id}
      RETURNING *
    `) as any;

    const updatedAsset = result.rows[0];
    console.log('✅ [DrizzleAssetRepository] Asset updated:', updatedAsset.id);
    return updatedAsset;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    console.log('🗑️ [DrizzleAssetRepository] Soft deleting asset:', id);
    
    const schemaName = this.getSchemaName(tenantId);
    const tenantDb = await this.getTenantDb(tenantId);
    await tenantDb.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.assets 
      SET is_active = false, updated_at = NOW()
      WHERE tenant_id = ${tenantId} AND id = ${id}
    `);

    console.log('✅ [DrizzleAssetRepository] Asset soft deleted');
  }
}