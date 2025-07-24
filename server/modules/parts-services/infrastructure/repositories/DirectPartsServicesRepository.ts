import { db } from '../../../../db';
import { eq, and, desc, sql, count, sum, isNull, or } from 'drizzle-orm';
import {
  items, suppliers, itemAttachments, itemLinks, itemCustomerLinks, itemSupplierLinks,
  stockLocations, stockLevels, stockMovements, serviceKits, serviceKitItems,
  priceLists, priceListItems, priceHistory, assets,
  type Item, type NewItem, type Supplier, type NewSupplier,
  type StockLocation, type NewStockLocation, type StockLevel, type NewStockLevel,
  type StockMovement, type NewStockMovement, type ServiceKit, type NewServiceKit,
  type PriceList, type NewPriceList, type Asset, type NewAsset
} from '@shared/schema-parts-services';

export class DirectPartsServicesRepository {
  // ===========================
  // ITEMS CRUD
  // ===========================
  
  async getItems(tenantId: string, limit = 50, offset = 0, search?: string, type?: string) {
    let query = db
      .select()
      .from(items)
      .where(eq(items.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(items.createdAt));

    if (search) {
      query = query.where(
        and(
          eq(items.tenantId, tenantId),
          or(
            sql`${items.name} ILIKE ${`%${search}%`}`,
            sql`${items.integrationCode} ILIKE ${`%${search}%`}`,
            sql`${items.description} ILIKE ${`%${search}%`}`
          )
        )
      );
    }

    if (type) {
      query = query.where(
        and(
          eq(items.tenantId, tenantId),
          eq(items.type, type)
        )
      );
    }

    return await query;
  }

  async getItemById(tenantId: string, id: string): Promise<Item | null> {
    const result = await db
      .select()
      .from(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .limit(1);

    return result[0] || null;
  }

  async createItem(tenantId: string, data: NewItem): Promise<Item> {
    const result = await db
      .insert(items)
      .values({ ...data, tenantId })
      .returning();

    return result[0];
  }

  async updateItem(tenantId: string, id: string, data: Partial<NewItem>): Promise<Item | null> {
    const result = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .returning();

    return result[0] || null;
  }

  async deleteItem(tenantId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  // ===========================
  // SUPPLIERS CRUD
  // ===========================

  async getSuppliers(tenantId: string, limit = 50, offset = 0, search?: string) {
    let query = db
      .select()
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(suppliers.createdAt));

    if (search) {
      query = query.where(
        and(
          eq(suppliers.tenantId, tenantId),
          or(
            sql`${suppliers.name} ILIKE ${`%${search}%`}`,
            sql`${suppliers.documentNumber} ILIKE ${`%${search}%`}`,
            sql`${suppliers.email} ILIKE ${`%${search}%`}`
          )
        )
      );
    }

    return await query;
  }

  async getSupplierById(tenantId: string, id: string): Promise<Supplier | null> {
    const result = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .limit(1);

    return result[0] || null;
  }

  async createSupplier(tenantId: string, data: NewSupplier): Promise<Supplier> {
    const result = await db
      .insert(suppliers)
      .values({ ...data, tenantId })
      .returning();

    return result[0];
  }

  async updateSupplier(tenantId: string, id: string, data: Partial<NewSupplier>): Promise<Supplier | null> {
    const result = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .returning();

    return result[0] || null;
  }

  async deleteSupplier(tenantId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  // ===========================
  // STOCK LOCATIONS CRUD
  // ===========================

  async getStockLocations(tenantId: string) {
    return await db
      .select()
      .from(stockLocations)
      .where(eq(stockLocations.tenantId, tenantId))
      .orderBy(stockLocations.name);
  }

  async createStockLocation(tenantId: string, data: NewStockLocation) {
    const result = await db
      .insert(stockLocations)
      .values({ ...data, tenantId })
      .returning();

    return result[0];
  }

  // ===========================
  // STOCK LEVELS & MOVEMENTS
  // ===========================

  async getStockLevels(tenantId: string, itemId?: string, locationId?: string) {
    let query = db
      .select({
        stockLevel: stockLevels,
        item: items,
        location: stockLocations
      })
      .from(stockLevels)
      .innerJoin(items, eq(stockLevels.itemId, items.id))
      .innerJoin(stockLocations, eq(stockLevels.locationId, stockLocations.id))
      .where(eq(items.tenantId, tenantId));

    if (itemId) {
      query = query.where(eq(stockLevels.itemId, itemId));
    }

    if (locationId) {
      query = query.where(eq(stockLevels.locationId, locationId));
    }

    return await query;
  }

  async updateStockLevel(tenantId: string, data: NewStockLevel) {
    // Verifica se já existe um registro para este item/localização
    const existing = await db
      .select()
      .from(stockLevels)
      .where(and(
        eq(stockLevels.itemId, data.itemId),
        eq(stockLevels.locationId, data.locationId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Atualiza o registro existente
      const result = await db
        .update(stockLevels)
        .set({ ...data, lastUpdated: new Date() })
        .where(and(
          eq(stockLevels.itemId, data.itemId),
          eq(stockLevels.locationId, data.locationId)
        ))
        .returning();

      return result[0];
    } else {
      // Cria um novo registro
      const result = await db
        .insert(stockLevels)
        .values(data)
        .returning();

      return result[0];
    }
  }

  async createStockMovement(tenantId: string, data: NewStockMovement) {
    const result = await db
      .insert(stockMovements)
      .values({ ...data, tenantId })
      .returning();

    // Atualiza o nível de estoque automaticamente
    const movement = result[0];
    const currentLevel = await db
      .select()
      .from(stockLevels)
      .where(and(
        eq(stockLevels.itemId, movement.itemId),
        eq(stockLevels.locationId, movement.locationId)
      ))
      .limit(1);

    if (currentLevel.length > 0) {
      const current = parseFloat(currentLevel[0].currentQuantity);
      const quantity = parseFloat(movement.quantity);
      let newQuantity: number;

      switch (movement.movementType) {
        case 'in':
        case 'adjustment':
          newQuantity = current + quantity;
          break;
        case 'out':
          newQuantity = current - quantity;
          break;
        case 'transfer':
          // Para transferências, esta é a saída (entrada será outro movimento)
          newQuantity = current - quantity;
          break;
        default:
          newQuantity = current;
      }

      await db
        .update(stockLevels)
        .set({ 
          currentQuantity: newQuantity.toString(),
          lastUpdated: new Date()
        })
        .where(and(
          eq(stockLevels.itemId, movement.itemId),
          eq(stockLevels.locationId, movement.locationId)
        ));
    }

    return movement;
  }

  async getStockMovements(tenantId: string, limit = 50, offset = 0) {
    return await db
      .select({
        movement: stockMovements,
        item: items,
        location: stockLocations
      })
      .from(stockMovements)
      .innerJoin(items, eq(stockMovements.itemId, items.id))
      .innerJoin(stockLocations, eq(stockMovements.locationId, stockLocations.id))
      .where(eq(stockMovements.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(stockMovements.createdAt));
  }

  // ===========================
  // SERVICE KITS CRUD
  // ===========================

  async getServiceKits(tenantId: string) {
    return await db
      .select()
      .from(serviceKits)
      .where(eq(serviceKits.tenantId, tenantId))
      .orderBy(serviceKits.name);
  }

  async createServiceKit(tenantId: string, data: NewServiceKit) {
    const result = await db
      .insert(serviceKits)
      .values({ ...data, tenantId })
      .returning();

    return result[0];
  }

  async getServiceKitItems(kitId: string) {
    return await db
      .select({
        kitItem: serviceKitItems,
        item: items
      })
      .from(serviceKitItems)
      .innerJoin(items, eq(serviceKitItems.itemId, items.id))
      .where(eq(serviceKitItems.kitId, kitId));
  }

  // ===========================
  // PRICE LISTS CRUD
  // ===========================

  async getPriceLists(tenantId: string) {
    return await db
      .select()
      .from(priceLists)
      .where(eq(priceLists.tenantId, tenantId))
      .orderBy(desc(priceLists.createdAt));
  }

  async createPriceList(tenantId: string, data: NewPriceList) {
    const result = await db
      .insert(priceLists)
      .values({ ...data, tenantId })
      .returning();

    return result[0];
  }

  async getPriceListItems(priceListId: string) {
    return await db
      .select({
        priceItem: priceListItems,
        item: items
      })
      .from(priceListItems)
      .innerJoin(items, eq(priceListItems.itemId, items.id))
      .where(eq(priceListItems.priceListId, priceListId));
  }

  // ===========================
  // ASSETS CRUD
  // ===========================

  async getAssets(tenantId: string, limit = 50, offset = 0) {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(assets.createdAt));
  }

  async createAsset(tenantId: string, data: NewAsset) {
    const result = await db
      .insert(assets)
      .values({ ...data, tenantId })
      .returning();

    return result[0];
  }

  // ===========================
  // DASHBOARD STATS
  // ===========================

  async getDashboardStats(tenantId: string) {
    const [
      totalItemsResult,
      materialsResult,
      servicesResult,
      totalSuppliersResult,
      activeSuppliersResult,
      stockAlertsResult,
      totalAssetsResult
    ] = await Promise.all([
      db.select({ count: count() }).from(items).where(eq(items.tenantId, tenantId)),
      db.select({ count: count() }).from(items).where(and(eq(items.tenantId, tenantId), eq(items.type, 'Material'))),
      db.select({ count: count() }).from(items).where(and(eq(items.tenantId, tenantId), eq(items.type, 'Serviço'))),
      db.select({ count: count() }).from(suppliers).where(eq(suppliers.tenantId, tenantId)),
      db.select({ count: count() }).from(suppliers).where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.active, true))),
      db.select({ count: count() }).from(stockLevels)
        .innerJoin(items, eq(stockLevels.itemId, items.id))
        .where(and(
          eq(items.tenantId, tenantId),
          sql`${stockLevels.currentQuantity} <= ${stockLevels.minimumQuantity}`
        )),
      db.select({ count: count() }).from(assets).where(eq(assets.tenantId, tenantId))
    ]);

    return {
      totalItems: totalItemsResult[0]?.count || 0,
      materials: materialsResult[0]?.count || 0,
      services: servicesResult[0]?.count || 0,
      totalSuppliers: totalSuppliersResult[0]?.count || 0,
      activeSuppliers: activeSuppliersResult[0]?.count || 0,
      stockAlerts: stockAlertsResult[0]?.count || 0,
      totalAssets: totalAssetsResult[0]?.count || 0,
      pendingOrders: 0 // TODO: Implementar quando tiver módulo de compras
    };
  }
}