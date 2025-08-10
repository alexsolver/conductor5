import { db } from '../../../../db';
import { 
  assets, 
  assetMaintenance, 
  assetMeters, 
  assetLocations,
  type Asset,
  type InsertAsset,
  type AssetMaintenance,
  type InsertAssetMaintenance,
  type AssetMeter,
  type InsertAssetMeter
} from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

import { IAssetManagementRepository } from '../../domain/ports/IAssetManagementRepository';

export class AssetManagementRepository implements IAssetManagementRepository {
  // GESTÃO DE ATIVOS
  async getAllAssets(tenantId: string) {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.tenantId, tenantId))
      .orderBy(desc(assets.createdAt));
  }

  async getAssetById(id: string, tenantId: string) {
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
    return asset;
  }

  async createAsset(data: InsertAsset) {
    const [asset] = await db
      .insert(assets)
      .values(data)
      .returning();
    return asset;
  }

  async updateAsset(id: string, tenantId: string, data: Partial<InsertAsset>) {
    const [asset] = await db
      .update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)))
      .returning();
    return asset;
  }

  async deleteAsset(id: string, tenantId: string) {
    await db
      .delete(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
  }

  // HIERARQUIA DE ATIVOS
  async getAssetChildren(parentId: string, tenantId: string) {
    return await db
      .select()
      .from(assets)
      .where(and(eq(assets.parentAssetId, parentId), eq(assets.tenantId, tenantId)))
      .orderBy(asc(assets.name));
  }

  async getAssetHierarchy(tenantId: string) {
    // Buscar todos os assets e construir hierarquia
    const allAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.tenantId, tenantId))
      .orderBy(asc(assets.name));

    // Organizar em estrutura hierárquica
    const assetMap = new Map();
    const rootAssets: any[] = [];

    allAssets.forEach(asset => {
      assetMap.set(asset.id, { ...asset, children: [] });
    });

    allAssets.forEach(asset => {
      if (asset.parentAssetId) {
        const parent = assetMap.get(asset.parentAssetId);
        if (parent) {
          parent.children.push(assetMap.get(asset.id));
        }
      } else {
        rootAssets.push(assetMap.get(asset.id));
      }
    });

    return rootAssets;
  }

  // MANUTENÇÃO DE ATIVOS
  async getAllMaintenance(tenantId: string, assetId?: string) {
    const conditions = [eq(assetMaintenance.tenantId, tenantId)];
    if (assetId) {
      conditions.push(eq(assetMaintenance.assetId, assetId));
    }

    return await db
      .select()
      .from(assetMaintenance)
      .where(and(...conditions))
      .orderBy(desc(assetMaintenance.scheduledDate));
  }

  async createMaintenance(data: InsertAssetMaintenance) {
    const [maintenance] = await db
      .insert(assetMaintenance)
      .values(data)
      .returning();
    return maintenance;
  }

  async updateMaintenance(id: string, tenantId: string, data: Partial<InsertAssetMaintenance>) {
    const [maintenance] = await db
      .update(assetMaintenance)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(assetMaintenance.id, id), eq(assetMaintenance.tenantId, tenantId)))
      .returning();
    return maintenance;
  }

  // MEDIDORES DE ATIVOS
  async getAssetMeters(assetId: string, tenantId: string) {
    return await db
      .select()
      .from(assetMeters)
      .where(and(eq(assetMeters.assetId, assetId), eq(assetMeters.tenantId, tenantId)))
      .orderBy(desc(assetMeters.readingDate));
  }

  async addMeterReading(data: InsertAssetMeter) {
    const [meter] = await db
      .insert(assetMeters)
      .values(data)
      .returning();
    return meter;
  }

  // LOCALIZAÇÃO DE ATIVOS (GEOLOCALIZAÇÃO)
  async updateAssetLocation(assetId: string, tenantId: string, locationData: {
    latitude?: number;
    longitude?: number;
    address?: string;
    locationName?: string;
    recordedBy?: string;
  }) {
    const [location] = await db
      .insert(assetLocations)
      .values({
        assetId,
        tenantId,
        ...locationData,
        recordedAt: new Date()
      })
      .returning();
    return location;
  }

  async getAssetLocation(assetId: string, tenantId: string) {
    const [location] = await db
      .select()
      .from(assetLocations)
      .where(and(
        eq(assetLocations.assetId, assetId), 
        eq(assetLocations.tenantId, tenantId),
        eq(assetLocations.isActive, true)
      ))
      .orderBy(desc(assetLocations.recordedAt))
      .limit(1);
    return location;
  }

  // ESTATÍSTICAS DE ATIVOS
  async getAssetStats(tenantId: string) {
    const allAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.tenantId, tenantId));

    const totalAssets = allAssets.length;
    const activeAssets = allAssets.filter(a => a.status === 'active').length;
    const maintenanceAssets = allAssets.filter(a => a.status === 'maintenance').length;
    const inactiveAssets = allAssets.filter(a => a.status === 'inactive').length;

    // Estatísticas de manutenção
    const maintenanceData = await db
      .select()
      .from(assetMaintenance)
      .where(eq(assetMaintenance.tenantId, tenantId));

    const scheduledMaintenance = maintenanceData.filter(m => m.status === 'scheduled').length;
    const completedMaintenance = maintenanceData.filter(m => m.status === 'completed').length;

    return {
      totalAssets,
      activeAssets,
      maintenanceAssets,
      inactiveAssets,
      scheduledMaintenance,
      completedMaintenance,
      maintenanceCompletionRate: completedMaintenance > 0 ? 
        Math.round((completedMaintenance / (completedMaintenance + scheduledMaintenance)) * 100) : 0
    };
  }

  // QR CODE MANAGEMENT
  async generateQRCode(assetId: string, tenantId: string) {
    // Gerar QR Code único para o ativo
    const qrCode = `ASSET_${tenantId}_${assetId}_${Date.now()}`;
    
    await db
      .update(assets)
      .set({ qrCode, updatedAt: new Date() })
      .where(and(eq(assets.id, assetId), eq(assets.tenantId, tenantId)));
    
    return qrCode;
  }

  async getAssetByQRCode(qrCode: string, tenantId: string) {
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.qrCode, qrCode), eq(assets.tenantId, tenantId)));
    return asset;
  }
}