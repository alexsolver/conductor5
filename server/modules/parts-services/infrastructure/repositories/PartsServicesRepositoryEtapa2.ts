
import { getTenantDb } from "../../../../db-tenant";
import { eq, and, desc, ilike, count, sql, gte, lte, inArray } from "drizzle-orm";
import { 
  parts, 
  suppliers, 
  stockLocations, 
  inventoryMultiLocation,
  stockMovements,
  stockLots,
  movementApprovalRules
} from "../../../../../shared/schema-parts-services-unified";

export interface MovementData {
  part_id: string;
  location_id: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  movement_subtype?: string;
  quantity: number;
  unit_cost?: number;
  source_location_id?: string;
  destination_location_id?: string;
  lot_number?: string;
  serial_number?: string;
  expiration_date?: Date;
  reference_document_type?: string;
  reference_document_number?: string;
  supplier_id?: string;
  customer_id?: string;
  notes?: string;
}

export interface LotData {
  part_id: string;
  location_id: string;
  lot_number: string;
  serial_number?: string;
  original_quantity: number;
  manufacturing_date?: Date;
  expiration_date?: Date;
  unit_cost?: number;
}

export class PartsServicesRepositoryEtapa2 {
  
  // ===== MOVIMENTAÇÕES DE ESTOQUE =====
  async createMovement(tenantId: string, userId: string, data: MovementData) {
    const db = getTenantDb(tenantId);
    
    // Gerar número da movimentação
    const movementNumber = await this.generateMovementNumber(tenantId, data.movement_type);
    
    // Calcular custo total
    const totalCost = (data.quantity || 0) * (data.unit_cost || 0);
    
    // Verificar se precisa de aprovação
    const needsApproval = await this.checkApprovalRequired(tenantId, data.movement_type, totalCost);
    
    const [movement] = await db
      .insert(stockMovements)
      .values({
        ...data,
        tenantId,
        movement_number: movementNumber,
        total_cost: totalCost,
        status: 'COMPLETED',
        approval_status: needsApproval ? 'PENDING' : 'APPROVED',
        created_by: userId
      })
      .returning();
      
    return movement;
  }

  async findMovements(tenantId: string, filters?: {
    partId?: string;
    locationId?: string;
    movementType?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }) {
    const db = getTenantDb(tenantId);
    
    let query = db
      .select({
        id: stockMovements.id,
        movement_number: stockMovements.movement_number,
        movement_type: stockMovements.movement_type,
        movement_subtype: stockMovements.movement_subtype,
        quantity: stockMovements.quantity,
        unit_cost: stockMovements.unit_cost,
        total_cost: stockMovements.total_cost,
        lot_number: stockMovements.lot_number,
        serial_number: stockMovements.serial_number,
        status: stockMovements.status,
        approval_status: stockMovements.approval_status,
        notes: stockMovements.notes,
        created_at: stockMovements.created_at,
        part_title: parts.title,
        part_code: parts.internal_code,
        location_name: stockLocations.location_name,
        source_location_name: sql<string>`sl_source.location_name`,
        destination_location_name: sql<string>`sl_dest.location_name`,
        supplier_name: suppliers.name
      })
      .from(stockMovements)
      .leftJoin(parts, eq(stockMovements.part_id, parts.id))
      .leftJoin(stockLocations, eq(stockMovements.location_id, stockLocations.id))
      .leftJoin(
        sql`stock_locations sl_source`, 
        sql`${stockMovements.source_location_id} = sl_source.id`
      )
      .leftJoin(
        sql`stock_locations sl_dest`, 
        sql`${stockMovements.destination_location_id} = sl_dest.id`
      )
      .leftJoin(suppliers, eq(stockMovements.supplier_id, suppliers.id))
      .where(eq(stockMovements.tenantId, tenantId));

    // Aplicar filtros
    if (filters?.partId) {
      query = query.where(and(
        eq(stockMovements.tenantId, tenantId),
        eq(stockMovements.part_id, filters.partId)
      ));
    }

    if (filters?.locationId) {
      query = query.where(and(
        eq(stockMovements.tenantId, tenantId),
        eq(stockMovements.location_id, filters.locationId)
      ));
    }

    if (filters?.movementType) {
      query = query.where(and(
        eq(stockMovements.tenantId, tenantId),
        eq(stockMovements.movement_type, filters.movementType)
      ));
    }

    if (filters?.startDate) {
      query = query.where(and(
        eq(stockMovements.tenantId, tenantId),
        gte(stockMovements.created_at, filters.startDate)
      ));
    }

    if (filters?.endDate) {
      query = query.where(and(
        eq(stockMovements.tenantId, tenantId),
        lte(stockMovements.created_at, filters.endDate)
      ));
    }

    return await query.orderBy(desc(stockMovements.created_at));
  }

  async approveMovement(tenantId: string, movementId: string, approverId: string) {
    const db = getTenantDb(tenantId);
    
    const [movement] = await db
      .update(stockMovements)
      .set({
        approval_status: 'APPROVED',
        approved_by: approverId,
        approved_at: new Date()
      })
      .where(and(
        eq(stockMovements.id, movementId),
        eq(stockMovements.tenantId, tenantId)
      ))
      .returning();
      
    return movement;
  }

  // ===== LOTES E SERIAL NUMBERS =====
  async createLot(tenantId: string, data: LotData) {
    const db = getTenantDb(tenantId);
    
    const totalValue = (data.original_quantity || 0) * (data.unit_cost || 0);
    
    const [lot] = await db
      .insert(stockLots)
      .values({
        ...data,
        tenantId,
        current_quantity: data.original_quantity,
        total_value: totalValue
      })
      .returning();
      
    return lot;
  }

