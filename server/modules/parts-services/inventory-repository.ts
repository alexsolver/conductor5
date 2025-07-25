import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc, asc, sum, count, gte, lte, ilike, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import * as schema from '@shared/schema';

// Tipos para o módulo Controle de Estoque
interface StockLocationData {
  name: string;
  code: string;
  type: 'fixed' | 'mobile' | 'virtual' | 'consignment';
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  managerId?: string;
  capacity?: number;
  currentOccupancy?: number;
}

interface StockLevelData {
  itemId: string;
  locationId: string;
  currentQuantity: number;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderPoint?: number;
  economicOrderQuantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  unitCost?: number;
  totalValue?: number;
}

interface StockMovementData {
  itemId: string;
  locationId: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  reasonCode?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: Date;
  userId: string;
}

interface StockTransferData {
  transferNumber: string;
  fromLocationId: string;
  toLocationId: string;
  status?: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requestedBy: string;
  expectedDate?: Date;
  notes?: string;
  items: StockTransferItemData[];
}

interface StockTransferItemData {
  itemId: string;
  requestedQuantity: number;
  unitCost?: number;
  notes?: string;
}

interface PhysicalInventoryData {
  inventoryNumber: string;
  locationId: string;
  type: 'full' | 'cycle' | 'spot';
  plannedDate: Date;
  responsibleUserId: string;
  notes?: string;
}

interface ServiceKitData {
  name: string;
  code: string;
  description?: string;
  kitType: 'maintenance' | 'repair' | 'installation' | 'emergency';
  equipmentType?: string;
  maintenanceType?: 'preventive' | 'corrective' | 'predictive';
  estimatedCost?: number;
  isActive?: boolean;
  createdBy: string;
  items: ServiceKitItemData[];
}

interface ServiceKitItemData {
  itemId: string;
  quantity: number;
  isOptional?: boolean;
  priority?: number;
  notes?: string;
}

export class DrizzleInventoryRepository {
  constructor(private db: any, private tenantId: string) {}

  // STOCK LOCATIONS
  async createStockLocation(data: StockLocationData) {
    const id = createId();
    await this.db.insert(schema.stockLocations).values({
      id,
      tenantId: this.tenantId,
      ...data,
    });
    return { id, ...data };
  }

  async getStockLocations() {
    return await this.db
      .select()
      .from(schema.stockLocations)
      .where(eq(schema.stockLocations.tenantId, this.tenantId))
      .orderBy(asc(schema.stockLocations.name));
  }

  async getStockLocationById(id: string) {
    const results = await this.db
      .select()
      .from(schema.stockLocations)
      .where(
        and(
          eq(schema.stockLocations.id, id),
          eq(schema.stockLocations.tenantId, this.tenantId)
        )
      );
    return results[0] || null;
  }

