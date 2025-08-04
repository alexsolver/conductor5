
import { db } from "../../db";
import { ticketMaterials, ticketCostSummary, ticketMaterialsHistory, type InsertTicketMaterial, type TicketMaterial } from "@shared/schema-ticket-materials";
import { items, serviceTypes, priceLists, priceListItems } from "@shared/schema-materials-services";
import { users } from "@shared/schema-master";
import { eq, and, desc, sql, or, ilike, isNull, sum, count } from "drizzle-orm";

export class TicketMaterialsRepository {
  
  // Buscar materiais de um ticket
  async getByTicketId(ticketId: string, type?: string) {
    const conditions = [eq(ticketMaterials.ticketId, ticketId)];
    
    if (type === 'planned') {
      conditions.push(eq(ticketMaterials.recordType, 'planned'));
    } else if (type === 'consumed') {
      conditions.push(eq(ticketMaterials.recordType, 'consumed'));
    }
    
    return await db
      .select({
        // Material fields
        id: ticketMaterials.id,
        itemType: ticketMaterials.itemType,
        itemName: ticketMaterials.itemName,
        itemCode: ticketMaterials.itemCode,
        recordType: ticketMaterials.recordType,
        plannedQuantity: ticketMaterials.plannedQuantity,
        consumedQuantity: ticketMaterials.consumedQuantity,
        unitOfMeasure: ticketMaterials.unitOfMeasure,
        unitPrice: ticketMaterials.unitPrice,
        totalPlannedCost: ticketMaterials.totalPlannedCost,
        totalConsumedCost: ticketMaterials.totalConsumedCost,
        consumptionNotes: ticketMaterials.consumptionNotes,
        isApproved: ticketMaterials.isApproved,
        consumedAt: ticketMaterials.consumedAt,
        createdAt: ticketMaterials.createdAt,
        
        // User info
        consumedByName: users.name,
        createdByName: sql<string>`creator.name`
      })
      .from(ticketMaterials)
      .leftJoin(users, eq(ticketMaterials.consumedBy, users.id))
      .leftJoin(sql`${users} as creator`, sql`${ticketMaterials.createdBy} = creator.id`)
      .where(and(...conditions))
      .orderBy(desc(ticketMaterials.createdAt));
  }

  // Buscar resumo de custos
  async getCostSummary(ticketId: string) {
    return await db
      .select()
      .from(ticketCostSummary)
      .where(eq(ticketCostSummary.ticketId, ticketId))
      .then(results => results[0] || null);
  }

  // Adicionar item planejado
  async addPlannedItem(data: {
    ticketId: string;
    tenantId: string;
    itemId?: string;
    serviceTypeId?: string;
    itemType: 'material' | 'service';
    itemName: string;
    itemCode?: string;
    plannedQuantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    priceListId?: string;
    notes?: string;
    createdBy: string;
  }) {
    const totalPlannedCost = data.plannedQuantity * data.unitPrice;
    
    const [newItem] = await db
      .insert(ticketMaterials)
      .values({
        tenantId: data.tenantId,
        ticketId: data.ticketId,
        itemId: data.itemId,
        serviceTypeId: data.serviceTypeId,
        recordType: 'planned',
        itemType: data.itemType,
        itemName: data.itemName,
        itemCode: data.itemCode,
        plannedQuantity: data.plannedQuantity.toString(),
        unitOfMeasure: data.unitOfMeasure,
        unitPrice: data.unitPrice.toString(),
        totalPlannedCost: totalPlannedCost.toString(),
        priceListId: data.priceListId,
        consumptionNotes: data.notes,
        createdBy: data.createdBy
      })
      .returning();

    // Registrar no histórico
    await this.addToHistory({
      tenantId: data.tenantId,
      ticketMaterialId: newItem.id,
      action: 'planned',
      reason: 'Item adicionado ao planejamento',
      performedBy: data.createdBy
    });

    return newItem;
  }