  async findLots(tenantId: string, partId?: string, locationId?: string) {
    const db = getTenantDb(tenantId);
    
    let query = db
      .select({
        id: stockLots.id,
        lot_number: stockLots.lot_number,
        serial_number: stockLots.serial_number,
        current_quantity: stockLots.current_quantity,
        original_quantity: stockLots.original_quantity,
        manufacturing_date: stockLots.manufacturing_date,
        expiration_date: stockLots.expiration_date,
        unit_cost: stockLots.unit_cost,
        total_value: stockLots.total_value,
        status: stockLots.status,
        part_title: parts.title,
        part_code: parts.internal_code,
        location_name: stockLocations.location_name
      })
      .from(stockLots)
      .leftJoin(parts, eq(stockLots.part_id, parts.id))
      .leftJoin(stockLocations, eq(stockLots.location_id, stockLocations.id))
      .where(eq(stockLots.tenantId, tenantId));

    if (partId) {
      query = query.where(and(
        eq(stockLots.tenantId, tenantId),
        eq(stockLots.part_id, partId)
      ));
    }

    if (locationId) {
      query = query.where(and(
        eq(stockLots.tenantId, tenantId),
        eq(stockLots.location_id, locationId)
      ));
    }

    return await query.orderBy(stockLots.expiration_date);
  }

  async getExpiringLots(tenantId: string, daysAhead: number = 30) {
    const db = getTenantDb(tenantId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    return await db
      .select({
        id: stockLots.id,
        lot_number: stockLots.lot_number,
        current_quantity: stockLots.current_quantity,
        expiration_date: stockLots.expiration_date,
        total_value: stockLots.total_value,
        part_title: parts.title,
        part_code: parts.internal_code,
        location_name: stockLocations.location_name
      })
      .from(stockLots)
      .leftJoin(parts, eq(stockLots.part_id, parts.id))
      .leftJoin(stockLocations, eq(stockLots.location_id, stockLocations.id))
      .where(and(
        eq(stockLots.tenantId, tenantId),
        eq(stockLots.status, 'ACTIVE'),
        lte(stockLots.expiration_date, cutoffDate)
      ))
      .orderBy(stockLots.expiration_date);
  }

  // ===== RELATÓRIOS E ANALYTICS =====
  async getStockTurnoverReport(tenantId: string, startDate: Date, endDate: Date) {
    const db = getTenantDb(tenantId);
    
    return await db
      .select({
        part_id: stockMovements.part_id,
        part_title: parts.title,
        part_code: parts.internal_code,
        total_out_quantity: sql<number>`SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END)`,
        total_out_value: sql<number>`SUM(CASE WHEN movement_type = 'OUT' THEN total_cost ELSE 0 END)`,
        total_in_quantity: sql<number>`SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END)`,
        total_in_value: sql<number>`SUM(CASE WHEN movement_type = 'IN' THEN total_cost ELSE 0 END)`,
        movement_count: count(),
        avg_cost: sql<number>`AVG(unit_cost)`
      })
      .from(stockMovements)
      .leftJoin(parts, eq(stockMovements.part_id, parts.id))
      .where(and(
        eq(stockMovements.tenantId, tenantId),
        gte(stockMovements.created_at, startDate),
        lte(stockMovements.created_at, endDate),
        eq(stockMovements.approval_status, 'APPROVED')
      ))
      .groupBy(stockMovements.part_id, parts.title, parts.internal_code)
      .orderBy(desc(sql`SUM(CASE WHEN movement_type = 'OUT' THEN total_cost ELSE 0 END)`));
  }

  async getInventoryValuation(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    return await db
      .select({
        location_id: inventoryMultiLocation.location_id,
        location_name: stockLocations.location_name,
        part_id: inventoryMultiLocation.part_id,
        part_title: parts.title,
        part_code: parts.internal_code,
        current_quantity: inventoryMultiLocation.current_quantity,
        unit_cost: inventoryMultiLocation.unit_cost,
        total_value: inventoryMultiLocation.total_value,
        category: parts.category
      })
      .from(inventoryMultiLocation)
      .leftJoin(parts, eq(inventoryMultiLocation.part_id, parts.id))
      .leftJoin(stockLocations, eq(inventoryMultiLocation.location_id, stockLocations.id))
      .where(and(
        eq(inventoryMultiLocation.tenantId, tenantId),
        sql`${inventoryMultiLocation.current_quantity} > 0`
      ))
      .orderBy(stockLocations.location_name, parts.title);
  }

  // ===== MÉTODOS AUXILIARES =====
  private async generateMovementNumber(tenantId: string, movementType: string): Promise<string> {
    const db = getTenantDb(tenantId);
    
    const prefix = movementType.substring(0, 2);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const [lastMovement] = await db
      .select({ movement_number: stockMovements.movement_number })
      .from(stockMovements)
      .where(and(
        eq(stockMovements.tenantId, tenantId),
        ilike(stockMovements.movement_number, `${prefix}${today}%`)
      ))
      .orderBy(desc(stockMovements.movement_number))
      .limit(1);

    let sequence = 1;
    if (lastMovement) {
      const lastSequence = parseInt(lastMovement.movement_number.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${today}${sequence.toString().padStart(4, '0')}`;
  }

  private async checkApprovalRequired(tenantId: string, movementType: string, totalValue: number): Promise<boolean> {
    const db = getTenantDb(tenantId);
    
    const [rule] = await db
      .select()
      .from(movementApprovalRules)
      .where(and(
        eq(movementApprovalRules.tenantId, tenantId),
        eq(movementApprovalRules.movement_type, movementType),
        eq(movementApprovalRules.is_active, true),
        lte(movementApprovalRules.minimum_value, totalValue)
      ))
      .limit(1);

    return rule?.requires_approval || false;
  }
}
