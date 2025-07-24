
import { and, eq, desc, ilike, sql } from 'drizzle-orm';
import { db } from '../../../../db.ts';
import {
  items, suppliers, customerCompanies, stockLocations, inventory, stockMovements,
  serviceKits, priceLists, assets, itemCustomerLinks, itemSupplierLinks,
  InsertItem, Item, InsertSupplier, Supplier, InsertCustomerCompany, CustomerCompany,
  InsertStockLocation, StockLocation, InsertInventory, Inventory,
  InsertStockMovement, StockMovement, InsertServiceKit, ServiceKit,
  InsertPriceList, PriceList, InsertAsset, Asset
} from '../../../../../shared/schema-parts-services.ts';

export class PartsServicesRepository {
  
  // ==================== ITENS ====================
  
  async getItems(tenantId: string, searchTerm?: string) {
    try {
      let query = db.select().from(items).where(eq(items.tenantId, tenantId));
      
      if (searchTerm) {
        query = query.where(
          and(
            eq(items.tenantId, tenantId),
            sql`(${items.name} ILIKE ${'%' + searchTerm + '%'} OR ${items.integrationCode} ILIKE ${'%' + searchTerm + '%'})`
          )
        );
      }
      
      return await query.orderBy(desc(items.createdAt));
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new Error('Failed to fetch items');
    }
  }

  async getItemById(tenantId: string, itemId: string) {
    try {
      const result = await db.select()
        .from(items)
        .where(and(eq(items.tenantId, tenantId), eq(items.id, itemId)))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      throw new Error('Failed to fetch item');
    }
  }

  async createItem(data: InsertItem) {
    try {
      const result = await db.insert(items).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error('Failed to create item');
    }
  }

