import { db } from "../../../../db";
import { 
  activityTypes, 
  parts, 
  serviceKits, 
  inventory,
  suppliers,
  type ActivityType,
  type Part,
  type ServiceKit,
  type Inventory,
  type Supplier,
  type InsertActivityType,
  type InsertPart,
  type InsertServiceKit,
  type InsertInventory,
  type InsertSupplier
} from "@shared/schema";
import { eq, and, desc, ilike, count, sql } from "drizzle-orm";
import { PartsServicesRepository } from "../../domain/repositories/PartsServicesRepository";

export class DrizzlePartsServicesRepository implements PartsServicesRepository {
  // ===== ACTIVITY TYPES =====
  async createActivityType(data: InsertActivityType): Promise<ActivityType> {
    const [activityType] = await db
      .insert(activityTypes)
      .values(data)
      .returning();
    return activityType;
  }

  async findActivityTypes(tenantId: string): Promise<ActivityType[]> {
    return await db
      .select()
      .from(activityTypes)
      .where(and(
        eq(activityTypes.tenantId, tenantId),
        eq(activityTypes.isActive, true)
      ))
      .orderBy(activityTypes.name);
  }

  async findActivityTypeById(id: string, tenantId: string): Promise<ActivityType | null> {
    const [activityType] = await db
      .select()
      .from(activityTypes)
      .where(and(
        eq(activityTypes.id, id),
        eq(activityTypes.tenantId, tenantId)
      ));
    return activityType || null;
  }

