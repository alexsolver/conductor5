
import { Request, Response } from "express";
import { z } from "zod";
import { TicketMaterialsRepository } from "./TicketMaterialsRepository";
import { standardResponse } from "../../utils/standardResponse";

const ticketMaterialsRepo = new TicketMaterialsRepository();

// Validation schemas
const addPlannedItemSchema = z.object({
  itemId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid().optional(),
  itemType: z.enum(['material', 'service']),
  itemName: z.string().min(1),
  itemCode: z.string().optional(),
  plannedQuantity: z.number().positive(),
  unitOfMeasure: z.string().default('UN'),
  unitPrice: z.number().positive(),
  priceListId: z.string().uuid().optional(),
  notes: z.string().optional()
});

const registerConsumptionSchema = z.object({
  ticketMaterialId: z.string().uuid(),
  consumedQuantity: z.number().min(0),
  consumptionNotes: z.string().optional()
});

const bulkConsumptionSchema = z.object({
  consumptions: z.array(z.object({
    ticketMaterialId: z.string().uuid(),
    consumedQuantity: z.number().min(0),
    consumptionNotes: z.string().optional()
  }))
});

export class TicketMaterialsController {
  
  // GET /api/tickets/:ticketId/materials - Listar materiais do ticket
  async getTicketMaterials(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const { type } = req.query; // 'planned' | 'consumed' | 'all'
      
      const materials = await ticketMaterialsRepo.getByTicketId(ticketId, type as string);
      const costSummary = await ticketMaterialsRepo.getCostSummary(ticketId);
      
      return standardResponse(res, 200, "Materials retrieved successfully", {
        materials,
        costSummary,
        totals: {
          plannedCost: costSummary?.totalPlannedCost || 0,
          consumedCost: costSummary?.totalConsumedCost || 0,
          variance: costSummary?.costVariance || 0,
          variancePercentage: costSummary?.costVariancePercentage || 0
        }
      });
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error getting materials:", error);
      return standardResponse(res, 500, "Error retrieving materials", null);
    }
  }

  // POST /api/tickets/:ticketId/materials/planned - Adicionar item planejado
  async addPlannedItem(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const userId = (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      
      const validatedData = addPlannedItemSchema.parse(req.body);
      
      const plannedItem = await ticketMaterialsRepo.addPlannedItem({
        ...validatedData,
        ticketId,
        tenantId,
        createdBy: userId
      });
      
      // Recalcular resumo de custos
      await ticketMaterialsRepo.recalculateCostSummary(ticketId, tenantId);
      
      return standardResponse(res, 201, "Planned item added successfully", plannedItem);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error adding planned item:", error);
      return standardResponse(res, 500, "Error adding planned item", null);
    }
  }

  // POST /api/tickets/:ticketId/materials/consumption - Registrar consumo
  async registerConsumption(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const userId = (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      
      const validatedData = registerConsumptionSchema.parse(req.body);
      
      const consumption = await ticketMaterialsRepo.registerConsumption({
        ...validatedData,
        ticketId,
        consumedBy: userId,
        tenantId
      });
      
      // Recalcular resumo de custos
      await ticketMaterialsRepo.recalculateCostSummary(ticketId, tenantId);
      
      return standardResponse(res, 200, "Consumption registered successfully", consumption);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error registering consumption:", error);
      return standardResponse(res, 500, "Error registering consumption", null);
    }
  }

  // POST /api/tickets/:ticketId/materials/bulk-consumption - Registro em lote
  async registerBulkConsumption(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const userId = (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      
      const validatedData = bulkConsumptionSchema.parse(req.body);
      
      const results = await ticketMaterialsRepo.registerBulkConsumption({
        ticketId,
        consumptions: validatedData.consumptions,
        consumedBy: userId,
        tenantId
      });
      
      // Recalcular resumo de custos
      await ticketMaterialsRepo.recalculateCostSummary(ticketId, tenantId);
      
      return standardResponse(res, 200, "Bulk consumption registered successfully", results);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error registering bulk consumption:", error);
      return standardResponse(res, 500, "Error registering bulk consumption", null);
    }
  }

  // GET /api/tickets/:ticketId/materials/available-items - Itens disponíveis para adicionar
  async getAvailableItems(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const { customerId, search, type } = req.query;
      const tenantId = (req as any).user?.tenantId;
      
      const availableItems = await ticketMaterialsRepo.getAvailableItems({
        tenantId,
        ticketId,
        customerId: customerId as string,
        search: search as string,
        type: type as 'material' | 'service'
      });
      
      return standardResponse(res, 200, "Available items retrieved successfully", availableItems);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error getting available items:", error);
      return standardResponse(res, 500, "Error retrieving available items", null);
    }
  }

  // PUT /api/tickets/:ticketId/materials/:materialId - Atualizar item
  async updateTicketMaterial(req: Request, res: Response) {
    try {
      const { ticketId, materialId } = req.params;
      const userId = (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      
      const updatedMaterial = await ticketMaterialsRepo.updateMaterial({
        id: materialId,
        ticketId,
        tenantId,
        updates: req.body,
        updatedBy: userId
      });
      
      // Recalcular resumo de custos
      await ticketMaterialsRepo.recalculateCostSummary(ticketId, tenantId);
      
      return standardResponse(res, 200, "Material updated successfully", updatedMaterial);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error updating material:", error);
      return standardResponse(res, 500, "Error updating material", null);
    }
  }

  // DELETE /api/tickets/:ticketId/materials/:materialId - Remover item
  async removeTicketMaterial(req: Request, res: Response) {
    try {
      const { ticketId, materialId } = req.params;
      const tenantId = (req as any).user?.tenantId;
      
      await ticketMaterialsRepo.removeMaterial(materialId, ticketId, tenantId);
      
      // Recalcular resumo de custos
      await ticketMaterialsRepo.recalculateCostSummary(ticketId, tenantId);
      
      return standardResponse(res, 200, "Material removed successfully", null);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error removing material:", error);
      return standardResponse(res, 500, "Error removing material", null);
    }
  }

  // GET /api/tickets/:ticketId/materials/history - Histórico de alterações
  async getMaterialsHistory(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const tenantId = (req as any).user?.tenantId;
      
      const history = await ticketMaterialsRepo.getMaterialsHistory(ticketId, tenantId);
      
      return standardResponse(res, 200, "Materials history retrieved successfully", history);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error getting materials history:", error);
      return standardResponse(res, 500, "Error retrieving materials history", null);
    }
  }

  // POST /api/tickets/:ticketId/materials/:materialId/approve - Aprovar consumo
  async approveMaterialConsumption(req: Request, res: Response) {
    try {
      const { ticketId, materialId } = req.params;
      const userId = (req as any).user?.id;
      const tenantId = (req as any).user?.tenantId;
      
      const approved = await ticketMaterialsRepo.approveMaterialConsumption({
        materialId,
        ticketId,
        tenantId,
        approvedBy: userId
      });
      
      return standardResponse(res, 200, "Material consumption approved successfully", approved);
    } catch (error) {
      console.error("[TICKET-MATERIALS] Error approving material consumption:", error);
      return standardResponse(res, 500, "Error approving material consumption", null);
    }
  }
}
