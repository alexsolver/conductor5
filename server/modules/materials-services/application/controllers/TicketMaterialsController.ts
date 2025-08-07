import type { Response, Request } from 'express';
import { db } from '../../../../db-tenant';
import {
  ticketLpuSettings,
  ticketPlannedItems,
  ticketConsumedItems,
  ticketCostsSummary
} from '../../../../../shared/schema-master';
import { items } from '../../../../../shared/schema-master';
import { eq, and, desc, sum, sql, alias } from 'drizzle-orm';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';
import type { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import schemaManager from '../../../../utils/schemaManager';
import * as crypto from 'crypto';


// Import audit function
async function createCompleteAuditEntry(
  pool: any,
  schemaName: string,
  tenantId: string,
  ticketId: string,
  req: AuthenticatedRequest,
  actionType: string,
  description: string,
  metadata: any = {}
) {
  try {
    const { getClientIP, getUserAgent, getSessionId } = await import('../../../../utils/ipCapture');
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const sessionId = getSessionId(req);

    // Get user name for history record
    const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [req.user?.id]);
    const userName = userResult.rows[0]?.full_name || 'Unknown User';

    await pool.query(`
      INSERT INTO "${schemaName}".ticket_history
      (tenant_id, ticket_id, action_type, description, performed_by, performed_by_name, ip_address, user_agent, session_id, created_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
    `, [
      tenantId,
      ticketId,
      actionType,
      description,
      req.user?.id,
      userName,
      ipAddress,
      userAgent,
      sessionId,
      JSON.stringify(metadata)
    ]);
  } catch (error) {
    console.error('Error creating audit entry:', error);
    throw error;
  }
}



export class TicketMaterialsController {
  // Get LPU settings for a ticket
  static async getTicketLpuSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      const lpuSettings = await db
        .select()
        .from(ticketLpuSettings)
        .where(and(
          eq(ticketLpuSettings.tenantId, tenantId),
          eq(ticketLpuSettings.ticketId, ticketId),
          eq(ticketLpuSettings.isActive, true)
        ))
        .orderBy(desc(ticketLpuSettings.appliedAt));

