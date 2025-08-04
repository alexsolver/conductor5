import { Request, Response } from 'express';
import { db } from '../../../../db-tenant';
import { 
  ticketLpuSettings, 
  ticketPlannedItems, 
  ticketConsumedItems, 
  ticketCostsSummary
} from '../../../../../shared/schema-master';
import { eq, and, desc } from 'drizzle-orm';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
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
      return sendError(res, error, 'Failed to retrieve LPU settings');
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
      return sendError(res, error, 'Failed to set LPU');
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
        .where(and(
          eq(ticketPlannedItems.tenantId, tenantId),
          eq(ticketPlannedItems.ticketId, ticketId),
          eq(ticketPlannedItems.isActive, true)
        ))
        .orderBy(desc(ticketPlannedItems.createdAt));

      return sendSuccess(res, { plannedItems }, 'Planned items retrieved successfully');
    } catch (error) {
      console.error('Error fetching planned items:', error);
      return sendError(res, error, 'Failed to retrieve planned items');
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

      return sendSuccess(res, { plannedItem }, 'Planned item added successfully', 201);
    } catch (error) {
      console.error('Error adding planned item:', error);
      return sendError(res, error, 'Failed to add planned item');
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

      return sendSuccess(res, {}, 'Planned item removed successfully');
    } catch (error) {
      console.error('Error removing planned item:', error);
      return sendError(res, error, 'Failed to remove planned item');
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
        .where(and(
          eq(ticketConsumedItems.tenantId, tenantId),
          eq(ticketConsumedItems.ticketId, ticketId),
          eq(ticketConsumedItems.isActive, true)
        ))
        .orderBy(desc(ticketConsumedItems.consumedAt));

      return sendSuccess(res, { consumedItems }, 'Consumed items retrieved successfully');
    } catch (error) {
      console.error('Error fetching consumed items:', error);
      return sendError(res, error, 'Failed to retrieve consumed items');
    }
  }

  // Add consumed item (technician reports actual usage)
  static async addConsumedItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { 
        itemId, 
        plannedItemId,
        actualQuantity, 
        lpuId, 
        unitPriceAtConsumption,
        stockLocationId,
        consumptionType,
        notes,
        batchNumber,
        serialNumber,
        warrantyPeriod
      } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !ticketId || !itemId || !actualQuantity || !lpuId || !unitPriceAtConsumption) {
        return sendError(res, 'Missing required fields', 'Missing required fields', 400);
      }

      const totalCost = parseFloat(actualQuantity) * parseFloat(unitPriceAtConsumption);

      // Get planned quantity if planned item exists
      let plannedQuantity = '0';
      if (plannedItemId) {
        const planned = await db
          .select({ plannedQuantity: ticketPlannedItems.plannedQuantity })
          .from(ticketPlannedItems)
          .where(eq(ticketPlannedItems.id, plannedItemId))
          .limit(1);
        
        if (planned.length > 0) {
          plannedQuantity = planned[0].plannedQuantity;
        }
      }

      const [consumedItem] = await db
        .insert(ticketConsumedItems)
        .values({
          tenantId,
          ticketId,
          plannedItemId,
          itemId,
          plannedQuantity,
          actualQuantity: actualQuantity.toString(),
          lpuId,
          unitPriceAtConsumption: unitPriceAtConsumption.toString(),
          totalCost: totalCost.toString(),
          technicianId: userId!,
          stockLocationId,
          consumptionType: consumptionType || 'used',
          notes,
          batchNumber,
          serialNumber,
          warrantyPeriod
        })
        .returning();

      return sendSuccess(res, { consumedItem }, 'Consumed item added successfully', 201);
    } catch (error) {
      console.error('Error adding consumed item:', error);
      return sendError(res, error, 'Failed to add consumed item');
    }
  }

  // Get costs summary for a ticket
  static async getCostsSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId || !ticketId) {
        return sendError(res, 'Missing tenant ID or ticket ID', 'Missing tenant ID or ticket ID', 400);
      }

      const [summary] = await db
        .select()
        .from(ticketCostsSummary)
        .where(and(
          eq(ticketCostsSummary.tenantId, tenantId),
          eq(ticketCostsSummary.ticketId, ticketId)
        ))
        .limit(1);

      if (!summary) {
        // Create initial summary if it doesn't exist
        const [newSummary] = await db
          .insert(ticketCostsSummary)
          .values({
            tenantId,
            ticketId,
            totalPlannedCost: '0',
            totalActualCost: '0',
            costVariance: '0',
            costVariancePercentage: '0',
            materialsCount: 0,
            servicesCount: 0,
            totalItemsCount: 0
          })
          .returning();

        return sendSuccess(res, { summary: newSummary }, 'Costs summary retrieved successfully');
      }

      return sendSuccess(res, { summary }, 'Costs summary retrieved successfully');
    } catch (error) {
      console.error('Error fetching costs summary:', error);
      return sendError(res, error, 'Failed to retrieve costs summary');
    }
  }
}