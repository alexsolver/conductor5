import { db } from '../../../../db';
import { 
  priceLists, 
  priceListItems, 
  priceListVersions,
  pricingRules,
  dynamicPricing,
  type PriceList,
  type PricingRule,
  type InsertPricingRule,
  type DynamicPricing,
  type InsertDynamicPricing
} from '../../../../../shared/schema-materials-services';
import { eq, and, desc, asc, gte, lte } from 'drizzle-orm';
import { 
  priceLists, 
  priceListItems, 
  priceListVersions, 
  pricingRules, 
  dynamicPricing 
} from '../../../../../shared/schema-materials-services';
import type { 
  InsertPricingRule, 
  InsertDynamicPricing 
} from '../../../../../shared/schema-materials-services';

export class LPURepository {
  constructor(private database = db) {}

  async getLPUStats(tenantId: string) {
    try {
      // Get basic counts
      const allPriceLists = await this.database
        .select()
        .from(priceLists)
        .where(eq(priceLists.tenantId, tenantId));

      const totalLists = allPriceLists.length;
      const activeLists = allPriceLists.filter(p => p.isActive).length;
      const draftLists = totalLists - activeLists;

      // Get versions stats
      const allVersions = await this.database
        .select()
        .from(priceListVersions)
        .where(eq(priceListVersions.tenantId, tenantId));

      const pendingApproval = allVersions.filter(v => v.status === 'pending_approval').length;
      const approvedVersions = allVersions.filter(v => v.status === 'approved').length;

      // Get active rules
      const activeRulesCount = await this.database
        .select()
        .from(pricingRules)
        .where(and(
          eq(pricingRules.tenantId, tenantId),
          eq(pricingRules.isActive, true)
        ));

      return {
        totalLists,
        activeLists,
        draftLists,
        pendingApproval,
        approvedVersions,
        activeRules: activeRulesCount.length,
        approvalRate: allVersions.length > 0 ? 
          Math.round((approvedVersions / allVersions.length) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting LPU stats:', error);
      return {
        totalLists: 0,
        activeLists: 0,
        draftLists: 0,
        pendingApproval: 0,
        approvedVersions: 0,
        activeRules: 0,
        approvalRate: 0
      };
    }
  }

  // GESTÃO DE LISTAS DE PREÇOS
  async getAllPriceLists(tenantId: string) {
    return await this.database
      .select({
        id: priceLists.id,
        tenantId: priceLists.tenantId,
        name: priceLists.name,
        code: priceLists.code,
        version: priceLists.version,
        currency: priceLists.currency,
        validFrom: priceLists.validFrom,
        validTo: priceLists.validTo,
        automaticMargin: priceLists.automaticMargin,
        notes: priceLists.notes,
        isActive: priceLists.isActive,
        createdAt: priceLists.createdAt,
        updatedAt: priceLists.updatedAt,
        createdBy: priceLists.createdBy,
        updatedBy: priceLists.updatedBy,
      })
      .from(priceLists)
      .where(eq(priceLists.tenantId, tenantId))
      .orderBy(desc(priceLists.createdAt));
  }

  async getPriceListById(id: string, tenantId: string) {
    const [priceList] = await db
      .select()
      .from(priceLists)
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)));
    return priceList;
  }

  async createPriceList(data: any) {
    const [priceList] = await db
      .insert(priceLists)
      .values(data)
      .returning();
    return priceList;
  }

  async updatePriceList(id: string, tenantId: string, data: any) {
    const [priceList] = await db
      .update(priceLists)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)))
      .returning();
    return priceList;
  }

  // DELETE PRICE LIST  
  async deletePriceListItem(id: string, tenantId: string) {
    const [deleted] = await db
      .delete(priceLists)
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)))
      .returning();
    return deleted;
  }

  // VERSIONAMENTO DE LISTAS
  async createPriceListVersion(data: any) {
    const [version] = await db
      .insert(priceListVersions)
      .values(data)
      .returning();
    return version;
  }

  async getPriceListVersions(priceListId: string, tenantId: string) {
    return await db
      .select()
      .from(priceListVersions)
      .where(and(
        eq(priceListVersions.priceListId, priceListId),
        eq(priceListVersions.tenantId, tenantId)
      ))
      .orderBy(desc(priceListVersions.createdAt));
  }

  async submitForApproval(versionId: string, tenantId: string, submittedBy: string) {
    const [version] = await db
      .update(priceListVersions)
      .set({
        status: 'pending_approval',
        submittedBy,
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(priceListVersions.id, versionId),
        eq(priceListVersions.tenantId, tenantId)
      ))
      .returning();
    return version;
  }

  async approvePriceList(versionId: string, tenantId: string, approvedBy: string) {
    const [version] = await db
      .update(priceListVersions)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(priceListVersions.id, versionId),
        eq(priceListVersions.tenantId, tenantId)
      ))
      .returning();
    return version;
  }

  async rejectPriceList(versionId: string, tenantId: string, rejectedBy: string, reason: string) {
    const [version] = await db
      .update(priceListVersions)
      .set({
        status: 'draft',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(and(
        eq(priceListVersions.id, versionId),
        eq(priceListVersions.tenantId, tenantId)
      ))
      .returning();
    return version;
  }

  // ITENS DA LISTA DE PREÇOS
  async getPriceListItems(priceListId: string, tenantId: string) {
    return await db
      .select()
      .from(priceListItems)
      .where(and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.tenantId, tenantId)
      ))
      .orderBy(asc(priceListItems.createdAt));
  }

  async addPriceListItem(data: any) {
    const [item] = await db
      .insert(priceListItems)
      .values(data)
      .returning();
    return item;
  }

  async updatePriceListItem(id: string, tenantId: string, data: any) {
    const [item] = await db
      .update(priceListItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(priceListItems.id, id), eq(priceListItems.tenantId, tenantId)))
      .returning();
    return item;
  }

  async deletePriceListItem(id: string, tenantId: string) {
    await db
      .delete(priceListItems)
      .where(and(eq(priceListItems.id, id), eq(priceListItems.tenantId, tenantId)));
  }

  // REGRAS DE PRECIFICAÇÃO
  async getAllPricingRules(tenantId: string) {
    return await db
      .select({
        id: pricingRules.id,
        tenantId: pricingRules.tenantId,
        name: pricingRules.name,
        description: pricingRules.description,
        ruleType: pricingRules.ruleType,
        conditions: pricingRules.conditions,
        actions: pricingRules.actions,
        priority: pricingRules.priority,
        isActive: pricingRules.isActive,
        createdAt: pricingRules.createdAt,
        updatedAt: pricingRules.updatedAt,
      })
      .from(pricingRules)
      .where(eq(pricingRules.tenantId, tenantId))
      .orderBy(desc(pricingRules.priority), asc(pricingRules.name));
  }

  async createPricingRule(data: InsertPricingRule) {
    const [rule] = await db
      .insert(pricingRules)
      .values(data)
      .returning();
    return rule;
  }

  async updatePricingRule(id: string, tenantId: string, data: Partial<InsertPricingRule>) {
    const [rule] = await db
      .update(pricingRules)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId)))
      .returning();
    return rule;
  }

  async deletePricingRule(id: string, tenantId: string) {
    await db
      .delete(pricingRules)
      .where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId)));
  }

  // PRECIFICAÇÃO DINÂMICA
  async getDynamicPricing(priceListId: string, tenantId: string) {
    return await db
      .select()
      .from(dynamicPricing)
      .where(and(
        eq(dynamicPricing.priceListId, priceListId),
        eq(dynamicPricing.tenantId, tenantId)
      ))
      .orderBy(desc(dynamicPricing.lastUpdated));
  }

  async updateDynamicPricing(data: InsertDynamicPricing) {
    const [pricing] = await db
      .insert(dynamicPricing)
      .values(data)
      .onConflictDoUpdate({
        target: [dynamicPricing.priceListId, dynamicPricing.itemId],
        set: {
          currentPrice: data.currentPrice,
          demandFactor: data.demandFactor,
          seasonalFactor: data.seasonalFactor,
          inventoryFactor: data.inventoryFactor,
          competitorFactor: data.competitorFactor,
          lastUpdated: new Date(),
          calculationRules: data.calculationRules
        }
      })
      .returning();
    return pricing;
  }

  async calculateDynamicPrice(itemId: string, basePrice: number, factors: {
    demandFactor?: number;
    seasonalFactor?: number;
    inventoryFactor?: number;
    competitorFactor?: number;
  }) {
    const {
      demandFactor = 1.0,
      seasonalFactor = 1.0,
      inventoryFactor = 1.0,
      competitorFactor = 1.0
    } = factors;

    // Fórmula de precificação dinâmica
    const dynamicPrice = basePrice * demandFactor * seasonalFactor * inventoryFactor * competitorFactor;
    
    return Math.round(dynamicPrice * 100) / 100; // 2 casas decimais
  }

  // CONTROLE DE MARGEM
  async calculatePriceWithMargin(basePrice: number, margin: number) {
    return Math.round(basePrice * (1 + margin / 100) * 100) / 100;
  }

  async bulkUpdateMargins(priceListId: string, tenantId: string, marginData: {
    baseMargin?: number;
    itemMargins?: Array<{ itemId: string; margin: number; }>;
  }) {
    const { baseMargin, itemMargins } = marginData;

    // Atualizar margem base da lista
    if (baseMargin !== undefined) {
      await db
        .update(priceLists)
        .set({ automaticMargin: baseMargin, updatedAt: new Date() })
        .where(and(eq(priceLists.id, priceListId), eq(priceLists.tenantId, tenantId)));
    }

    // Atualizar margens específicas por item
    if (itemMargins && itemMargins.length > 0) {
      for (const { itemId, margin } of itemMargins) {
        // Buscar preço base do item
        const [currentItem] = await db
          .select()
          .from(priceListItems)
          .where(and(
            eq(priceListItems.priceListId, priceListId),
            eq(priceListItems.itemId, itemId),
            eq(priceListItems.tenantId, tenantId)
          ));

        if (currentItem) {
          const newFinalPrice = this.calculatePriceWithMargin(
            parseFloat(currentItem.unitPrice), 
            margin
          );

          await db
            .update(priceListItems)
            .set({
              finalPrice: newFinalPrice.toString(),
              updatedAt: new Date()
            })
            .where(and(
              eq(priceListItems.priceListId, priceListId),
              eq(priceListItems.itemId, itemId),
              eq(priceListItems.tenantId, tenantId)
            ));
        }
      }
    }

    return { success: true, updated: itemMargins?.length || 0 };
  }

  // ESTATÍSTICAS LPU
  async getLPUStats(tenantId: string) {
    const allPriceLists = await db
      .select()
      .from(priceLists)
      .where(eq(priceLists.tenantId, tenantId));

    const totalLists = allPriceLists.length;
    const activeLists = allPriceLists.filter(p => p.isActive).length;
    const draftLists = allPriceLists.filter(p => !p.isActive).length;

    // Estatísticas de versões
    const allVersions = await db
      .select()
      .from(priceListVersions)
      .where(eq(priceListVersions.tenantId, tenantId));

    const pendingApproval = allVersions.filter(v => v.status === 'pending_approval').length;
    const approvedVersions = allVersions.filter(v => v.status === 'approved').length;

    // Regras de precificação
    const activeRules = await db
      .select()
      .from(pricingRules)
      .where(and(eq(pricingRules.tenantId, tenantId), eq(pricingRules.active, true)));

    return {
      totalLists,
      activeLists,
      draftLists,
      pendingApproval,
      approvedVersions,
      activeRules: activeRules.length,
      approvalRate: approvedVersions > 0 ? 
        Math.round((approvedVersions / allVersions.length) * 100) : 0
    };
  }
}