  async updateStockLocation(id: string, data: Partial<StockLocationData>) {
    await this.db
      .update(schema.stockLocations)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(schema.stockLocations.id, id),
          eq(schema.stockLocations.tenantId, this.tenantId)
        )
      );
    return { id, ...data };
  }

  async deleteStockLocation(id: string) {
    await this.db
      .delete(schema.stockLocations)
      .where(
        and(
          eq(schema.stockLocations.id, id),
          eq(schema.stockLocations.tenantId, this.tenantId)
        )
      );
    return { id };
  }

  // STOCK LEVELS
  async getStockLevels(filters?: { locationId?: string; itemId?: string; lowStock?: boolean }) {
    let query = this.db
      .select({
        id: schema.stockLevels.id,
        itemId: schema.stockLevels.itemId,
        locationId: schema.stockLevels.locationId,
        currentQuantity: schema.stockLevels.currentQuantity,
        minimumStock: schema.stockLevels.minimumStock,
        maximumStock: schema.stockLevels.maximumStock,
        reorderPoint: schema.stockLevels.reorderPoint,
        averageCost: schema.stockLevels.averageCost,
        lastCost: schema.stockLevels.lastCost,
        totalValue: schema.stockLevels.totalValue,
        lastMovementDate: schema.stockLevels.lastMovementDate,
        // Dados do item
        itemTitle: schema.items.title,
        itemCode: schema.items.internalCode,
        itemType: schema.items.type,
        // Dados da localização
        locationName: schema.stockLocations.name,
        locationCode: schema.stockLocations.code,
        locationType: schema.stockLocations.type,
      })
      .from(schema.stockLevels)
      .leftJoin(schema.items, eq(schema.stockLevels.itemId, schema.items.id))
      .leftJoin(schema.stockLocations, eq(schema.stockLevels.locationId, schema.stockLocations.id))
      .where(eq(schema.stockLevels.tenantId, this.tenantId));

    if (filters?.locationId) {
      query = query.where(eq(schema.stockLevels.locationId, filters.locationId));
    }
    if (filters?.itemId) {
      query = query.where(eq(schema.stockLevels.itemId, filters.itemId));
    }
    if (filters?.lowStock) {
      query = query.where(lte(schema.stockLevels.currentQuantity, schema.stockLevels.reorderPoint));
    }

    return await query.orderBy(asc(schema.stockLevels.lastMovementDate));
  }

  async updateStockLevel(itemId: string, locationId: string, data: Partial<StockLevelData>) {
    const existingLevel = await this.db
      .select()
      .from(schema.stockLevels)
      .where(
        and(
          eq(schema.stockLevels.itemId, itemId),
          eq(schema.stockLevels.locationId, locationId),
          eq(schema.stockLevels.tenantId, this.tenantId)
        )
      );

    if (existingLevel.length > 0) {
      // Atualizar nível existente
      await this.db
        .update(schema.stockLevels)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(schema.stockLevels.itemId, itemId),
            eq(schema.stockLevels.locationId, locationId),
            eq(schema.stockLevels.tenantId, this.tenantId)
          )
        );
    } else {
      // Criar novo nível
      const id = createId();
      await this.db.insert(schema.stockLevels).values({
        id,
        tenantId: this.tenantId,
        itemId,
        locationId,
        ...data,
      });
    }

    return { itemId, locationId, ...data };
  }

  // MOVIMENTAÇÕES DE ESTOQUE - Versão simplificada para MVP
  async createStockMovement(data: StockMovementData) {
    const id = createId();
    
    // Para MVP, vamos apenas registrar que o movimento foi criado
    // As tabelas de movimentação serão implementadas em próxima versão
    console.log('Movimento de estoque registrado:', { id, ...data });

    // Simular atualização de estoque diretamente na tabela stock_levels
    const currentLevel = await this.db
      .select()
      .from(schema.stockLevels)
      .where(
        and(
          eq(schema.stockLevels.itemId, data.itemId),
          eq(schema.stockLevels.locationId, data.locationId),
          eq(schema.stockLevels.tenantId, this.tenantId)
        )
      );

    if (currentLevel.length > 0) {
      const level = currentLevel[0];
      const quantityChange = data.movementType === 'in' ? data.quantity : -data.quantity;
      const newQuantity = (level.currentQuantity || 0) + quantityChange;
      
      await this.db
        .update(schema.stockLevels)
        .set({
          currentQuantity: newQuantity,
          lastCost: data.unitCost || level.lastCost || 0,
          totalValue: newQuantity * (data.unitCost || level.lastCost || 0),
          lastMovementDate: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.stockLevels.itemId, data.itemId),
            eq(schema.stockLevels.locationId, data.locationId),
            eq(schema.stockLevels.tenantId, this.tenantId)
          )
        );
    }

    return { id, ...data };
  }

  async getStockMovements(filters?: { 
    locationId?: string; 
    itemId?: string; 
    movementType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    // Para MVP, retornar dados simulados baseados nos filtros
    const movements = [
      {
        id: createId(),
        itemId: filters?.itemId || 'sample-item',
        locationId: filters?.locationId || 'sample-location',
        movementType: 'in',
        quantity: 100,
        unitCost: 15.50,
        totalCost: 1550.00,
        referenceType: 'purchase',
        reasonCode: 'COMPRA',
        notes: 'Entrada de estoque - Compra',
        createdAt: new Date(),
        itemTitle: 'Item de Exemplo',
        itemCode: 'EX001',
        locationName: 'Estoque Central',
        locationCode: 'EST-01',
      }
    ];

    return movements;
  }

  // TRANSFERÊNCIAS DE ESTOQUE - MVP Simplificado
  async createStockTransfer(data: StockTransferData) {
    const id = createId();
    
    // Para MVP, apenas registrar que a transferência foi criada
    console.log('Transferência criada:', { id, ...data });
    
    return { id, ...data };
  }

  async getStockTransfers(filters?: { status?: string; fromLocationId?: string; toLocationId?: string }) {
    // Para MVP, retornar dados simulados
    const transfers = [
      {
        id: createId(),
        transferNumber: 'TRF-2025-001',
        fromLocationId: filters?.fromLocationId || 'sample-from',
        toLocationId: filters?.toLocationId || 'sample-to',
        status: filters?.status || 'pending',
        priority: 'normal',
        requestDate: new Date(),
        expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        totalItems: 3,
        totalValue: 450.00,
        notes: 'Transferência de exemplo',
        fromLocationName: 'Estoque Central',
        fromLocationCode: 'EST-01',
      }
    ];

    return transfers;
  }

  // SERVICE KITS - MVP Simplificado
  async createServiceKit(data: ServiceKitData) {
    const id = createId();
    
    // Para MVP, apenas registrar que o kit foi criado
    console.log('Kit de serviço criado:', { id, ...data });
    
    return { id, ...data };
  }

  async getServiceKits(filters?: { kitType?: string; isActive?: boolean }) {
    // Para MVP, retornar dados simulados
    const kits = [
      {
        id: createId(),
        name: 'Kit Manutenção Preventiva',
        code: 'KIT-PREV-001',
        description: 'Kit básico para manutenção preventiva',
        kitType: filters?.kitType || 'maintenance',
        isActive: filters?.isActive ?? true,
        estimatedCost: 125.50,
      }
    ];

    return kits;
  }

  async getServiceKitById(id: string) {
    // Para MVP, retornar dados simulados
    return {
      id,
      name: 'Kit Manutenção Preventiva',
      code: 'KIT-PREV-001',
      description: 'Kit básico para manutenção preventiva',
      kitType: 'maintenance',
      isActive: true,
      estimatedCost: 125.50,
      items: [
        {
          id: createId(),
          itemId: 'sample-item-1',
          quantity: 2,
          isOptional: false,
          priority: 1,
          notes: 'Item obrigatório',
          itemTitle: 'Filtro de Ar',
          itemCode: 'FA-001',
          itemType: 'part',
          unitCost: 25.00,
        }
      ],
    };
  }

  // DASHBOARD STATS
  async getInventoryStats(tenantId: string): Promise<InventoryStats> {
    const schemaName = this.getTenantSchema(tenantId);
    
    try {
      const result = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT sl.item_id) as total_items,
          COUNT(DISTINCT sl.location_id) as total_locations,
          COUNT(*) FILTER (WHERE sl.current_quantity <= sl.reorder_point) as low_stock_items,
          SUM(sl.current_quantity * sl.unit_cost) as total_value
        FROM ${sql.identifier(schemaName)}.stock_levels sl
        WHERE sl.tenant_id = ${tenantId}
      `);

      const stats = result.rows[0];
      
      return {
        totalItems: Number(stats.total_items) || 0,
        totalLocations: Number(stats.total_locations) || 0,
        lowStockItems: Number(stats.low_stock_items) || 0,
        totalValue: Number(stats.total_value) || 0,
        criticalItems: 0,
        outOfStockItems: 0,
        movements: 0,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do inventário:', error);
      
      // Return default stats if table doesn't exist yet
      return {
        totalItems: 0,
        totalLocations: 0,
        lowStockItems: 0,
        totalValue: 0,
        criticalItems: 0,
        outOfStockItems: 0,
        movements: 0,
      };
    }
  }

  private getTenantSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }
}