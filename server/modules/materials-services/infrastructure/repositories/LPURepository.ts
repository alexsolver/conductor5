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
import { eq, and, desc, asc, gte, lte, sql, inArray } from 'drizzle-orm';

export class LPURepository {
  constructor(private database = db) {}

  async getLPUStats(tenantId: string) {
    const result = await db.execute(sql`
      WITH stats AS (
        SELECT
          COUNT(*) as total_lists,
          COUNT(*) FILTER (WHERE is_active = true) as active_lists,
          COUNT(*) FILTER (WHERE is_active = false) as draft_lists,
          COUNT(*) FILTER (WHERE customer_company_id IS NOT NULL) as pending_approval,
          COUNT(*) FILTER (WHERE is_active = true AND customer_company_id IS NOT NULL) as approved_versions,
          0 as active_rules,
          CASE 
            WHEN COUNT(*) FILTER (WHERE customer_company_id IS NOT NULL) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE is_active = true AND customer_company_id IS NOT NULL)::numeric / COUNT(*) FILTER (WHERE customer_company_id IS NOT NULL)::numeric) * 100, 2)
            ELSE 0 
          END as approval_rate
        FROM ${priceLists}
        WHERE tenant_id = ${tenantId}
      )
      SELECT * FROM stats
    `);

    const stats = result.rows?.[0] || {
      total_lists: 0,
      active_lists: 0,
      draft_lists: 0,
      pending_approval: 0,
      approved_versions: 0,
      active_rules: 0,
      approval_rate: 0
    };

    return {
      totalLists: Number(stats.total_lists),
      activeLists: Number(stats.active_lists),
      draftLists: Number(stats.draft_lists),
      pendingApproval: Number(stats.pending_approval),
      approvedVersions: Number(stats.approved_versions),
      activeRules: Number(stats.active_rules),
      approvalRate: Number(stats.approval_rate)
    };
  }

  // GESTÃO DE LISTAS DE PREÇOS
  async getAllPriceLists(tenantId: string) {
    return await this.database
      .select({
        id: priceLists.id,
        tenantId: priceLists.tenantId,
        name: priceLists.name,
        code: priceLists.code,
        description: priceLists.description,
        version: priceLists.version,
        isActive: priceLists.isActive,
        customerCompanyId: priceLists.customerCompanyId,
        validFrom: priceLists.validFrom,
        validTo: priceLists.validTo,
        currency: priceLists.currency,
        notes: priceLists.notes,
        createdAt: priceLists.createdAt,
        updatedAt: priceLists.updatedAt,
        createdBy: priceLists.createdBy,
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
  async deletePriceList(id: string, tenantId: string) {
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

  // ASSOCIAÇÃO DE REGRAS COM LISTAS (Simplified version)
  async getPriceListRules(priceListId: string, tenantId: string) {
    // For now, return all active rules for the tenant
    // This can be enhanced later with proper association table
    return await db
      .select({
        id: pricingRules.id,
        name: pricingRules.name,
        type: pricingRules.ruleType,
        priority: pricingRules.priority,
        isActive: pricingRules.isActive,
        conditions: pricingRules.conditions,
        actions: pricingRules.actions
      })
      .from(pricingRules)
      .where(and(
        eq(pricingRules.tenantId, tenantId),
        eq(pricingRules.isActive, true)
      ))
      .orderBy(desc(pricingRules.priority));
  }

  async associateRuleWithPriceList(priceListId: string, ruleId: string, tenantId: string) {
    // Simplified: Just ensure the rule exists and is active
    const [rule] = await db
      .select()
      .from(pricingRules)
      .where(and(
        eq(pricingRules.id, ruleId),
        eq(pricingRules.tenantId, tenantId)
      ));
    
    if (rule) {
      await db
        .update(pricingRules)
        .set({ isActive: true })
        .where(eq(pricingRules.id, ruleId));
    }
  }

  async removeRuleFromPriceList(priceListId: string, ruleId: string, tenantId: string) {
    // Simplified: Just deactivate the rule
    await db
      .update(pricingRules)
      .set({ isActive: false })
      .where(and(
        eq(pricingRules.id, ruleId),
        eq(pricingRules.tenantId, tenantId)
      ));
  }

  async applyRulesToPriceList(priceListId: string, ruleIds: string[], tenantId: string) {
    const results = [];
    
    // Get all items in the price list
    const items = await db
      .select()
      .from(priceListItems)
      .where(and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.tenantId, tenantId)
      ));

    // Get the rules to apply
    const rules = await db
      .select()
      .from(pricingRules)
      .where(and(
        inArray(pricingRules.id, ruleIds),
        eq(pricingRules.tenantId, tenantId),
        eq(pricingRules.isActive, true)
      ))
      .orderBy(desc(pricingRules.priority));

    // Apply rules to each item
    for (const item of items) {
      let newPrice = parseFloat(item.unitPrice);
      
      for (const rule of rules) {
        const conditions = rule.conditions as any;
        const actions = rule.actions as any;
        
        // Simple condition checking (can be expanded)
        let shouldApply = true;
        
        if (conditions.minPrice && newPrice < conditions.minPrice) shouldApply = false;
        if (conditions.maxPrice && newPrice > conditions.maxPrice) shouldApply = false;
        
        if (shouldApply) {
          switch (rule.ruleType) {
            case 'percentual':
              newPrice = newPrice * (1 + (actions.percentage || 0) / 100);
              break;
            case 'fixo':
              newPrice = newPrice + (actions.fixedAmount || 0);
              break;
            case 'escalonado':
              // Implement stepped pricing logic
              break;
          }
        }
      }
      
      // Update the item price
      if (newPrice !== parseFloat(item.unitPrice)) {
        await db
          .update(priceListItems)
          .set({
            finalPrice: newPrice.toFixed(2),
            updatedAt: new Date()
          })
          .where(and(
            eq(priceListItems.id, item.id),
            eq(priceListItems.tenantId, tenantId)
          ));
        
        results.push({ itemId: item.itemId, oldPrice: item.unitPrice, newPrice: newPrice.toFixed(2) });
      }
    }
    
    return results;
  }
}