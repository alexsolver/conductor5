import { eq, and, desc, sum, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
// AuthenticatedRequest type (extending Express Request with user info)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
  query: any;
  sessionID?: string;
}
import crypto from 'crypto';
import { 
  ticketPlannedItems, 
  ticketConsumedItems, 
  items,
  priceLists,
  pricingRules
} from '@shared/schema';

export class TicketMaterialsController {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Get all price lists for a tenant
  async getPriceLists(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.params;
      const userId = req.user?.id || 'unknown';

      // Audit log
      await this.logAuditEntry(
        tenantId,
        'ticket_materials',
        'read',
        'get_price_lists',
        'Retrieved price lists',
        userId,
        req.user?.email || 'unknown',
        (req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress || 'unknown').split(',')[0].trim(),
        req.headers['user-agent'] || 'unknown',
        req.sessionID || 'unknown',
        JSON.stringify({ tenantId })
      );

      const priceList = await this.db
        .select()
        .from(priceLists)
        .where(eq(priceLists.tenantId, tenantId));

      return res.json({
        success: true,
        data: priceList || []
      });
    } catch (error) {
      console.error('❌ Get price lists error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve price lists'
      });
    }
  }

  // Apply LPU to ticket
  async applyLpuToTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { lpuId, notes, appliedBy } = req.body;
      const tenantId = req.user?.tenantId || req.body.tenantId;
      const userId = req.user?.id || 'unknown';

      const applicationData = {
        id: crypto.randomUUID(),
        tenantId,
        ticketId,
        priceListId: lpuId,
        notes: notes || '',
        appliedBy: appliedBy || userId,
        appliedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Note: ticketLpuApplications table structure needs to be added to schema
      // For now, we'll just log the application
      console.log('📋 LPU Application:', applicationData);

      // Audit log
      await this.logAuditEntry(
        tenantId,
        'ticket_materials',
        'create',
        'apply_lpu',
        'Applied LPU to ticket',
        userId,
        req.user?.email || 'unknown',
        (req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress || 'unknown').split(',')[0].trim(),
        req.headers['user-agent'] || 'unknown',
        req.sessionID || 'unknown',
        JSON.stringify({ ticketId, lpuId })
      );

      return res.json({
        success: true,
        message: 'LPU applied to ticket successfully',
        data: applicationData
      });
    } catch (error) {
      console.error('❌ Apply LPU error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to apply LPU to ticket'
      });
    }
  }

  // Get available items for consumption
  async getAvailableForConsumption(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId || req.query.tenantId as string;

      const availableItems = await this.db
        .select()
        .from(ticketPlannedItems)
        .where(and(
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.tenantId, tenantId)
        ));

      return res.json({
        success: true,
        data: availableItems.map((item: any) => ({
          ...item,
          availableQuantity: item.plannedQuantity
        }))
      });
    } catch (error) {
      console.error('❌ Get available items error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve available items'
      });
    }
  }

  // Get consumed items
  async getConsumedItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId || req.query.tenantId as string;

      console.log('🔍 [GET-CONSUMED-ITEMS] Fetching for ticket:', ticketId, 'tenant:', tenantId);

      // Import pool for direct SQL queries
      const { pool } = await import('../../../../db');

      // Use raw SQL to get consumed items with item details
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const query = `
        SELECT 
          tci.*,
          i.name as item_name,
          i.description as item_description,
          i.measurement_unit,
          i.type as item_type
        FROM "${schemaName}".ticket_consumed_items tci
        LEFT JOIN "${schemaName}".items i ON tci.item_id = i.id
        WHERE tci.ticket_id = $1 AND tci.tenant_id = $2
        ORDER BY tci.created_at DESC
      `;

      const result = await pool.query(query, [ticketId, tenantId]);

      const consumedItems = result.rows.map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id,
        ticketId: row.ticket_id,
        itemId: row.item_id,
        itemName: row.item_name || 'Item não encontrado',
        itemDescription: row.item_description,
        measurementUnit: row.measurement_unit,
        itemType: row.item_type,
        actualQuantity: parseFloat(row.actual_quantity || 0),
        unitPriceAtConsumption: parseFloat(row.unit_price_at_consumption || 0),
        totalCost: parseFloat(row.total_cost || 0),
        consumptionType: row.consumption_type,
        notes: row.notes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log('✅ [GET-CONSUMED-ITEMS] Found', consumedItems.length, 'consumed items');

      return res.json({
        success: true,
        data: { consumedItems }
      });
    } catch (error) {
      console.error('❌ Get consumed items error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve consumed items',
        data: { consumedItems: [] }
      });
    }
  }

  // Add planned item
  async addPlannedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const {
        itemId,
        plannedQuantity,
        lpuId,
        unitPriceAtPlanning,
        priority = 'medium',
        notes = ''
      } = req.body;

      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
      }

      // Enhance price lookup if unitPriceAtPlanning is 0 or not provided
      let finalUnitPrice = parseFloat(unitPriceAtPlanning || 0);

      if (finalUnitPrice === 0 && itemId) {
        console.log('💰 [BACKEND-PRICE-LOOKUP] Attempting to find price for item:', itemId);

        try {
          // Set tenant schema for price lookup
          const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
          await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`));

          // Look for item in active price lists
          const priceQuery = await this.db.execute(sql`
            SELECT pli.unit_price, pli.special_price
            FROM price_list_items pli
            JOIN price_lists pl ON pli.price_list_id = pl.id
            WHERE pli.item_id = ${itemId} 
              AND pli.tenant_id = ${tenantId}
              AND pl.is_active = true
              AND pli.is_active = true
            ORDER BY pl.created_at DESC
            LIMIT 1
          `);

          if (priceQuery.rows && priceQuery.rows.length > 0) {
            const priceRow = priceQuery.rows[0];
            finalUnitPrice = parseFloat(priceRow.special_price || priceRow.unit_price || 0);
            console.log('💰 [BACKEND-PRICE-LOOKUP] Found LPU price:', finalUnitPrice);
          } else {
            // Fallback to item catalog price using correct column names
            const itemQuery = await this.db.execute(sql`
              SELECT unit_cost, price
              FROM items
              WHERE id = ${itemId} AND tenant_id = ${tenantId}
              LIMIT 1
            `);

            if (itemQuery.rows && itemQuery.rows.length > 0) {
              const itemRow = itemQuery.rows[0];
              finalUnitPrice = parseFloat(itemRow.unit_cost || itemRow.price || 0);
              console.log('💰 [BACKEND-PRICE-LOOKUP] Found item catalog price:', finalUnitPrice);
            }
          }
        } catch (priceError) {
          console.error('❌ [BACKEND-PRICE-LOOKUP] Error:', priceError);
        }
      }

      // Calculate estimated cost with the final price
      const estimatedCost = parseFloat(plannedQuantity) * finalUnitPrice;

      const newPlannedItem = {
        id: crypto.randomUUID(),
        tenantId,
        ticketId,
        itemId,
        plannedQuantity: parseFloat(plannedQuantity),
        lpuId,
        unitPriceAtPlanning: finalUnitPrice,
        estimatedCost,
        status: 'planned',
        priority,
        notes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        plannedById: req.user?.id
      };

      // Import pool for direct insertion
      const { pool } = await import('../../../../db');

      // Use direct SQL insertion to avoid Drizzle issues
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const insertQuery = `
        INSERT INTO "${schemaName}".ticket_planned_items (
          id, tenant_id, ticket_id, item_id, planned_quantity, lpu_id,
          unit_price_at_planning, estimated_cost, status, priority, notes,
          is_active, created_at, updated_at, planned_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      await pool.query(insertQuery, [
        newPlannedItem.id,
        newPlannedItem.tenantId,
        newPlannedItem.ticketId,
        newPlannedItem.itemId,
        newPlannedItem.plannedQuantity,
        newPlannedItem.lpuId,
        newPlannedItem.unitPriceAtPlanning,
        newPlannedItem.estimatedCost,
        newPlannedItem.status,
        newPlannedItem.priority,
        newPlannedItem.notes,
        newPlannedItem.isActive,
        newPlannedItem.createdAt,
        newPlannedItem.updatedAt,
        newPlannedItem.plannedById
      ]);

      return res.json({
        success: true,
        message: 'Planned item added successfully',
        data: newPlannedItem
      });
    } catch (error) {
      console.error('❌ Add planned item error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add planned item'
      });
    }
  }

  // Delete planned item
  async deletePlannedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId, itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
      }

      console.log('🗑️ [DELETE-PLANNED-ITEM] Deleting item:', itemId, 'for ticket:', ticketId, 'tenant:', tenantId);

      // Import pool for direct deletion
      const { pool } = await import('../../../../db');

      // Use direct SQL deletion to avoid Drizzle issues
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const deleteQuery = `
        DELETE FROM "${schemaName}".ticket_planned_items 
        WHERE id = $1 AND ticket_id = $2 AND tenant_id = $3
      `;

      const result = await pool.query(deleteQuery, [itemId, ticketId, tenantId]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Item planejado não encontrado'
        });
      }

      console.log('✅ [DELETE-PLANNED-ITEM] Successfully deleted item:', itemId);

      return res.json({
        success: true,
        message: 'Item planejado excluído com sucesso'
      });
    } catch (error) {
      console.error('❌ Delete planned item error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete planned item'
      });
    }
  }

  // Add consumed item
  async addConsumedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const {
        itemId,
        actualQuantity,
        unitPriceAtConsumption,
        plannedItemId,
        lpuId,
        consumptionType = 'used',
        notes = ''
      } = req.body;

      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
      }

      console.log('🔍 [ADD-CONSUMED-ITEM] Adding consumed item:', {
        ticketId,
        itemId,
        actualQuantity,
        unitPriceAtConsumption
      });

      // Calculate total cost ensuring it's never null
      const quantity = parseFloat(actualQuantity || 0);
      const unitPrice = parseFloat(unitPriceAtConsumption || 0);
      const totalCost = quantity * unitPrice;

      const newConsumedItem = {
        id: crypto.randomUUID(),
        tenantId,
        ticketId,
        itemId,
        plannedItemId: plannedItemId || null,
        actualQuantity: quantity,
        unitPriceAtConsumption: unitPrice,
        totalCost: totalCost,
        lpuId: lpuId || '00000000-0000-0000-0000-000000000001',
        consumptionType,
        notes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'consumed'
      };

      // Import pool for direct insertion
      const { pool } = await import('../../../../db');

      // Use direct SQL insertion to avoid Drizzle issues
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const insertQuery = `
        INSERT INTO "${schemaName}".ticket_consumed_items (
          id, tenant_id, ticket_id, item_id, planned_item_id, actual_quantity,
          unit_price_at_consumption, total_cost, lpu_id, consumption_type, notes,
          is_active, created_at, updated_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      await pool.query(insertQuery, [
        newConsumedItem.id,
        newConsumedItem.tenantId,
        newConsumedItem.ticketId,
        newConsumedItem.itemId,
        newConsumedItem.plannedItemId,
        newConsumedItem.actualQuantity,
        newConsumedItem.unitPriceAtConsumption,
        newConsumedItem.totalCost,
        newConsumedItem.lpuId,
        newConsumedItem.consumptionType,
        newConsumedItem.notes,
        newConsumedItem.isActive,
        newConsumedItem.createdAt,
        newConsumedItem.updatedAt,
        newConsumedItem.status
      ]);

      console.log('✅ [ADD-CONSUMED-ITEM] Successfully added consumed item:', newConsumedItem.id);

      return res.json({
        success: true,
        message: 'Consumed item added successfully',
        data: newConsumedItem
      });
    } catch (error) {
      console.error('❌ Add consumed item error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add consumed item'
      });
    }
  }

  // Get planned items
  async getPlannedItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId || req.query.tenantId as string;

      console.log('🔍 [GET-PLANNED-ITEMS] Fetching for ticket:', ticketId, 'tenant:', tenantId);

      // Import pool for direct SQL queries
      const { pool } = await import('../../../../db');

      // Use raw SQL to get planned items with item details
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const query = `
        SELECT 
          tpi.*,
          i.name as item_name,
          i.description as item_description,
          i.measurement_unit,
          i.type as item_type,
          false as has_children,
          0 as children_count
        FROM "${schemaName}".ticket_planned_items tpi
        LEFT JOIN "${schemaName}".items i ON tpi.item_id = i.id
        WHERE tpi.ticket_id = $1 AND tpi.tenant_id = $2
        ORDER BY tpi.created_at DESC
      `;

      const result = await pool.query(query, [ticketId, tenantId, tenantId]);

      const plannedItems = result.rows.map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id,
        ticketId: row.ticket_id,
        itemId: row.item_id,
        itemName: row.item_name || 'Item não encontrado',
        itemDescription: row.item_description,
        measurementUnit: row.measurement_unit,
        itemType: row.item_type,
        lpuId: row.lpu_id,
        plannedQuantity: parseFloat(row.planned_quantity || 0),
        unitPrice: parseFloat(row.unit_price || 0),
        totalCost: parseFloat(row.total_cost || 0),
        status: row.status,
        notes: row.notes,
        isActive: row.is_active,
        hasChildren: row.has_children,
        childrenCount: parseInt(row.children_count || 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log('✅ [GET-PLANNED-ITEMS] Found', plannedItems.length, 'planned items');

      return res.json({
        success: true,
        data: { plannedItems }
      });
    } catch (error) {
      console.error('❌ Get planned items error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve planned items',
        data: { plannedItems: [] }
      });
    }
  }

  // Get cost summary
  async getCostSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId || req.query.tenantId as string;

      const plannedCost = await this.db
        .select({ total: sum(ticketPlannedItems.estimatedCost) })
        .from(ticketPlannedItems)
        .where(and(
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.tenantId, tenantId)
        ));

      const consumedCost = await this.db
        .select({ total: sum(ticketConsumedItems.totalCost) })
        .from(ticketConsumedItems)
        .where(and(
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.tenantId, tenantId)
        ));

      return res.json({
        success: true,
        data: {
          plannedCost: plannedCost[0]?.total || '0',
          consumedCost: consumedCost[0]?.total || '0',
          variance: (parseFloat(consumedCost[0]?.total || '0') - parseFloat(plannedCost[0]?.total || '0')).toFixed(2)
        }
      });
    } catch (error) {
      console.error('❌ Get cost summary error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve cost summary'
      });
    }
  }

  // Audit logging helper
  private async logAuditEntry(
    tenantId: string,
    tableName: string,
    actionType: string,
    action: string,
    description: string,
    userId: string,
    userName: string,
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    metadata: string
  ) {
    try {
      // Simplified audit logging - can be enhanced as needed
      console.log(`📝 Audit: ${action} by ${userName} (${userId})`);
    } catch (error) {
      console.error('❌ Audit log error:', error);
    }
  }
}

export default TicketMaterialsController;