  // Registrar consumo
  async registerConsumption(data: {
    ticketMaterialId: string;
    ticketId: string;
    tenantId: string;
    consumedQuantity: number;
    consumptionNotes?: string;
    consumedBy: string;
  }) {
    // Buscar o material planejado
    const material = await db
      .select()
      .from(ticketMaterials)
      .where(and(
        eq(ticketMaterials.id, data.ticketMaterialId),
        eq(ticketMaterials.ticketId, data.ticketId)
      ))
      .then(results => results[0]);

    if (!material) {
      throw new Error('Material não encontrado');
    }

    const totalConsumedCost = data.consumedQuantity * parseFloat(material.unitPrice);
    
    const [updatedMaterial] = await db
      .update(ticketMaterials)
      .set({
        consumedQuantity: data.consumedQuantity.toString(),
        totalConsumedCost: totalConsumedCost.toString(),
        consumptionNotes: data.consumptionNotes,
        consumedBy: data.consumedBy,
        consumedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: data.consumedBy
      })
      .where(eq(ticketMaterials.id, data.ticketMaterialId))
      .returning();

    // Registrar no histórico
    await this.addToHistory({
      tenantId: data.tenantId,
      ticketMaterialId: data.ticketMaterialId,
      action: 'consumed',
      field: 'consumedQuantity',
      newValue: data.consumedQuantity.toString(),
      reason: data.consumptionNotes || 'Consumo registrado',
      performedBy: data.consumedBy
    });

    return updatedMaterial;
  }