  async updateActivityType(id: string, tenantId: string, data: Partial<InsertActivityType>): Promise<ActivityType | null> {
    const [activityType] = await db
      .update(activityTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(activityTypes.id, id),
        eq(activityTypes.tenantId, tenantId)
      ))
      .returning();
    return activityType || null;
  }

  async deleteActivityType(id: string, tenantId: string): Promise<boolean> {
    const [activityType] = await db
      .update(activityTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(activityTypes.id, id),
        eq(activityTypes.tenantId, tenantId)
      ))
      .returning();
    return !!activityType;
  }

  // ===== PARTS =====
  async createPart(tenantId: string, data: InsertPart): Promise<Part> {
    const [part] = await db
      .insert(parts)
      .values({ ...data, tenantId })
      .returning();
    return part;
  }

  async findParts(tenantId: string, filters?: {
    category?: string;
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Part[]> {
    return await db
      .select()
      .from(parts)
      .where(and(
        eq(parts.tenantId, tenantId),
        filters?.isActive !== undefined ? eq(parts.isActive, filters.isActive) : undefined,
        filters?.category ? eq(parts.category, filters.category) : undefined,
        filters?.search ? ilike(parts.title, `%${filters.search}%`) : undefined
      ))
      .orderBy(desc(parts.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async findPartById(id: string, tenantId: string): Promise<Part | undefined> {
    const [part] = await db
      .select()
      .from(parts)
      .where(and(
        eq(parts.id, id),
        eq(parts.tenantId, tenantId)
      ));
    return part;
  }

  async findPartByPartNumber(partNumber: string, tenantId: string): Promise<Part | undefined> {
    const [part] = await db
      .select()
      .from(parts)
      .where(and(
        eq(parts.partNumber, partNumber),
        eq(parts.tenantId, tenantId)
      ));
    return part;
  }

  async updatePart(id: string, tenantId: string, data: Partial<InsertPart>): Promise<Part> {
    const [part] = await db
      .update(parts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(parts.id, id),
        eq(parts.tenantId, tenantId)
      ))
      .returning();
    return part;
  }

  async deletePart(id: string, tenantId: string): Promise<Part> {
    const [part] = await db
      .update(parts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(parts.id, id),
        eq(parts.tenantId, tenantId)
      ))
      .returning();
    return part;
  }

  async getPartsCount(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(parts)
      .where(and(
        eq(parts.tenantId, tenantId),
        eq(parts.isActive, true)
      ));
    return result.count;
  }

  // ===== SERVICE KITS =====
  async createServiceKit(tenantId: string, data: InsertServiceKit): Promise<ServiceKit> {
    const [serviceKit] = await db
      .insert(serviceKits)
      .values({ ...data, tenantId })
      .returning();
    return serviceKit;
  }

  async findServiceKits(tenantId: string, filters?: {
    kitType?: string;
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ServiceKit[]> {
    return await db
      .select()
      .from(serviceKits)
      .where(and(
        eq(serviceKits.tenantId, tenantId),
        filters?.isActive !== undefined ? eq(serviceKits.isActive, filters.isActive) : undefined,
        filters?.kitType ? eq(serviceKits.kitType, filters.kitType) : undefined,
        filters?.search ? ilike(serviceKits.kitName, `%${filters.search}%`) : undefined
      ))
      .orderBy(desc(serviceKits.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async findServiceKitById(id: string, tenantId: string): Promise<ServiceKit | undefined> {
    const [serviceKit] = await db
      .select()
      .from(serviceKits)
      .where(and(
        eq(serviceKits.id, id),
        eq(serviceKits.tenantId, tenantId)
      ));
    return serviceKit;
  }

  async updateServiceKit(id: string, tenantId: string, data: Partial<InsertServiceKit>): Promise<ServiceKit> {
    const [serviceKit] = await db
      .update(serviceKits)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(serviceKits.id, id),
        eq(serviceKits.tenantId, tenantId)
      ))
      .returning();
    return serviceKit;
  }

  async deleteServiceKit(id: string, tenantId: string): Promise<ServiceKit> {
    const [serviceKit] = await db
      .update(serviceKits)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(serviceKits.id, id),
        eq(serviceKits.tenantId, tenantId)
      ))
      .returning();
    return serviceKit;
  }

  async getServiceKitsCount(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(serviceKits)
      .where(and(
        eq(serviceKits.tenantId, tenantId),
        eq(serviceKits.isActive, true)
      ));
    return result.count;
  }

  // ===== INVENTORY =====
  async createInventory(tenantId: string, data: InsertInventory): Promise<Inventory> {
    const [inventoryItem] = await db
      .insert(inventory)
      .values({ ...data, tenantId })
      .returning();
    return inventoryItem;
  }

  async findInventory(tenantId: string, filters?: {
    partId?: string;
    locationId?: string;
    lowStock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.tenantId, tenantId),
        filters?.partId ? eq(inventory.partId, filters.partId) : undefined,
        filters?.locationId ? eq(inventory.locationId, filters.locationId) : undefined,
        filters?.lowStock ? sql`${inventory.quantity} <= ${inventory.reorderPoint}` : undefined
      ))
      .orderBy(desc(inventory.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async findInventoryById(id: string, tenantId: string): Promise<Inventory | undefined> {
    const [inventoryItem] = await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.id, id),
        eq(inventory.tenantId, tenantId)
      ));
    return inventoryItem;
  }

  async updateInventory(id: string, tenantId: string, data: Partial<InsertInventory>): Promise<Inventory> {
    const [inventoryItem] = await db
      .update(inventory)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(inventory.id, id),
        eq(inventory.tenantId, tenantId)
      ))
      .returning();
    return inventoryItem;
  }

  async deleteInventory(id: string, tenantId: string): Promise<Inventory> {
    const [inventoryItem] = await db
      .delete(inventory)
      .where(and(
        eq(inventory.id, id),
        eq(inventory.tenantId, tenantId)
      ))
      .returning();
    return inventoryItem;
  }

  async adjustInventoryQuantity(partId: string, tenantId: string, locationId: string, adjustment: number, reason: string): Promise<Inventory | undefined> {
    const [inventoryItem] = await db
      .update(inventory)
      .set({ 
        quantity: sql`${inventory.quantity} + ${adjustment}`,
        lastMovementDate: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(inventory.partId, partId),
        eq(inventory.tenantId, tenantId),
        eq(inventory.locationId, locationId)
      ))
      .returning();
    return inventoryItem;
  }

  // ===== SUPPLIERS =====
  async createSupplier(tenantId: string, data: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values({ ...data, tenantId })
      .returning();
    return supplier;
  }

  async findSuppliers(tenantId: string, filters?: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.tenantId, tenantId),
        filters?.isActive !== undefined ? eq(suppliers.isActive, filters.isActive) : undefined,
        filters?.search ? ilike(suppliers.name, `%${filters.search}%`) : undefined
      ))
      .orderBy(suppliers.name)
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async findSupplierById(id: string, tenantId: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, tenantId)
      ));
    return supplier;
  }

  async updateSupplier(id: string, tenantId: string, data: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, tenantId)
      ))
      .returning();
    return supplier;
  }

  async deleteSupplier(id: string, tenantId: string): Promise<Supplier> {
    const [supplier] = await db
      .update(suppliers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, tenantId)
      ))
      .returning();
    return supplier;
  }

  async getSuppliersCount(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(suppliers)
      .where(and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.isActive, true)
      ));
    return result.count;
  }
}