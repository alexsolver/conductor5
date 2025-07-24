import { db } from '../../../../db';
import { eq, and, desc, sql, like, ilike, or } from 'drizzle-orm';
import { 
  items, 
  itemAttachments,
  itemLinks,
  itemCustomerLinks,
  suppliers,
  itemSupplierLinks,
  stockLocations,
  stockLevels,
  stockMovements,
  stockReservations,
  serviceKits,
  serviceKitItems,
  priceLists,
  priceListItems,
  assets,
  assetMovements,
  assetMaintenanceHistory,
  type Item,
  type ItemAttachment,
  type ItemLink,
  type ItemCustomerLink,
  type Supplier,
  type ItemSupplierLink,
  type StockLocation,
  type StockMovement,
  type StockReservation,
  type ServiceKit,
  type PriceList,
  type Asset
} from '@shared/schema-parts-services-complete';

export class CompletePartsServicesRepository {
  
  // ==============================================
  // ITEMS - FUNCIONALIDADES COMPLETAS
  // ==============================================
  
  async getAllItems(tenantId: string, filters?: {
    search?: string;
    type?: string;
    category?: string;
    isActive?: boolean;
  }) {
    let query = db.select().from(items).where(eq(items.tenantId, tenantId));
    
    if (filters?.search) {
      const searchQuery = and(
        eq(items.tenantId, tenantId),
        or(
          ilike(items.name, `%${filters.search}%`),
          ilike(items.integrationCode, `%${filters.search}%`),
          ilike(items.description, `%${filters.search}%`)
        )
      );
      query = db.select().from(items).where(searchQuery);
    }
    
    if (filters?.type) {
      query = query.where(eq(items.type, filters.type));
    }
    
    if (filters?.category) {
      query = query.where(eq(items.group, filters.category));
    }
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(items.active, filters.isActive));
    }
    
    return await query.orderBy(desc(items.createdAt));
  }
  
  async createItem(tenantId: string, itemData: any): Promise<Item> {
    const newItem = await db.insert(items).values({
      ...itemData,
      tenantId,
    }).returning();
    
    return newItem[0];
  }
  
  async updateItem(itemId: string, tenantId: string, itemData: any): Promise<Item | null> {
    const updatedItem = await db
      .update(items)
      .set({ ...itemData, updatedAt: new Date() })
      .where(and(eq(items.id, itemId), eq(items.tenantId, tenantId)))
      .returning();
    
    return updatedItem[0] || null;
  }
  
  async deleteItem(itemId: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(items)
      .where(and(eq(items.id, itemId), eq(items.tenantId, tenantId)))
      .returning();
    
    return result.length > 0;
  }
  
  // ==============================================
  // ANEXOS DE ITENS
  // ==============================================
  
  async addItemAttachment(itemId: string, attachmentData: any): Promise<ItemAttachment> {
    const newAttachment = await db.insert(itemAttachments).values({
      itemId,
      ...attachmentData,
    }).returning();
    
    return newAttachment[0];
  }
  
  async getItemAttachments(itemId: string): Promise<ItemAttachment[]> {
    return await db.select().from(itemAttachments)
      .where(eq(itemAttachments.itemId, itemId))
      .orderBy(desc(itemAttachments.uploadedAt));
  }
  
  async deleteItemAttachment(attachmentId: string): Promise<boolean> {
    const result = await db.delete(itemAttachments)
      .where(eq(itemAttachments.id, attachmentId))
      .returning();
    
    return result.length > 0;
  }
  
  // ==============================================
  // VÍNCULOS ENTRE ITENS
  // ==============================================
  
  async createItemLink(parentItemId: string, childItemId: string, linkData: any): Promise<ItemLink> {
    const newLink = await db.insert(itemLinks).values({
      parentItemId,
      childItemId,
      ...linkData,
    }).returning();
    
    return newLink[0];
  }
  
  async getItemLinks(itemId: string): Promise<any[]> {
    // Links onde o item é pai
    const parentLinks = await db.select({
      id: itemLinks.id,
      type: itemLinks.linkType,
      quantity: itemLinks.quantity,
      direction: sql<string>`'parent'`,
      linkedItem: {
        id: items.id,
        name: items.name,
        code: items.code,
        type: items.type,
      }
    })
    .from(itemLinks)
    .innerJoin(items, eq(itemLinks.childItemId, items.id))
    .where(eq(itemLinks.parentItemId, itemId));
    
    // Links onde o item é filho
    const childLinks = await db.select({
      id: itemLinks.id,
      type: itemLinks.linkType,
      quantity: itemLinks.quantity,
      direction: sql<string>`'child'`,
      linkedItem: {
        id: items.id,
        name: items.name,
        code: items.code,
        type: items.type,
      }
    })
    .from(itemLinks)
    .innerJoin(items, eq(itemLinks.parentItemId, items.id))
    .where(eq(itemLinks.childItemId, itemId));
    
    return [...parentLinks, ...childLinks];
  }
  
  async deleteItemLink(linkId: string): Promise<boolean> {
    const result = await db.delete(itemLinks)
      .where(eq(itemLinks.id, linkId))
      .returning();
    
    return result.length > 0;
  }
  
  // ==============================================
  // VÍNCULOS COM CLIENTES
  // ==============================================
  
  async createItemCustomerLink(itemId: string, customerId: string, linkData: any): Promise<ItemCustomerLink> {
    const newLink = await db.insert(itemCustomerLinks).values({
      itemId,
      customerId,
      ...linkData,
    }).returning();
    
    return newLink[0];
  }
  
  async getItemCustomerLinks(itemId: string): Promise<ItemCustomerLink[]> {
    return await db.select().from(itemCustomerLinks)
      .where(eq(itemCustomerLinks.itemId, itemId))
      .orderBy(desc(itemCustomerLinks.createdAt));
  }
  
  async updateItemCustomerLink(linkId: string, linkData: any): Promise<ItemCustomerLink | null> {
    const updatedLink = await db
      .update(itemCustomerLinks)
      .set({ ...linkData, updatedAt: new Date() })
      .where(eq(itemCustomerLinks.id, linkId))
      .returning();
    
    return updatedLink[0] || null;
  }
  
  async deleteItemCustomerLink(linkId: string): Promise<boolean> {
    const result = await db.delete(itemCustomerLinks)
      .where(eq(itemCustomerLinks.id, linkId))
      .returning();
    
    return result.length > 0;
  }
  
  // ==============================================
  // VÍNCULOS COM FORNECEDORES
  // ==============================================
  
  async createItemSupplierLink(itemId: string, supplierId: string, linkData: any): Promise<ItemSupplierLink> {
    const newLink = await db.insert(itemSupplierLinks).values({
      itemId,
      supplierId,
      ...linkData,
    }).returning();
    
    return newLink[0];
  }
  
  async getItemSupplierLinks(itemId: string): Promise<any[]> {
    return await db.select({
      id: itemSupplierLinks.id,
      partNumber: itemSupplierLinks.partNumber,
      supplierDescription: itemSupplierLinks.supplierDescription,
      supplierQrCode: itemSupplierLinks.supplierQrCode,
      supplierBarcode: itemSupplierLinks.supplierBarcode,
      leadTimeDays: itemSupplierLinks.leadTimeDays,
      minimumOrderQty: itemSupplierLinks.minimumOrderQty,
      supplier: {
        id: suppliers.id,
        name: suppliers.name,
        code: suppliers.code,
        email: suppliers.email,
        phone: suppliers.phone,
      }
    })
    .from(itemSupplierLinks)
    .innerJoin(suppliers, eq(itemSupplierLinks.supplierId, suppliers.id))
    .where(eq(itemSupplierLinks.itemId, itemId))
    .orderBy(desc(itemSupplierLinks.createdAt));
  }
  
  // ==============================================
  // CONTROLE DE ESTOQUE AVANÇADO
  // ==============================================
  
  async getAllStockLocations(tenantId: string): Promise<StockLocation[]> {
    return await db.select().from(stockLocations)
      .where(eq(stockLocations.tenantId, tenantId))
      .orderBy(stockLocations.name);
  }
  
  async createStockLocation(tenantId: string, locationData: any): Promise<StockLocation> {
    const newLocation = await db.insert(stockLocations).values({
      ...locationData,
      tenantId,
    }).returning();
    
    return newLocation[0];
  }
  
  async getStockLevels(tenantId: string, filters?: {
    locationId?: string;
    itemId?: string;
    lowStock?: boolean;
  }): Promise<any[]> {
    let query = db.select({
      id: stockLevels.id,
      currentQuantity: stockLevels.currentQuantity,
      minimumQuantity: stockLevels.minimumQuantity,
      maximumQuantity: stockLevels.maximumQuantity,
      reorderPoint: stockLevels.reorderPoint,
      economicOrderQuantity: stockLevels.economicOrderQuantity,
      lastUpdated: stockLevels.lastUpdated,
      item: {
        id: items.id,
        name: items.name,
        code: items.code,
        type: items.type,
        unitOfMeasure: items.unitOfMeasure,
      },
      location: {
        id: stockLocations.id,
        name: stockLocations.name,
        code: stockLocations.code,
        type: stockLocations.type,
      }
    })
    .from(stockLevels)
    .innerJoin(items, eq(stockLevels.itemId, items.id))
    .innerJoin(stockLocations, eq(stockLevels.locationId, stockLocations.id))
    .where(eq(items.tenantId, tenantId));
    
    if (filters?.locationId) {
      query = query.where(eq(stockLevels.locationId, filters.locationId));
    }
    
    if (filters?.itemId) {
      query = query.where(eq(stockLevels.itemId, filters.itemId));
    }
    
    if (filters?.lowStock) {
      query = query.where(sql`${stockLevels.currentQuantity} <= ${stockLevels.minimumQuantity}`);
    }
    
    return await query.orderBy(items.name);
  }
  
  async createStockMovement(tenantId: string, movementData: any): Promise<StockMovement> {
    return await db.transaction(async (tx) => {
      // Criar movimento
      const movement = await tx.insert(stockMovements).values({
        ...movementData,
        tenantId,
      }).returning();
      
      // Atualizar nível de estoque
      await this.updateStockLevel(tx, movementData.itemId, movementData.locationId, movementData.quantity, movementData.movementType);
      
      return movement[0];
    });
  }
  
  private async updateStockLevel(tx: any, itemId: string, locationId: string, quantity: number, movementType: string) {
    const currentLevel = await tx.select().from(stockLevels)
      .where(and(eq(stockLevels.itemId, itemId), eq(stockLevels.locationId, locationId)))
      .limit(1);
    
    let newQuantity = 0;
    if (currentLevel.length > 0) {
      const current = Number(currentLevel[0].currentQuantity) || 0;
      switch (movementType) {
        case 'in':
        case 'return':
          newQuantity = current + quantity;
          break;
        case 'out':
          newQuantity = Math.max(0, current - quantity);
          break;
        case 'adjustment':
          newQuantity = quantity;
          break;
        default:
          newQuantity = current;
      }
      
      await tx.update(stockLevels)
        .set({ 
          currentQuantity: newQuantity.toString(), 
          lastUpdated: new Date() 
        })
        .where(and(eq(stockLevels.itemId, itemId), eq(stockLevels.locationId, locationId)));
    } else {
      // Criar novo nível se não existir
      await tx.insert(stockLevels).values({
        itemId,
        locationId,
        currentQuantity: movementType === 'in' ? quantity.toString() : '0',
        minimumQuantity: '0',
        maximumQuantity: '0',
        reorderPoint: '0',
        economicOrderQuantity: '0',
        lastUpdated: new Date(),
      });
    }
  }
  
  async getStockMovements(tenantId: string, filters?: {
    itemId?: string;
    locationId?: string;
    movementType?: string;
    limit?: number;
  }): Promise<any[]> {
    let query = db.select({
      id: stockMovements.id,
      movementType: stockMovements.movementType,
      quantity: stockMovements.quantity,
      unitCost: stockMovements.unitCost,
      totalCost: stockMovements.totalCost,
      reference: stockMovements.reference,
      referenceType: stockMovements.referenceType,
      notes: stockMovements.notes,
      createdAt: stockMovements.createdAt,
      item: {
        id: items.id,
        name: items.name,
        code: items.code,
      },
      location: {
        id: stockLocations.id,
        name: stockLocations.name,
        code: stockLocations.code,
      }
    })
    .from(stockMovements)
    .innerJoin(items, eq(stockMovements.itemId, items.id))
    .innerJoin(stockLocations, eq(stockMovements.locationId, stockLocations.id))
    .where(eq(stockMovements.tenantId, tenantId));
    
    if (filters?.itemId) {
      query = query.where(eq(stockMovements.itemId, filters.itemId));
    }
    
    if (filters?.locationId) {
      query = query.where(eq(stockMovements.locationId, filters.locationId));
    }
    
    if (filters?.movementType) {
      query = query.where(eq(stockMovements.movementType, filters.movementType));
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query.orderBy(desc(stockMovements.createdAt));
  }
  
  // ==============================================
  // RESERVAS DE ESTOQUE
  // ==============================================
  
  async createStockReservation(tenantId: string, reservationData: any): Promise<StockReservation> {
    const reservation = await db.insert(stockReservations).values({
      ...reservationData,
      tenantId,
    }).returning();
    
    return reservation[0];
  }
  
  async getActiveReservations(tenantId: string, itemId?: string): Promise<any[]> {
    let query = db.select({
      id: stockReservations.id,
      quantity: stockReservations.quantity,
      reservationType: stockReservations.reservationType,
      referenceId: stockReservations.referenceId,
      reservedAt: stockReservations.reservedAt,
      expiresAt: stockReservations.expiresAt,
      item: {
        id: items.id,
        name: items.name,
        code: items.code,
      },
      location: {
        id: stockLocations.id,
        name: stockLocations.name,
        code: stockLocations.code,
      }
    })
    .from(stockReservations)
    .innerJoin(items, eq(stockReservations.itemId, items.id))
    .innerJoin(stockLocations, eq(stockReservations.locationId, stockLocations.id))
    .where(and(
      eq(stockReservations.tenantId, tenantId),
      eq(stockReservations.isActive, true)
    ));
    
    if (itemId) {
      query = query.where(eq(stockReservations.itemId, itemId));
    }
    
    return await query.orderBy(desc(stockReservations.reservedAt));
  }
  
  // ==============================================
  // KITS DE SERVIÇO
  // ==============================================
  
  async getAllServiceKits(tenantId: string): Promise<ServiceKit[]> {
    return await db.select().from(serviceKits)
      .where(eq(serviceKits.tenantId, tenantId))
      .orderBy(serviceKits.name);
  }
  
  async createServiceKit(tenantId: string, kitData: any): Promise<ServiceKit> {
    const newKit = await db.insert(serviceKits).values({
      ...kitData,
      tenantId,
    }).returning();
    
    return newKit[0];
  }
  
  async getServiceKitWithItems(kitId: string): Promise<any> {
    const kit = await db.select().from(serviceKits)
      .where(eq(serviceKits.id, kitId))
      .limit(1);
    
    if (kit.length === 0) return null;
    
    const kitItems = await db.select({
      id: serviceKitItems.id,
      quantity: serviceKitItems.quantity,
      isOptional: serviceKitItems.isOptional,
      notes: serviceKitItems.notes,
      item: {
        id: items.id,
        name: items.name,
        code: items.code,
        type: items.type,
        unitOfMeasure: items.unitOfMeasure,
        unitCost: items.unitCost,
      }
    })
    .from(serviceKitItems)
    .innerJoin(items, eq(serviceKitItems.itemId, items.id))
    .where(eq(serviceKitItems.kitId, kitId))
    .orderBy(items.name);
    
    return {
      ...kit[0],
      items: kitItems,
    };
  }
  
  async addItemToServiceKit(kitId: string, itemId: string, quantity: number, isOptional: boolean = false, notes?: string): Promise<any> {
    const kitItem = await db.insert(serviceKitItems).values({
      kitId,
      itemId,
      quantity: quantity.toString(),
      isOptional,
      notes,
    }).returning();
    
    return kitItem[0];
  }
  
  // ==============================================
  // LISTAS DE PREÇOS
  // ==============================================
  
  async getAllPriceLists(tenantId: string): Promise<PriceList[]> {
    return await db.select().from(priceLists)
      .where(eq(priceLists.tenantId, tenantId))
      .orderBy(desc(priceLists.createdAt));
  }
  
  async createPriceList(tenantId: string, priceListData: any): Promise<PriceList> {
    const newPriceList = await db.insert(priceLists).values({
      ...priceListData,
      tenantId,
    }).returning();
    
    return newPriceList[0];
  }
  
  async getPriceListWithItems(priceListId: string): Promise<any> {
    const priceList = await db.select().from(priceLists)
      .where(eq(priceLists.id, priceListId))
      .limit(1);
    
    if (priceList.length === 0) return null;
    
    const priceListItems = await db.select({
      id: priceListItems.id,
      unitPrice: priceListItems.unitPrice,
      margin: priceListItems.margin,
      discountTiers: priceListItems.discountTiers,
      specialPrice: priceListItems.specialPrice,
      isActive: priceListItems.isActive,
      item: {
        id: items.id,
        name: items.name,
        code: items.code,
        type: items.type,
        unitOfMeasure: items.unitOfMeasure,
      }
    })
    .from(priceListItems)
    .innerJoin(items, eq(priceListItems.itemId, items.id))
    .where(and(
      eq(priceListItems.priceListId, priceListId),
      eq(priceListItems.isActive, true)
    ))
    .orderBy(items.name);
    
    return {
      ...priceList[0],
      items: priceListItems,
    };
  }
  
  // ==============================================
  // CONTROLE DE ATIVOS
  // ==============================================
  
  async getAllAssets(tenantId: string, filters?: {
    search?: string;
    status?: string;
    category?: string;
  }): Promise<Asset[]> {
    let query = db.select().from(assets)
      .where(eq(assets.tenantId, tenantId));
    
    if (filters?.search) {
      query = query.where(
        or(
          ilike(assets.name, `%${filters.search}%`),
          ilike(assets.assetNumber, `%${filters.search}%`),
          ilike(assets.serialNumber, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.status) {
      query = query.where(eq(assets.status, filters.status));
    }
    
    if (filters?.category) {
      query = query.where(eq(assets.category, filters.category));
    }
    
    return await query.orderBy(assets.name);
  }
  
  async createAsset(tenantId: string, assetData: any): Promise<Asset> {
    const newAsset = await db.insert(assets).values({
      ...assetData,
      tenantId,
    }).returning();
    
    return newAsset[0];
  }
  
  async getAssetHierarchy(assetId: string): Promise<any> {
    // Buscar asset principal
    const asset = await db.select().from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);
    
    if (asset.length === 0) return null;
    
    // Buscar filhos (componentes e peças)
    const children = await db.select().from(assets)
      .where(eq(assets.parentAssetId, assetId))
      .orderBy(assets.hierarchyLevel, assets.name);
    
    // Buscar histórico de manutenção recente
    const maintenanceHistory = await db.select({
      id: assetMaintenanceHistory.id,
      maintenanceType: assetMaintenanceHistory.maintenanceType,
      description: assetMaintenanceHistory.description,
      cost: assetMaintenanceHistory.cost,
      downtimeHours: assetMaintenanceHistory.downtimeHours,
      performedAt: assetMaintenanceHistory.performedAt,
    })
    .from(assetMaintenanceHistory)
    .where(eq(assetMaintenanceHistory.assetId, assetId))
    .orderBy(desc(assetMaintenanceHistory.performedAt))
    .limit(10);
    
    return {
      ...asset[0],
      children,
      maintenanceHistory,
    };
  }
  
  async recordAssetMovement(assetId: string, movementData: any): Promise<any> {
    const movement = await db.insert(assetMovements).values({
      assetId,
      ...movementData,
    }).returning();
    
    // Atualizar localização atual do ativo
    if (movementData.toLocationId) {
      await db.update(assets)
        .set({ currentLocationId: movementData.toLocationId })
        .where(eq(assets.id, assetId));
    }
    
    return movement[0];
  }
  
  // ==============================================
  // ESTATÍSTICAS E DASHBOARD
  // ==============================================
  
  async getDashboardStats(tenantId: string): Promise<any> {
    // Total de itens
    const totalItemsResult = await db.select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.tenantId, tenantId));
    
    // Itens por tipo
    const itemsByTypeResult = await db.select({
      type: items.type,
      count: sql<number>`count(*)`
    })
    .from(items)
    .where(eq(items.tenantId, tenantId))
    .groupBy(items.type);
    
    // Fornecedores ativos
    const activeSuppliersResult = await db.select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)));
    
    // Ativos por status
    const assetsByStatusResult = await db.select({
      status: assets.status,
      count: sql<number>`count(*)`
    })
    .from(assets)
    .where(eq(assets.tenantId, tenantId))
    .groupBy(assets.status);
    
    // Valor total do estoque
    const totalStockValueResult = await db.select({
      value: sql<number>`sum(${stockLevels.currentQuantity}::numeric * ${items.unitCost}::numeric)`
    })
    .from(stockLevels)
    .innerJoin(items, eq(stockLevels.itemId, items.id))
    .where(eq(items.tenantId, tenantId));
    
    return {
      totalItems: totalItemsResult[0]?.count || 0,
      itemsByType: itemsByTypeResult,
      activeSuppliers: activeSuppliersResult[0]?.count || 0,
      assetsByStatus: assetsByStatusResult,
      totalStockValue: totalStockValueResult[0]?.value || 0,
    };
  }
}

// Instância singleton
export const completePartsServicesRepository = new CompletePartsServicesRepository();