  // Registro em lote de consumo
  async registerBulkConsumption(data: {
    ticketId: string;
    tenantId: string;
    consumptions: Array<{
      ticketMaterialId: string;
      consumedQuantity: number;
      consumptionNotes?: string;
    }>;
    consumedBy: string;
  }) {
    const results = [];
    
    for (const consumption of data.consumptions) {
      try {
        const result = await this.registerConsumption({
          ...consumption,
          ticketId: data.ticketId,
          tenantId: data.tenantId,
          consumedBy: data.consumedBy
        });
        results.push({ success: true, materialId: consumption.ticketMaterialId, result });
      } catch (error) {
        results.push({ 
          success: false, 
          materialId: consumption.ticketMaterialId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return results;
  }

  // Buscar itens disponíveis para adicionar ao ticket
  async getAvailableItems(filters: {
    tenantId: string;
    ticketId: string;
    customerId?: string;
    search?: string;
    type?: 'material' | 'service';
  }) {
    const results = {
      materials: [] as any[],
      services: [] as any[]
    };

    // Buscar materiais
    if (!filters.type || filters.type === 'material') {
      let materialQuery = db
        .select({
          id: items.id,
          type: sql<string>`'material'`,
          name: items.name,
          code: items.integrationCode,
          measurementUnit: items.measurementUnit,
          description: items.description,
          groupName: items.groupName,
          // Preço da LPU (se aplicável)
          unitPrice: priceListItems.unitPrice,
          priceListId: priceListItems.priceListId
        })
        .from(items)
        .leftJoin(priceListItems, eq(items.id, priceListItems.itemId))
        .leftJoin(priceLists, and(
          eq(priceListItems.priceListId, priceLists.id),
          eq(priceLists.isActive, true)
        ))
        .where(and(
          eq(items.tenantId, filters.tenantId),
          eq(items.active, true),
          eq(items.type, 'material')
        ));

      if (filters.search) {
        materialQuery = materialQuery.where(
          or(
            ilike(items.name, `%${filters.search}%`),
            ilike(items.integrationCode, `%${filters.search}%`)
          )
        );
      }

      results.materials = await materialQuery.limit(50);
    }

    // Buscar serviços
    if (!filters.type || filters.type === 'service') {
      let serviceQuery = db
        .select({
          id: serviceTypes.id,
          type: sql<string>`'service'`,
          name: serviceTypes.name,
          code: serviceTypes.code,
          measurementUnit: sql<string>`'H'`, // Horas por padrão
          description: serviceTypes.description,
          complexity: serviceTypes.complexity,
          estimatedDuration: serviceTypes.estimatedDuration,
          // Preço da LPU (se aplicável)
          unitPrice: priceListItems.hourlyRate,
          priceListId: priceListItems.priceListId
        })
        .from(serviceTypes)
        .leftJoin(priceListItems, eq(serviceTypes.id, priceListItems.serviceTypeId))
        .leftJoin(priceLists, and(
          eq(priceListItems.priceListId, priceLists.id),
          eq(priceLists.isActive, true)
        ))
        .where(and(
          eq(serviceTypes.tenantId, filters.tenantId),
          eq(serviceTypes.isActive, true)
        ));

      if (filters.search) {
        serviceQuery = serviceQuery.where(
          or(
            ilike(serviceTypes.name, `%${filters.search}%`),
            ilike(serviceTypes.code, `%${filters.search}%`)
          )
        );
      }

      results.services = await serviceQuery.limit(50);
    }

    return results;
  }

  // Recalcular resumo de custos
  async recalculateCostSummary(ticketId: string, tenantId: string) {
    // Calcular totais agrupados
    const totals = await db
      .select({
        totalPlannedMaterialsCost: sum(sql`CASE WHEN ${ticketMaterials.itemType} = 'material' THEN COALESCE(${ticketMaterials.totalPlannedCost}, 0) ELSE 0 END`),
        totalPlannedServicesCost: sum(sql`CASE WHEN ${ticketMaterials.itemType} = 'service' THEN COALESCE(${ticketMaterials.totalPlannedCost}, 0) ELSE 0 END`),
        totalConsumedMaterialsCost: sum(sql`CASE WHEN ${ticketMaterials.itemType} = 'material' THEN COALESCE(${ticketMaterials.totalConsumedCost}, 0) ELSE 0 END`),
        totalConsumedServicesCost: sum(sql`CASE WHEN ${ticketMaterials.itemType} = 'service' THEN COALESCE(${ticketMaterials.totalConsumedCost}, 0) ELSE 0 END`),
        totalItems: count(ticketMaterials.id),
        itemsWithConsumption: count(sql`CASE WHEN ${ticketMaterials.consumedQuantity} > 0 THEN 1 END`)
      })
      .from(ticketMaterials)
      .where(eq(ticketMaterials.ticketId, ticketId))
      .then(results => results[0]);

    const totalPlannedCost = (parseFloat(totals.totalPlannedMaterialsCost || '0') + parseFloat(totals.totalPlannedServicesCost || '0'));
    const totalConsumedCost = (parseFloat(totals.totalConsumedMaterialsCost || '0') + parseFloat(totals.totalConsumedServicesCost || '0'));
    const costVariance = totalConsumedCost - totalPlannedCost;
    const costVariancePercentage = totalPlannedCost > 0 ? (costVariance / totalPlannedCost) * 100 : 0;

    // Upsert no resumo
    await db
      .insert(ticketCostSummary)
      .values({
        tenantId,
        ticketId,
        totalPlannedMaterialsCost: totals.totalPlannedMaterialsCost?.toString() || '0',
        totalPlannedServicesCost: totals.totalPlannedServicesCost?.toString() || '0',
        totalPlannedCost: totalPlannedCost.toString(),
        totalConsumedMaterialsCost: totals.totalConsumedMaterialsCost?.toString() || '0',
        totalConsumedServicesCost: totals.totalConsumedServicesCost?.toString() || '0',
        totalConsumedCost: totalConsumedCost.toString(),
        costVariance: costVariance.toString(),
        costVariancePercentage: costVariancePercentage.toString(),
        totalItems: parseInt(totals.totalItems?.toString() || '0'),
        itemsWithConsumption: parseInt(totals.itemsWithConsumption?.toString() || '0'),
        hasPlannedItems: totalPlannedCost > 0,
        hasConsumedItems: totalConsumedCost > 0,
        isFullyConsumed: parseInt(totals.totalItems?.toString() || '0') === parseInt(totals.itemsWithConsumption?.toString() || '0'),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [ticketCostSummary.ticketId],
        set: {
          totalPlannedMaterialsCost: totals.totalPlannedMaterialsCost?.toString() || '0',
          totalPlannedServicesCost: totals.totalPlannedServicesCost?.toString() || '0',
          totalPlannedCost: totalPlannedCost.toString(),
          totalConsumedMaterialsCost: totals.totalConsumedMaterialsCost?.toString() || '0',
          totalConsumedServicesCost: totals.totalConsumedServicesCost?.toString() || '0',
          totalConsumedCost: totalConsumedCost.toString(),
          costVariance: costVariance.toString(),
          costVariancePercentage: costVariancePercentage.toString(),
          totalItems: parseInt(totals.totalItems?.toString() || '0'),
          itemsWithConsumption: parseInt(totals.itemsWithConsumption?.toString() || '0'),
          hasPlannedItems: totalPlannedCost > 0,
          hasConsumedItems: totalConsumedCost > 0,
          isFullyConsumed: parseInt(totals.totalItems?.toString() || '0') === parseInt(totals.itemsWithConsumption?.toString() || '0'),
          updatedAt: new Date()
        }
      });
  }

  // Adicionar ao histórico
  private async addToHistory(data: {
    tenantId: string;
    ticketMaterialId: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    performedBy: string;
  }) {
    await db
      .insert(ticketMaterialsHistory)
      .values({
        tenantId: data.tenantId,
        ticketMaterialId: data.ticketMaterialId,
        action: data.action,
        field: data.field,
        oldValue: data.oldValue,
        newValue: data.newValue,
        reason: data.reason,
        performedBy: data.performedBy
      });
  }

  // Outros métodos auxiliares...
  async updateMaterial(data: any) {
    // Implementar atualização de material
  }

  async removeMaterial(materialId: string, ticketId: string, tenantId: string) {
    return await db
      .delete(ticketMaterials)
      .where(and(
        eq(ticketMaterials.id, materialId),
        eq(ticketMaterials.ticketId, ticketId),
        eq(ticketMaterials.tenantId, tenantId)
      ));
  }

  async getMaterialsHistory(ticketId: string, tenantId: string) {
    return await db
      .select({
        id: ticketMaterialsHistory.id,
        action: ticketMaterialsHistory.action,
        field: ticketMaterialsHistory.field,
        oldValue: ticketMaterialsHistory.oldValue,
        newValue: ticketMaterialsHistory.newValue,
        reason: ticketMaterialsHistory.reason,
        performedAt: ticketMaterialsHistory.performedAt,
        performedByName: users.name,
        materialName: ticketMaterials.itemName
      })
      .from(ticketMaterialsHistory)
      .innerJoin(ticketMaterials, eq(ticketMaterialsHistory.ticketMaterialId, ticketMaterials.id))
      .leftJoin(users, eq(ticketMaterialsHistory.performedBy, users.id))
      .where(and(
        eq(ticketMaterials.ticketId, ticketId),
        eq(ticketMaterialsHistory.tenantId, tenantId)
      ))
      .orderBy(desc(ticketMaterialsHistory.performedAt));
  }

  async approveMaterialConsumption(data: {
    materialId: string;
    ticketId: string;
    tenantId: string;
    approvedBy: string;
  }) {
    const [approved] = await db
      .update(ticketMaterials)
      .set({
        isApproved: true,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: data.approvedBy
      })
      .where(and(
        eq(ticketMaterials.id, data.materialId),
        eq(ticketMaterials.ticketId, data.ticketId),
        eq(ticketMaterials.tenantId, data.tenantId)
      ))
      .returning();

    // Registrar no histórico
    await this.addToHistory({
      tenantId: data.tenantId,
      ticketMaterialId: data.materialId,
      action: 'approved',
      reason: 'Consumo aprovado',
      performedBy: data.approvedBy
    });

    return approved;
  }
}