      return sendSuccess(res, { lpuSettings }, 'LPU settings retrieved successfully');
    } catch (error) {
      console.error('Error fetching LPU settings:', error);
      return sendError(res, error as Error, 'Failed to retrieve LPU settings');
    }
  }

  // Set/Update LPU for a ticket
  static async setTicketLpu(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { lpuId, notes } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !ticketId || !lpuId) {
        return sendError(res, 'Missing required fields', 'Missing required fields', 400);
      }

      // Deactivate existing LPU settings
      await db
        .update(ticketLpuSettings)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(ticketLpuSettings.tenantId, tenantId),
          eq(ticketLpuSettings.ticketId, ticketId)
        ));

      // Create new LPU setting
      const [newLpuSetting] = await db
        .insert(ticketLpuSettings)
        .values({
          tenantId,
          ticketId,
          lpuId,
          appliedById: userId,
          notes,
          isActive: true
        })
        .returning();

      return sendSuccess(res, { lpuSetting: newLpuSetting }, 'LPU setting created successfully', 201);
    } catch (error) {
      console.error('Error setting LPU:', error);
      return sendError(res, error as Error, 'Failed to set LPU');
    }
  }

  // Get planned items for a ticket
  static async getPlannedItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      const plannedItems = await db
        .select()
        .from(ticketPlannedItems)
        .leftJoin(items, eq(ticketPlannedItems.itemId, items.id))
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.isActive, true)
        ))
        .orderBy(desc(ticketPlannedItems.createdAt));

      return sendSuccess(res, { plannedItems }, 'Planned items retrieved successfully');
    } catch (error) {
      console.error('Error fetching planned items:', error);
      return sendError(res, error as Error, 'Failed to retrieve planned items');
    }
  }

  // Add planned item to ticket
  static async addPlannedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { itemId, plannedQuantity, lpuId, unitPriceAtPlanning, priority, notes } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      console.log('🔍 [ADD-PLANNED] Request data:', {
        ticketId,
        body: req.body,
        tenantId,
        userId,
        requiredFields: { itemId, plannedQuantity, lpuId, unitPriceAtPlanning }
      });

      if (!tenantId || !ticketId || !itemId || !plannedQuantity || !lpuId || unitPriceAtPlanning === undefined || unitPriceAtPlanning === null) {
        console.log('❌ [ADD-PLANNED] Missing fields check:', {
          tenantId: !!tenantId,
          ticketId: !!ticketId,
          itemId: !!itemId,
          plannedQuantity: !!plannedQuantity,
          lpuId: !!lpuId,
          unitPriceAtPlanning: !!unitPriceAtPlanning
        });
        return sendError(res, 'Missing required fields', 'Missing required fields', 400);
      }

      const estimatedCost = parseFloat(plannedQuantity) * parseFloat(unitPriceAtPlanning);

      const [plannedItem] = await db
        .insert(ticketPlannedItems)
        .values({
          tenantId,
          ticketId,
          itemId,
          plannedQuantity: plannedQuantity.toString(),
          lpuId,
          unitPriceAtPlanning: unitPriceAtPlanning.toString(),
          estimatedCost: estimatedCost.toString(),
          priority: priority || 'medium',
          notes,
          plannedById: userId,
          status: 'planned'
        })
        .returning();

      // 📝 Registrar no histórico do ticket
      try {
        console.log('🔍 [HISTORY] Iniciando registro de histórico para item planejado:', {
          ticketId,
          itemId,
          plannedQuantity,
          tenantId
        });

        const { pool } = await import('../../../../db');
        const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

        // Get item name for better description
        const itemDetails = await db
          .select({ name: items.name, type: items.type })
          .from(items)
          .where(eq(items.id, itemId))
          .limit(1);

        const itemName = itemDetails[0]?.name || 'Item desconhecido';
        const itemType = itemDetails[0]?.type || 'Tipo desconhecido';

        console.log('🔍 [HISTORY] Detalhes do item obtidos:', {
          itemName,
          itemType,
          schemaName
        });

        await createCompleteAuditEntry(
          pool, schemaName, tenantId, ticketId, req,
          'material_planned',
          `Item planejado adicionado: ${itemName} (Qtd: ${plannedQuantity})`,
          {
            action: 'planned_item_added',
            item_id: itemId,
            item_name: itemName,
            item_type: itemType,
            planned_quantity: plannedQuantity,
            priority: priority || 'medium',
            notes: notes || '',
            lpu_id: lpuId,
            planned_item_id: plannedItem.id,
            estimated_cost: estimatedCost.toString()
          }
        );

        console.log('✅ [HISTORY] Entrada de histórico criada com sucesso para item planejado');
      } catch (historyError: any) {
        console.error('❌ [HISTORY] Erro ao criar entrada no histórico:', historyError);
        console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
      }

      return sendSuccess(res, { plannedItem }, 'Planned item added successfully', 201);
    } catch (error) {
      console.error('Error adding planned item:', error);
      return sendError(res, error as Error, 'Failed to add planned item');
    }
  }

  // Remove planned item from ticket
  static async removePlannedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId, itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId || !itemId) {
        return sendError(res, 'Missing required fields', 'Missing required fields', 400);
      }

      // Get item details before deletion for history
      const itemToDelete = await db
        .select()
        .from(ticketPlannedItems)
        .leftJoin(items, eq(ticketPlannedItems.itemId, items.id))
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.id, itemId)
        ))
        .limit(1);

      await db
        .update(ticketPlannedItems)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.id, itemId)
        ));

      // 📝 Registrar no histórico do ticket
      try {
        const { pool } = await import('../../../../db');
        const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

        if (itemToDelete.length > 0) {
          const deletedItem = itemToDelete[0];
          const itemName = deletedItem.items?.name || 'Item desconhecido';
          const quantity = deletedItem.ticket_planned_items.plannedQuantity;

          await createCompleteAuditEntry(
            pool, schemaName, tenantId, ticketId, req,
            'material_planned_removed',
            `Item planejado removido: ${itemName} (Qtd: ${quantity})`,
            {
              action: 'planned_item_removed',
              item_id: deletedItem.ticket_planned_items.itemId,
              item_name: itemName,
              planned_quantity: quantity,
              planned_item_id: itemId,
              removal_reason: 'manual_deletion'
            }
          );
        }
      } catch (historyError: any) {
        console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
      }

      return sendSuccess(res, {}, 'Planned item removed successfully');
    } catch (error) {
      console.error('Error removing planned item:', error);
      return sendError(res, error as Error, 'Failed to remove planned item');
    }
  }

  // Get consumed items for a ticket
  static async getConsumedItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      const consumedItems = await db
        .select()
        .from(ticketConsumedItems)
        .leftJoin(items, eq(ticketConsumedItems.itemId, items.id))
        .where(and(
          eq(ticketConsumedItems.tenantId, tenantId),
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.isActive, true)
        ))
        .orderBy(desc(ticketConsumedItems.createdAt));

      return sendSuccess(res, { consumedItems }, 'Consumed items retrieved successfully');
    } catch (error) {
      console.error('Error fetching consumed items:', error);
      return sendError(res, error as Error, 'Failed to retrieve consumed items');
    }
  }

  // Add consumed item to ticket
  static async addConsumedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const {
        itemId,
        plannedItemId,
        actualQuantity,
        plannedQuantity,
        unitPriceAtConsumption,
        consumptionType,
        notes,
        batchNumber,
        serialNumber,
        warrantyPeriod
      } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !ticketId || !itemId || !actualQuantity || !unitPriceAtConsumption) {
        return sendError(res, 'Missing required fields', 'Missing required fields', 400);
      }

      const totalCost = parseFloat(actualQuantity) * parseFloat(unitPriceAtConsumption);

      const [consumedItem] = await db
        .insert(ticketConsumedItems)
        .values({
          tenantId,
          ticketId,
          itemId,
          plannedItemId,
          actualQuantity: actualQuantity.toString(),
          plannedQuantity: plannedQuantity?.toString() || '0',
          unitPriceAtConsumption: unitPriceAtConsumption.toString(),
          totalCost: totalCost.toString(),
          consumptionType: consumptionType || 'direct',
          consumedById: userId,
          consumedAt: new Date(),
          status: 'consumed',
          notes,
          batchNumber,
          serialNumber,
          warrantyPeriod
        })
        .returning();

      // 📝 Registrar no histórico do ticket
      try {
        console.log('🔍 [HISTORY] Iniciando registro de histórico para item consumido:', {
          ticketId,
          itemId,
          actualQuantity,
          tenantId
        });

        const { pool } = await import('../../../../db');
        const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

        // Get item name for better description
        const itemDetails = await db
          .select({ name: items.name, type: items.type })
          .from(items)
          .where(eq(items.id, itemId))
          .limit(1);

        const itemName = itemDetails[0]?.name || 'Item desconhecido';
        const itemType = itemDetails[0]?.type || 'Tipo desconhecido';

        console.log('🔍 [HISTORY] Detalhes do item obtidos para consumo:', {
          itemName,
          itemType,
          schemaName
        });

        await createCompleteAuditEntry(
          pool, schemaName, tenantId, ticketId, req,
          'material_consumed',
          `Item consumido registrado: ${itemName} (Qtd: ${actualQuantity})`,
          {
            action: 'consumed_item_added',
            item_id: itemId,
            item_name: itemName,
            item_type: itemType,
            planned_item_id: plannedItemId,
            actual_quantity: actualQuantity,
            planned_quantity: plannedQuantity,
            total_cost: totalCost.toString(),
            unit_price: unitPriceAtConsumption.toString(),
            consumption_type: consumptionType,
            consumed_item_id: consumedItem.id,
            notes: notes || ''
          }
        );

        console.log('✅ [HISTORY] Entrada de histórico criada com sucesso para item consumido');
      } catch (historyError: any) {
        console.error('❌ [HISTORY] Erro ao criar entrada no histórico:', historyError);
        console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
      }

      return sendSuccess(res, { consumedItem }, 'Consumed item added successfully', 201);
    } catch (error) {
      console.error('Error adding consumed item:', error);
      return sendError(res, error as Error, 'Failed to add consumed item');
    }
  }

  // Remove consumed item from ticket
  static async removeConsumedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId, itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId || !itemId) {
        return sendError(res, 'Missing required fields', 'Missing required fields', 400);
      }

      // Get item details before deletion for history
      const itemToDelete = await db
        .select()
        .from(ticketConsumedItems)
        .leftJoin(items, eq(ticketConsumedItems.itemId, items.id))
        .where(and(
          eq(ticketConsumedItems.tenantId, tenantId),
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.id, itemId)
        ))
        .limit(1);

      await db
        .update(ticketConsumedItems)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(ticketConsumedItems.tenantId, tenantId),
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.id, itemId)
        ));

      // 📝 Registrar no histórico do ticket
      try {
        const { pool } = await import('../../../../db');
        const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

        if (itemToDelete.length > 0) {
          const deletedItem = itemToDelete[0];
          const itemName = deletedItem.items?.name || 'Item desconhecido';
          const quantity = deletedItem.ticket_consumed_items.actualQuantity;

          await createCompleteAuditEntry(
            pool, schemaName, tenantId, ticketId, req,
            'material_consumed_removed',
            `Item consumido removido: ${itemName} (Qtd: ${quantity})`,
            {
              action: 'consumed_item_removed',
              item_id: deletedItem.ticket_consumed_items.itemId,
              item_name: itemName,
              actual_quantity: quantity,
              consumed_item_id: itemId,
              removal_reason: 'manual_deletion'
            }
          );
        }
      } catch (historyError: any) {
        console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
      }

      return sendSuccess(res, {}, 'Consumed item removed successfully');
    } catch (error) {
      console.error('Error removing consumed item:', error);
      return sendError(res, error as Error, 'Failed to remove consumed item');
    }
  }

  // Get cost summary for a ticket
  static async getCostsSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      // Calculate planned costs
      const plannedCostsQuery = await db
        .select({
          totalEstimatedCost: sql<number>`SUM(CAST(${ticketPlannedItems.estimatedCost} as DECIMAL))`,
          totalPlannedItems: sql<number>`COUNT(*)`
        })
        .from(ticketPlannedItems)
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.isActive, true)
        ));

      // Calculate consumed costs
      const consumedCostsQuery = await db
        .select({
          totalActualCost: sql<number>`SUM(CAST(${ticketConsumedItems.totalCost} as DECIMAL))`,
          totalConsumedItems: sql<number>`COUNT(*)`
        })
        .from(ticketConsumedItems)
        .where(and(
          eq(ticketConsumedItems.tenantId, tenantId),
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.isActive, true)
        ));

      const plannedCosts = plannedCostsQuery[0];
      const consumedCosts = consumedCostsQuery[0];

      const summary = {
        planned: {
          totalEstimatedCost: plannedCosts.totalEstimatedCost || 0,
          totalItems: plannedCosts.totalPlannedItems || 0
        },
        consumed: {
          totalActualCost: consumedCosts.totalActualCost || 0,
          totalItems: consumedCosts.totalConsumedItems || 0
        },
        variance: {
          costDifference: (consumedCosts.totalActualCost || 0) - (plannedCosts.totalEstimatedCost || 0),
          itemsDifference: (consumedCosts.totalConsumedItems || 0) - (plannedCosts.totalPlannedItems || 0)
        }
      };

      return sendSuccess(res, { summary }, 'Costs summary retrieved successfully');
    } catch (error) {
      console.error('Error fetching costs summary:', error);
      return sendError(res, error as Error, 'Failed to retrieve costs summary');
    }
  }

  // Get available items for consumption (items that were planned but not fully consumed)
  static async getAvailableForConsumption(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId;

      console.log('🔍 [AVAILABLE-FOR-CONSUMPTION] Request data:', {
        ticketId,
        tenantId
      });

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      // Get all planned items with their consumption data
      const availableItems = await db
        .select({
          plannedItem: ticketPlannedItems,
          item: items,
          consumedQuantity: sql<number>`COALESCE(SUM(CAST(consumed.actual_quantity as DECIMAL)), 0)`
        })
        .from(ticketPlannedItems)
        .leftJoin(items, eq(ticketPlannedItems.itemId, items.id))
        .leftJoin(
          ticketConsumedItems,
          and(
            eq(ticketConsumedItems.plannedItemId, ticketPlannedItems.id),
            eq(ticketConsumedItems.isActive, true)
          ),
          'consumed'
        )
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.isActive, true)
        ))
        .groupBy(ticketPlannedItems.id, items.id);

      // Filter items that still have available quantity
      const itemsWithAvailableQuantity = availableItems.filter(item => {
        const plannedQty = parseFloat(item.plannedItem.plannedQuantity);
        const consumedQty = item.consumedQuantity || 0;
        return plannedQty > consumedQty;
      });

      console.log(`✅ [AVAILABLE-FOR-CONSUMPTION] Found items: ${itemsWithAvailableQuantity.length}`);

      return sendSuccess(res, { availableItems: itemsWithAvailableQuantity }, 'Available items retrieved successfully');
    } catch (error) {
      console.error('Error fetching available items for consumption:', error);
      return sendError(res, error as Error, 'Failed to retrieve available items');
    }
  }

  // Get item links
  static async getItemLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return sendError(res, 'Tenant ID is required', 'Tenant ID is required', 400);
      }

      // Query item links with target item details
      const itemLinks = await db
        .select({
          id: sql`il.id`,
          sourceItemId: sql`il.source_item_id`,
          targetItemId: sql`il.target_item_id`,
          linkType: sql`il.link_type`,
          quantity: sql`il.quantity`,
          description: sql`il.description`,
          targetItem: {
            id: sql`target_item.id`,
            name: sql`target_item.name`,
            type: sql`target_item.type`
          },
          createdAt: sql`il.created_at`
        })
        .from(sql`(SELECT * FROM item_links WHERE tenant_id = ${tenantId} AND source_item_id = ${itemId}) il`)
        .leftJoin(sql`items target_item`, sql`target_item.id = il.target_item_id AND target_item.tenant_id = ${tenantId}`);

      return sendSuccess(res, { itemLinks }, 'Item links retrieved successfully');
    } catch (error) {
      console.error('Error fetching item links:', error);
      return sendError(res, error as Error, 'Failed to fetch item links');
    }
  }

  // Create item link
  static async createItemLink(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { sourceItemId, targetItemId, linkType, quantity, description } = req.body;

      if (!tenantId) {
        return sendError(res, 'Tenant ID is required', 'Tenant ID is required', 400);
      }

      if (!sourceItemId || !targetItemId || !linkType) {
        return sendError(res, 'Source item, target item, and link type are required', 'Missing required fields', 400);
      }

      // Create item link using raw SQL
      const linkId = crypto.randomUUID();
      const { pool } = await import('../../../../db');
      
      const result = await pool.query(`
        INSERT INTO item_links (id, tenant_id, source_item_id, target_item_id, link_type, quantity, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [linkId, tenantId, sourceItemId, targetItemId, linkType, quantity || 1, description || '']);

      return sendSuccess(res, { itemLink: result.rows[0] }, 'Item link created successfully', 201);
    } catch (error) {
      console.error('Error creating item link:', error);
      return sendError(res, error as Error, 'Failed to create item link');
    }
  }

  // Delete item link
  async deleteItemLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant ID is required' });
      }

      await this.repository.deleteItemLink(tenantId, linkId);

      res.json({
        success: true,
        message: 'Item link deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting item link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete item link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create customer personalization
  static async createCustomerPersonalization(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { itemId, customerId, customSku, customName, customDescription } = req.body;

      if (!tenantId || !itemId || !customerId) {
        return sendError(res, 'Tenant ID, item ID, and customer ID are required', 'Missing required fields', 400);
      }

      const personalizationId = crypto.randomUUID();
      const { pool } = await import('../../../../db');

      // Get customer name for display
      const customerResult = await pool.query(`
        SELECT name, trade_name FROM customers WHERE id = $1 AND tenant_id = $2
      `, [customerId, tenantId]);

      const customerName = customerResult.rows[0]?.name || customerResult.rows[0]?.trade_name || 'Cliente desconhecido';

      const result = await pool.query(`
        INSERT INTO customer_personalizations 
        (id, tenant_id, item_id, customer_id, customer_name, custom_sku, custom_name, custom_description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
        RETURNING *
      `, [personalizationId, tenantId, itemId, customerId, customerName, customSku || '', customName || '', customDescription || '']);

      return sendSuccess(res, { personalization: result.rows[0] }, 'Customer personalization created successfully', 201);
    } catch (error) {
      console.error('Error creating customer personalization:', error);
      return sendError(res, error as Error, 'Failed to create customer personalization');
    }
  }

  // Get customer personalizations
  static async getCustomerPersonalizations(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return sendError(res, 'Tenant ID is required', 'Tenant ID is required', 400);
      }

      const { pool } = await import('../../../../db');

      const result = await pool.query(`
        SELECT 
          cp.*,
          c.name as customer_display_name,
          c.trade_name as customer_trade_name
        FROM customer_personalizations cp
        LEFT JOIN customers c ON c.id = cp.customer_id AND c.tenant_id = cp.tenant_id
        WHERE cp.tenant_id = $1 AND cp.item_id = $2 AND cp.is_active = true
        ORDER BY cp.created_at DESC
      `, [tenantId, itemId]);

      const personalizations = result.rows.map(row => ({
        ...row,
        customerName: row.customer_display_name || row.customer_trade_name || row.customer_name || 'Cliente desconhecido'
      }));

      return sendSuccess(res, { personalizations }, 'Customer personalizations retrieved successfully');
    } catch (error) {
      console.error('Error fetching customer personalizations:', error);
      return sendError(res, error as Error, 'Failed to fetch customer personalizations');
    }
  }

  // Create supplier link
  static async createSupplierLink(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { itemId, supplierId, price, currency, leadTime, isPreferred } = req.body;

      if (!tenantId || !itemId || !supplierId) {
        return sendError(res, 'Tenant ID, item ID, and supplier ID are required', 'Missing required fields', 400);
      }

      const supplierLinkId = crypto.randomUUID();
      const { pool } = await import('../../../../db');

      // Get supplier name for display
      const supplierResult = await pool.query(`
        SELECT name, trade_name FROM suppliers WHERE id = $1 AND tenant_id = $2
      `, [supplierId, tenantId]);

      const supplierName = supplierResult.rows[0]?.name || supplierResult.rows[0]?.trade_name || 'Fornecedor desconhecido';

      const result = await pool.query(`
        INSERT INTO supplier_links 
        (id, tenant_id, item_id, supplier_id, supplier_name, price, currency, lead_time, is_preferred, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, [supplierLinkId, tenantId, itemId, supplierId, supplierName, price || 0, currency || 'BRL', leadTime || 0, isPreferred || false]);

      return sendSuccess(res, { supplierLink: result.rows[0] }, 'Supplier link created successfully', 201);
    } catch (error) {
      console.error('Error creating supplier link:', error);
      return sendError(res, error as Error, 'Failed to create supplier link');
    }
  }

  // Get supplier links
  static async getSupplierLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return sendError(res, 'Tenant ID is required', 'Tenant ID is required', 400);
      }

      const { pool } = await import('../../../../db');

      const result = await pool.query(`
        SELECT 
          sl.*,
          s.name as supplier_display_name,
          s.trade_name as supplier_trade_name
        FROM supplier_links sl
        LEFT JOIN suppliers s ON s.id = sl.supplier_id AND s.tenant_id = sl.tenant_id
        WHERE sl.tenant_id = $1 AND sl.item_id = $2
        ORDER BY sl.is_preferred DESC, sl.created_at DESC
      `, [tenantId, itemId]);

      const supplierLinks = result.rows.map(row => ({
        ...row,
        supplierName: row.supplier_display_name || row.supplier_trade_name || row.supplier_name || 'Fornecedor desconhecido'
      }));

      return sendSuccess(res, { supplierLinks }, 'Supplier links retrieved successfully');
    } catch (error) {
      console.error('Error fetching supplier links:', error);
      return sendError(res, error as Error, 'Failed to fetch supplier links');
    }
  }
}