  async updateItem(tenantId: string, itemId: string, data: Partial<InsertItem>) {
    try {
      const result = await db.update(items)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(items.tenantId, tenantId), eq(items.id, itemId)))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error('Failed to update item');
    }
  }

  async deleteItem(tenantId: string, itemId: string) {
    try {
      const result = await db.delete(items)
        .where(and(eq(items.tenantId, tenantId), eq(items.id, itemId)))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw new Error('Failed to delete item');
    }
  }

  // ==================== FORNECEDORES ====================
  
  async getSuppliers(tenantId: string, searchTerm?: string) {
    try {
      let query = db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId));
      
      if (searchTerm) {
        query = query.where(
          and(
            eq(suppliers.tenantId, tenantId),
            sql`(${suppliers.name} ILIKE ${'%' + searchTerm + '%'} OR ${suppliers.supplierCode} ILIKE ${'%' + searchTerm + '%'})`
          )
        );
      }
      
      return await query.orderBy(desc(suppliers.createdAt));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error('Failed to fetch suppliers');
    }
  }

  async getSupplierById(tenantId: string, supplierId: string) {
    try {
      const result = await db.select()
        .from(suppliers)
        .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, supplierId)))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching supplier by ID:', error);
      throw new Error('Failed to fetch supplier');
    }
  }

  async createSupplier(data: InsertSupplier) {
    try {
      const result = await db.insert(suppliers).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw new Error('Failed to create supplier');
    }
  }

  async updateSupplier(tenantId: string, supplierId: string, data: Partial<InsertSupplier>) {
    try {
      const result = await db.update(suppliers)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, supplierId)))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error('Failed to update supplier');
    }
  }

  async deleteSupplier(tenantId: string, supplierId: string) {
    try {
      const result = await db.delete(suppliers)
        .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, supplierId)))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw new Error('Failed to delete supplier');
    }
  }

  // ==================== EMPRESAS CLIENTES ====================
  
  async getCustomerCompanies(tenantId: string, searchTerm?: string) {
    try {
      let query = db.select().from(customerCompanies).where(eq(customerCompanies.tenantId, tenantId));
      
      if (searchTerm) {
        query = query.where(
          and(
            eq(customerCompanies.tenantId, tenantId),
            sql`(${customerCompanies.name} ILIKE ${'%' + searchTerm + '%'} OR ${customerCompanies.documentNumber} ILIKE ${'%' + searchTerm + '%'})`
          )
        );
      }
      
      return await query.orderBy(desc(customerCompanies.createdAt));
    } catch (error) {
      console.error('Error fetching customer companies:', error);
      throw new Error('Failed to fetch customer companies');
    }
  }

  async createCustomerCompany(data: InsertCustomerCompany) {
    try {
      const result = await db.insert(customerCompanies).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating customer company:', error);
      throw new Error('Failed to create customer company');
    }
  }

  async updateCustomerCompany(tenantId: string, companyId: string, data: Partial<InsertCustomerCompany>) {
    try {
      const result = await db.update(customerCompanies)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(customerCompanies.tenantId, tenantId), eq(customerCompanies.id, companyId)))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating customer company:', error);
      throw new Error('Failed to update customer company');
    }
  }

  async deleteCustomerCompany(tenantId: string, companyId: string) {
    try {
      const result = await db.delete(customerCompanies)
        .where(and(eq(customerCompanies.tenantId, tenantId), eq(customerCompanies.id, companyId)))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting customer company:', error);
      throw new Error('Failed to delete customer company');
    }
  }

  // ==================== LOCALIZAÇÕES DE ESTOQUE ====================
  
  async getStockLocations(tenantId: string) {
    try {
      return await db.select()
        .from(stockLocations)
        .where(eq(stockLocations.tenantId, tenantId))
        .orderBy(desc(stockLocations.createdAt));
    } catch (error) {
      console.error('Error fetching stock locations:', error);
      throw new Error('Failed to fetch stock locations');
    }
  }

  async createStockLocation(data: InsertStockLocation) {
    try {
      const result = await db.insert(stockLocations).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating stock location:', error);
      throw new Error('Failed to create stock location');
    }
  }

  // ==================== CONTROLE DE ESTOQUE ====================
  
  async getInventory(tenantId: string, itemId?: string, locationId?: string) {
    try {
      let query = db.select({
        id: inventory.id,
        tenantId: inventory.tenantId,
        itemId: inventory.itemId,
        locationId: inventory.locationId,
        currentQuantity: inventory.currentQuantity,
        minimumStock: inventory.minimumStock,
        maximumStock: inventory.maximumStock,
        reorderPoint: inventory.reorderPoint,
        economicLot: inventory.economicLot,
        reservedQuantity: inventory.reservedQuantity,
        consignedQuantity: inventory.consignedQuantity,
        lastUpdated: inventory.lastUpdated,
        itemName: items.name,
        itemType: items.type,
        locationName: stockLocations.name
      })
      .from(inventory)
      .innerJoin(items, eq(inventory.itemId, items.id))
      .innerJoin(stockLocations, eq(inventory.locationId, stockLocations.id))
      .where(eq(inventory.tenantId, tenantId));

      if (itemId) {
        query = query.where(and(eq(inventory.tenantId, tenantId), eq(inventory.itemId, itemId)));
      }
      
      if (locationId) {
        query = query.where(and(eq(inventory.tenantId, tenantId), eq(inventory.locationId, locationId)));
      }
      
      return await query.orderBy(desc(inventory.lastUpdated));
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory');
    }
  }

  async updateInventory(tenantId: string, inventoryId: string, data: Partial<InsertInventory>) {
    try {
      const result = await db.update(inventory)
        .set({ ...data, lastUpdated: new Date() })
        .where(and(eq(inventory.tenantId, tenantId), eq(inventory.id, inventoryId)))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Failed to update inventory');
    }
  }

  // ==================== MOVIMENTAÇÕES DE ESTOQUE ====================
  
  async getStockMovements(tenantId: string, itemId?: string, limit = 50) {
    try {
      let query = db.select({
        id: stockMovements.id,
        tenantId: stockMovements.tenantId,
        itemId: stockMovements.itemId,
        locationId: stockMovements.locationId,
        movementType: stockMovements.movementType,
        quantity: stockMovements.quantity,
        unitCost: stockMovements.unitCost,
        totalCost: stockMovements.totalCost,
        referenceDocument: stockMovements.referenceDocument,
        notes: stockMovements.notes,
        lotNumber: stockMovements.lotNumber,
        serialNumber: stockMovements.serialNumber,
        expiryDate: stockMovements.expiryDate,
        createdAt: stockMovements.createdAt,
        itemName: items.name,
        locationName: stockLocations.name
      })
      .from(stockMovements)
      .innerJoin(items, eq(stockMovements.itemId, items.id))
      .innerJoin(stockLocations, eq(stockMovements.locationId, stockLocations.id))
      .where(eq(stockMovements.tenantId, tenantId));

      if (itemId) {
        query = query.where(and(eq(stockMovements.tenantId, tenantId), eq(stockMovements.itemId, itemId)));
      }
      
      return await query.orderBy(desc(stockMovements.createdAt)).limit(limit);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw new Error('Failed to fetch stock movements');
    }
  }

  async createStockMovement(data: InsertStockMovement) {
    try {
      const result = await db.insert(stockMovements).values(data).returning();
      
      // Atualizar estoque automaticamente
      if (result[0]) {
        await this.updateStockAfterMovement(result[0]);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error creating stock movement:', error);
      throw new Error('Failed to create stock movement');
    }
  }

  private async updateStockAfterMovement(movement: StockMovement) {
    try {
      const currentInventory = await db.select()
        .from(inventory)
        .where(and(
          eq(inventory.tenantId, movement.tenantId),
          eq(inventory.itemId, movement.itemId),
          eq(inventory.locationId, movement.locationId)
        ))
        .limit(1);

      if (currentInventory.length === 0) {
        // Criar registro de estoque se não existir
        await db.insert(inventory).values({
          tenantId: movement.tenantId,
          itemId: movement.itemId,
          locationId: movement.locationId,
          currentQuantity: movement.movementType === 'Entrada' ? movement.quantity : '0',
          minimumStock: '0',
          maximumStock: '0',
          reorderPoint: '0'
        });
      } else {
        // Atualizar estoque existente
        const current = parseFloat(currentInventory[0].currentQuantity || '0');
        const movementQty = parseFloat(movement.quantity || '0');
        
        let newQuantity = current;
        if (movement.movementType === 'Entrada') {
          newQuantity = current + movementQty;
        } else if (movement.movementType === 'Saída') {
          newQuantity = current - movementQty;
        }

        await db.update(inventory)
          .set({ 
            currentQuantity: newQuantity.toString(),
            lastUpdated: new Date()
          })
          .where(and(
            eq(inventory.tenantId, movement.tenantId),
            eq(inventory.itemId, movement.itemId),
            eq(inventory.locationId, movement.locationId)
          ));
      }
    } catch (error) {
      console.error('Error updating stock after movement:', error);
    }
  }

  // ==================== KITS DE SERVIÇO ====================
  
  async getServiceKits(tenantId: string) {
    try {
      return await db.select()
        .from(serviceKits)
        .where(eq(serviceKits.tenantId, tenantId))
        .orderBy(desc(serviceKits.createdAt));
    } catch (error) {
      console.error('Error fetching service kits:', error);
      throw new Error('Failed to fetch service kits');
    }
  }

  async createServiceKit(data: InsertServiceKit) {
    try {
      const result = await db.insert(serviceKits).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating service kit:', error);
      throw new Error('Failed to create service kit');
    }
  }

  // ==================== LISTAS DE PREÇOS ====================
  
  async getPriceLists(tenantId: string) {
    try {
      return await db.select()
        .from(priceLists)
        .where(eq(priceLists.tenantId, tenantId))
        .orderBy(desc(priceLists.createdAt));
    } catch (error) {
      console.error('Error fetching price lists:', error);
      throw new Error('Failed to fetch price lists');
    }
  }

  async createPriceList(data: InsertPriceList) {
    try {
      const result = await db.insert(priceLists).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating price list:', error);
      throw new Error('Failed to create price list');
    }
  }

  // ==================== ATIVOS ====================
  
  async getAssets(tenantId: string, customerCompanyId?: string) {
    try {
      let query = db.select()
        .from(assets)
        .where(eq(assets.tenantId, tenantId));

      if (customerCompanyId) {
        query = query.where(and(eq(assets.tenantId, tenantId), eq(assets.customerCompanyId, customerCompanyId)));
      }
      
      return await query.orderBy(desc(assets.createdAt));
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw new Error('Failed to fetch assets');
    }
  }

  async createAsset(data: InsertAsset) {
    try {
      const result = await db.insert(assets).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating asset:', error);
      throw new Error('Failed to create asset');
    }
  }

  // ==================== DASHBOARDS E RELATÓRIOS ====================
  
  async getDashboardStats(tenantId: string) {
    try {
      const [itemsCount, suppliersCount, stockLocationsCount, lowStockItems] = await Promise.all([
        db.select({ count: sql`count(*)` }).from(items).where(eq(items.tenantId, tenantId)),
        db.select({ count: sql`count(*)` }).from(suppliers).where(eq(suppliers.tenantId, tenantId)),
        db.select({ count: sql`count(*)` }).from(stockLocations).where(eq(stockLocations.tenantId, tenantId)),
        db.select({ count: sql`count(*)` })
          .from(inventory)
          .where(and(
            eq(inventory.tenantId, tenantId),
            sql`${inventory.currentQuantity}::numeric <= ${inventory.minimumStock}::numeric`
          ))
      ]);

      return {
        totalItems: itemsCount[0]?.count || 0,
        totalSuppliers: suppliersCount[0]?.count || 0,
        totalLocations: stockLocationsCount[0]?.count || 0,
        lowStockItems: lowStockItems[0]?.count || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard stats');
    }
  }
}
