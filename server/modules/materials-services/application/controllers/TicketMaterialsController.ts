import type { Response, Request } from 'express';
import { db } from '../../../../db';
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


// Create audit entry helper function
async function createAuditEntry(
  tenantId: string,
  ticketId: string,
  actionType: string,
  description: string,
  metadata: any = {},
  req: any
) {
  try {
    // Simplified audit entry without IP capture due to import issues
    const { pool } = await import('../../../../db');
    
    // Get user name
    const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [req.user?.id]);
    const userName = userResult.rows[0]?.full_name || req.user?.email || 'Unknown User';

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

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
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      req.headers['user-agent'] || 'unknown',
      req.sessionID || 'unknown',
      JSON.stringify(metadata)
    ]);

    console.log(`✅ Audit entry created: ${actionType} for ticket ${ticketId}`);
  } catch (error) {
    console.error('❌ Error creating audit entry:', error);
    // Don't throw error to avoid breaking the main operation
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
      const { priceListId, notes, appliedBy } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      // Check if price list exists
      const priceList = await db
        .select()
        .from(priceLists)
        .where(and(
          eq(priceLists.id, priceListId),
          eq(priceLists.tenantId, tenantId),
          eq(priceLists.isActive, true)
        ))
        .limit(1);

      if (!priceList.length) {
        return sendError(res, 'Price list not found', 'Price list not found', 404);
      }

      // Check if LPU setting already exists
      const existingSetting = await db
        .select()
        .from(ticketLpuSettings)
        .where(and(
          eq(ticketLpuSettings.tenantId, tenantId),
          eq(ticketLpuSettings.ticketId, ticketId),
          eq(ticketLpuSettings.isActive, true)
        ))
        .limit(1);

      let auditAction = 'lpu_applied';
      let auditDescription = `Lista de preços aplicada: ${priceList[0].name}`;

      if (existingSetting.length > 0) {
        // Deactivate existing setting
        await db
          .update(ticketLpuSettings)
          .set({ isActive: false })
          .where(eq(ticketLpuSettings.id, existingSetting[0].id));

        auditAction = 'lpu_changed';
        auditDescription = `Lista de preços alterada para: ${priceList[0].name}`;
      }

      // Create new LPU setting
      const lpuSetting = {
        id: crypto.randomUUID(),
        tenantId,
        ticketId,
        priceListId,
        notes: notes || '',
        appliedBy: appliedBy || req.user.id,
        appliedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(ticketLpuSettings).values(lpuSetting);

      // Create audit entry for LPU setting
      await createAuditEntry(
        tenantId,
        ticketId,
        auditAction,
        auditDescription,
        {
          price_list_id: priceListId,
          price_list_name: priceList[0].name,
          notes: notes || '',
          applied_by: appliedBy || req.user.id,
          lpu_setting_id: lpuSetting.id,
          previous_setting_id: existingSetting.length > 0 ? existingSetting[0].id : null,
          action_time: new Date().toISOString()
        },
        req
      );

      return sendSuccess(res, lpuSetting, 'LPU setting applied successfully', 201);
    } catch (error) {
      console.error('Error setting ticket LPU:', error);
      return sendError(res, error, 'Failed to set ticket LPU', 500);
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

      // First, get the planned items
      const plannedItemsQuery = await db
        .select()
        .from(ticketPlannedItems)
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.isActive, true)
        ))
        .orderBy(desc(ticketPlannedItems.createdAt));

      console.log(`🔍 [GET-PLANNED-FIXED] Found ${plannedItemsQuery.length} planned items`);

      // For each planned item, get the item data and LPU pricing
      const plannedItemsWithPricing = await Promise.all(
        plannedItemsQuery.map(async (plannedItem: any) => {
          // Get item data separately
          let itemData = null;
          if (plannedItem.itemId) {
            try {
              const itemQuery = await db
                .select()
                .from(items)
                .where(and(
                  eq(items.id, plannedItem.itemId),
                  eq(items.tenantId, tenantId)
                ))
                .limit(1);
              
              itemData = itemQuery.length > 0 ? itemQuery[0] : null;
            } catch (itemError) {
              console.log('⚠️ [GET-PLANNED] Error fetching item data:', itemError);
            }
          }
          
          let effectivePrice = parseFloat(plannedItem.unitPriceAtPlanning || '0');
          let lpuUnitPrice = null;
          let lpuSpecialPrice = null;

          // Try to get LPU pricing if LPU ID is valid
          if (plannedItem.lpuId && plannedItem.lpuId !== '00000000-0000-0000-0000-000000000001') {
            try {
              const { pool } = await import('../../../../db');
              const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
              
              const lpuResult = await pool.query(`
                SELECT unit_price, special_price
                FROM "${schemaName}".price_list_items
                WHERE item_id = $1 AND price_list_id = $2 AND is_active = true
                LIMIT 1
              `, [plannedItem.itemId, plannedItem.lpuId]);

              if (lpuResult.rows.length > 0) {
                const lpuData = lpuResult.rows[0];
                lpuUnitPrice = lpuData.unit_price;
                lpuSpecialPrice = lpuData.special_price;
                
                // Use LPU price if available
                effectivePrice = parseFloat(lpuData.special_price || lpuData.unit_price || plannedItem.unitPriceAtPlanning || '0');
              }
            } catch (lpuError) {
              console.log('⚠️ [GET-PLANNED] Error fetching LPU pricing:', lpuError);
            }
          }

          const calculatedCost = parseFloat(plannedItem.plannedQuantity || '0') * effectivePrice;

          return {
            ticket_planned_items: {
              ...plannedItem,
              unitPriceAtPlanning: effectivePrice.toString(),
              estimatedCost: calculatedCost.toString()
            },
            items: itemData ? {
              ...itemData,
              price: effectivePrice.toString(),
              unitCost: effectivePrice.toString(),
              lpuUnitPrice: lpuUnitPrice?.toString(),
              lpuSpecialPrice: lpuSpecialPrice?.toString(),
              effectivePrice: effectivePrice.toString()
            } : null
          };
        })
      );

      console.log(`✅ [GET-PLANNED] Retrieved ${plannedItemsWithPricing.length} planned items with LPU pricing`);

      return sendSuccess(res, { plannedItems: plannedItemsWithPricing }, 'Planned items retrieved successfully');
    } catch (error) {
      console.error('Error fetching planned items:', error);
      return sendError(res, error as Error, 'Failed to retrieve planned items');
    }
  }

  // Add planned item to ticket
  static async addPlannedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { itemId, plannedQuantity, unitPriceAtPlanning, lpuId, priority, notes } = req.body;
      const tenantId = req.user?.tenantId;

      console.log('🔍 [ADD-PLANNED] Request data:', {
        ticketId,
        body: req.body,
        tenantId,
        userId: req.user?.id
      });

      if (!tenantId || !ticketId || !itemId || !plannedQuantity) {
        console.log('❌ [ADD-PLANNED] Missing required fields:', {
          tenantId: !!tenantId,
          ticketId: !!ticketId,
          itemId: !!itemId,
          plannedQuantity: !!plannedQuantity
        });
        return sendError(res, 'Missing required fields', 'Missing required fields', 400);
      }

      // Get item details with LPU pricing - more comprehensive query
      let item = null;
      let actualUnitPrice = parseFloat(unitPriceAtPlanning || '0');

      try {
        // First, try to get item with LPU pricing if LPU is provided
        if (lpuId && lpuId !== '00000000-0000-0000-0000-000000000001') {
          const { pool } = await import('../../../../db');
          const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
          
          const lpuItemResult = await pool.query(`
            SELECT 
              i.*,
              pli.unit_price as lpu_unit_price,
              pli.special_price as lpu_special_price
            FROM "${schemaName}".items i
            LEFT JOIN "${schemaName}".price_list_items pli ON pli.item_id = i.id AND pli.price_list_id = $2
            WHERE i.id = $1 AND i.tenant_id = $3 AND i.active = true
          `, [itemId, lpuId, tenantId]);

          if (lpuItemResult.rows.length > 0) {
            const itemData = lpuItemResult.rows[0];
            item = itemData;
            // Use LPU price if available, otherwise fall back to provided price
            actualUnitPrice = parseFloat(itemData.lpu_special_price || itemData.lpu_unit_price || unitPriceAtPlanning || '0');
            console.log('💰 [ADD-PLANNED] Using LPU pricing:', actualUnitPrice);
          }
        }

        // If no LPU pricing found, get basic item info
        if (!item) {
          const itemResult = await db
            .select()
            .from(items)
            .where(and(
              eq(items.id, itemId),
              eq(items.tenantId, tenantId),
              eq(items.active, true)
            ))
            .limit(1);

          if (itemResult.length > 0) {
            item = itemResult[0];
            // Use provided price if no LPU price was found
            if (actualUnitPrice === 0) {
              actualUnitPrice = parseFloat(unitPriceAtPlanning || '0');
            }
            console.log('💰 [ADD-PLANNED] Using item base pricing:', actualUnitPrice);
          }
        }
      } catch (itemError) {
        console.log('⚠️ [ADD-PLANNED] Error fetching item details:', itemError);
      }

      // Calculate estimated cost with actual unit price
      const estimatedCost = parseFloat(plannedQuantity) * actualUnitPrice;

      const plannedItemData = {
        id: crypto.randomUUID(),
        tenantId,
        ticketId,
        itemId,
        plannedQuantity: plannedQuantity.toString(),
        unitPriceAtPlanning: actualUnitPrice.toString(),
        estimatedCost: estimatedCost.toString(),
        lpuId: lpuId || '00000000-0000-0000-0000-000000000001', // Default LPU
        priority: priority || 'medium',
        status: 'planned',
        notes: notes || '',
        createdBy: req.user?.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('🔍 [ADD-PLANNED] Inserting planned item:', plannedItemData);

      const [insertedItem] = await db
        .insert(ticketPlannedItems)
        .values(plannedItemData)
        .returning();

      // Create audit entry for planned item addition
      const itemName = item?.name || item?.title || 'Item não encontrado';
      await createAuditEntry(
        tenantId,
        ticketId,
        'material_planned_added',
        `Material planejado adicionado: ${itemName} (Qtd: ${plannedQuantity})`,
        {
          item_id: itemId,
          item_name: itemName,
          item_type: item?.type || 'unknown',
          quantity: parseFloat(plannedQuantity),
          estimated_cost: estimatedCost,
          unit_price: actualUnitPrice,
          notes: notes || '',
          lpu_id: lpuId,
          planned_item_id: plannedItemData.id,
          action_time: new Date().toISOString()
        },
        req
      );

      const responseItem = {
        ...insertedItem,
        item: item || {
          id: itemId,
          name: 'Item não encontrado',
          type: 'unknown'
        }
      };

      console.log('✅ [ADD-PLANNED] Successfully added planned item:', responseItem.id);

      return sendSuccess(res, responseItem, 'Planned item added successfully', 201);
    } catch (error) {
      console.error('❌ [ADD-PLANNED] Error adding planned item:', error);
      return sendError(res, error as Error, 'Failed to add planned item');
    }
  }

  // Remove planned item from ticket
  static async removePlannedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId, itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      // Get item details before deletion for audit - using planned item ID, not item ID
      const plannedItemToDelete = await db
        .select({
          planned: ticketPlannedItems,
          item: items
        })
        .from(ticketPlannedItems)
        .leftJoin(items, eq(ticketPlannedItems.itemId, items.id))
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.id, itemId) // Use planned item ID, not item ID
        ))
        .limit(1);

      if (!plannedItemToDelete.length) {
        return sendError(res, 'Planned item not found', 'Planned item not found', 404);
      }

      const result = await db
        .delete(ticketPlannedItems)
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.id, itemId) // Use planned item ID, not item ID
        ))
        .returning();

      if (!result.length) {
        return sendError(res, 'Planned item not found', 'Planned item not found', 404);
      }

      // Create audit entry for planned item removal
      const deletedItem = plannedItemToDelete[0];
      await createAuditEntry(
        tenantId,
        ticketId,
        'material_planned_removed',
        `Material planejado removido: ${deletedItem.item?.name || 'Item desconhecido'} (Qtd: ${deletedItem.planned.quantity})`,
        {
          item_id: itemId,
          item_name: deletedItem.item?.name || 'Item desconhecido',
          item_type: deletedItem.item?.type || 'unknown',
          quantity: deletedItem.planned.quantity,
          notes: deletedItem.planned.notes || '',
          planned_item_id: deletedItem.planned.id,
          action_time: new Date().toISOString()
        },
        req
      );

      return sendSuccess(res, null, 'Planned item removed successfully');
    } catch (error) {
      console.error('Error removing planned item:', error);
      return sendError(res, error, 'Failed to remove planned item', 500);
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
        lpuId,
        consumptionType,
        notes,
        batchNumber,
        serialNumber,
        warrantyPeriod
      } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      console.log('🔍 [ADD-CONSUMED] Request data:', {
        ticketId,
        body: req.body,
        tenantId,
        userId,
        requiredFields: { itemId, actualQuantity, unitPriceAtConsumption, lpuId }
      });

      if (!tenantId || !ticketId || !itemId || !actualQuantity || unitPriceAtConsumption === undefined || unitPriceAtConsumption === null) {
        console.log('❌ [ADD-CONSUMED] Missing fields check:', {
          tenantId: !!tenantId,
          ticketId: !!ticketId,
          itemId: !!itemId,
          actualQuantity: !!actualQuantity,
          unitPriceAtConsumption: !!unitPriceAtConsumption,
          lpuId: !!lpuId
        });
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
          lpuId: lpuId || '00000000-0000-0000-0000-000000000001', // Default LPU if not provided
          unitPriceAtConsumption: unitPriceAtConsumption.toString(),
          totalCost: totalCost.toString(),
          consumptionType: consumptionType || 'used',
          technicianId: userId, // Usar technicianId conforme schema da tabela
          consumedAt: new Date(),
          status: 'consumed',
          notes,
          batchNumber,
          serialNumber,
          warrantyPeriod
        })
        .returning();

      // Create audit entry for consumed item addition
      await createAuditEntry(
        tenantId,
        ticketId,
        'material_consumed_added',
        `Material consumido adicionado: ${await db.select({ name: items.name }).from(items).where(eq(items.id, itemId)).limit(1).then(res => res[0]?.name || 'Item desconhecido')} (Qtd: ${actualQuantity}${totalCost ? `, Custo: R$ ${totalCost}` : ''})`,
        {
          item_id: itemId,
          item_name: await db.select({ name: items.name }).from(items).where(eq(items.id, itemId)).limit(1).then(res => res[0]?.name || 'Item desconhecido'),
          item_type: await db.select({ type: items.type }).from(items).where(eq(items.id, itemId)).limit(1).then(res => res[0]?.type || 'unknown'),
          planned_item_id: plannedItemId,
          actual_quantity: actualQuantity,
          planned_quantity: plannedQuantity,
          total_cost: totalCost.toString(),
          unit_price: unitPriceAtConsumption.toString(),
          consumption_type: consumptionType,
          consumed_item_id: consumedItem.id,
          notes: notes || ''
        },
        req
      );

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

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      // Get item details before deletion for audit - using consumed item ID, not item ID
      const consumedItemToDelete = await db
        .select({
          consumed: ticketConsumedItems,
          item: items
        })
        .from(ticketConsumedItems)
        .leftJoin(items, eq(ticketConsumedItems.itemId, items.id))
        .where(and(
          eq(ticketConsumedItems.tenantId, tenantId),
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.id, itemId) // Use consumed item ID, not item ID
        ))
        .limit(1);

      if (!consumedItemToDelete.length) {
        return sendError(res, 'Consumed item not found', 'Consumed item not found', 404);
      }

      const result = await db
        .delete(ticketConsumedItems)
        .where(and(
          eq(ticketConsumedItems.tenantId, tenantId),
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.id, itemId) // Use consumed item ID, not item ID
        ))
        .returning();

      if (!result.length) {
        return sendError(res, 'Consumed item not found', 'Consumed item not found', 404);
      }

      // Create audit entry for consumed item removal
      const deletedItem = consumedItemToDelete[0];
      await createAuditEntry(
        tenantId,
        ticketId,
        'material_consumed_removed',
        `Material consumido removido: ${deletedItem.item?.name || 'Item desconhecido'} (Qtd: ${deletedItem.consumed.quantity}${deletedItem.consumed.totalCost ? `, Custo: R$ ${deletedItem.consumed.totalCost}` : ''})`,
        {
          item_id: itemId,
          item_name: deletedItem.item?.name || 'Item desconhecido',
          item_type: deletedItem.item?.type || 'unknown',
          quantity: deletedItem.consumed.quantity,
          notes: deletedItem.consumed.notes || '',
          cost_per_unit: deletedItem.consumed.costPerUnit,
          total_cost: deletedItem.consumed.totalCost,
          consumed_item_id: deletedItem.consumed.id,
          action_time: new Date().toISOString()
        },
        req
      );

      return sendSuccess(res, null, 'Consumed item removed successfully');
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
          consumedQuantity: sql<number>`COALESCE(SUM(CAST(${ticketConsumedItems.actualQuantity} as DECIMAL)), 0)`
        })
        .from(ticketPlannedItems)
        .leftJoin(items, eq(ticketPlannedItems.itemId, items.id))
        .leftJoin(
          ticketConsumedItems,
          and(
            eq(ticketConsumedItems.plannedItemId, ticketPlannedItems.id),
            eq(ticketConsumedItems.isActive, true)
          )
        )
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.isActive, true)
        ))
        .groupBy(ticketPlannedItems.id, items.id);

      // Filter items that still have available quantity and format for frontend
      const itemsWithAvailableQuantity = availableItems
        .filter(item => {
          const plannedQty = parseFloat(item.plannedItem.plannedQuantity);
          const consumedQty = item.consumedQuantity || 0;
          return plannedQty > consumedQty;
        })
        .map(item => {
          const plannedQty = parseFloat(item.plannedItem.plannedQuantity);
          const consumedQty = item.consumedQuantity || 0;
          const remainingQty = plannedQty - consumedQty;

          return {
            plannedItemId: item.plannedItem.id,
            itemId: item.item?.id || item.plannedItem.itemId,
            itemName: item.item?.name || 'Item não encontrado',
            itemType: item.item?.type || 'unknown',
            itemDescription: item.item?.description || '',
            itemSku: item.item?.integrationCode || '',
            plannedQuantity: plannedQty,
            consumedQuantity: consumedQty,
            remainingQuantity: remainingQty,
            unitPriceAtPlanning: parseFloat(item.plannedItem.unitPriceAtPlanning || '0'),
            lpuId: item.plannedItem.lpuId
          };
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