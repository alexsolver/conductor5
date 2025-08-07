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
  private db: any;

  constructor(db: any) {
    if (!db) {
      throw new Error('Database connection is required but was not provided');
    }

    this.db = db;
    console.log('🔌 LPURepository: Database connection assigned successfully');

    // Test connection synchronously for immediate feedback
    this.validateConnection();
  }

  private validateConnection() {
    try {
      console.log('🔌 LPURepository: Validating database connection...');

      if (!this.db) {
        throw new Error('Database connection is null or undefined');
      }

      if (typeof this.db.select !== 'function') {
        throw new Error('Database connection does not have required methods');
      }

      console.log('✅ LPURepository: Database connection validation successful');
    } catch (error) {
      console.error('❌ LPURepository: Database connection validation failed:', error);
      throw new Error(`LPURepository database validation failed: ${error.message}`);
    }
  }

  async getLPUStats(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Set search path and execute query
    await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`));

    const result = await this.db.execute(sql`
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
        FROM price_lists
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
  async getAllPriceLists(tenantId: string): Promise<any[]> {
    try {
      console.log('🔍 LPURepository.getAllPriceLists: Starting query for tenant:', tenantId);

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const { queryCache } = await import('../../../../database/IntelligentCacheManager');
      const cacheKey = `price-lists-${tenantId}`;

      // Check cache first
      const cachedPriceLists = queryCache.get(cacheKey);
      if (cachedPriceLists) {
        console.log(`📈 [LPURepository] Cache hit for price lists: ${tenantId}`);
        return cachedPriceLists;
      }

      console.log('🔍 LPURepository.getAllPriceLists: Cache miss, executing optimized query...');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Set search path to tenant schema
      await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`));

      const startTime = Date.now();
      const result = await Promise.race([
        this.db.execute(sql`
          SELECT 
            pl.id,
            pl.tenant_id,
            pl.list_name as name,
            pl.description,
            pl.version,
            pl.application_type,
            pl.customer_company_id,
            pl.contract_id,
            pl.region,
            pl.valid_from,
            pl.valid_to,
            pl.is_active,
            pl.auto_apply_to_orders,
            pl.auto_apply_to_quotes,
            pl.created_at,
            pl.updated_at,
            pl.created_by_id,
            cc.name as customer_company_name
          FROM price_lists pl
          LEFT JOIN companies cc 
            ON pl.customer_company_id = cc.id
          WHERE pl.tenant_id = ${tenantId}
          ORDER BY pl.created_at DESC
          LIMIT 50
        `),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 8000)
        )
      ]);

      const queryTime = Date.now() - startTime;
      console.log(`⚡ [LPURepository] Price lists query completed in ${queryTime}ms`);
      console.log(`✅ LPURepository.getAllPriceLists: Query successful, found ${result.rows.length} price lists`);

      // Cache results with 3-minute TTL
      queryCache.set(cacheKey, result.rows, {
        ttl: 180000, // 3 minutes
        tags: [`tenant-${tenantId}`, 'price-lists']
      });

      console.log(`💾 [LPURepository] Price lists cached for tenant: ${tenantId}`);
      return result.rows;

    } catch (error) {
      console.error('❌ LPURepository.getAllPriceLists: Database error:', error);
      console.error('❌ LPURepository.getAllPriceLists: Stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to fetch price lists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPriceListById(id: string, tenantId: string) {
    const [priceList] = await this.db
      .select()
      .from(priceLists)
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)));
    return priceList;
  }

  async createPriceList(data: any) {
    // Invalidate cache for the tenant when a new price list is created
    await this.invalidateCache(data.tenantId, 'price-lists');
    const [priceList] = await this.db
      .insert(priceLists)
      .values(data)
      .returning();
    return priceList;
  }

  async updatePriceList(id: string, tenantId: string, data: any) {
    // Invalidate cache for the tenant when a price list is updated
    await this.invalidateCache(tenantId, 'price-lists');
    const [priceList] = await this.db
      .update(priceLists)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)))
      .returning();
    return priceList;
  }

  // DELETE PRICE LIST
  async deletePriceList(id: string, tenantId: string) {
    // Invalidate cache for the tenant when a price list is deleted
    await this.invalidateCache(tenantId, 'price-lists');
    const [deleted] = await this.db
      .delete(priceLists)
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)))
      .returning();
    return deleted;
  }

  // VERSIONAMENTO DE LISTAS
  async createPriceListVersion(data: any) {
    const [version] = await this.db
      .insert(priceListVersions)
      .values(data)
      .returning();
    return version;
  }

  async getPriceListVersions(priceListId: string, tenantId: string) {
    return await this.db
      .select()
      .from(priceListVersions)
      .where(and(
        eq(priceListVersions.priceListId, priceListId),
        eq(priceListVersions.tenantId, tenantId)
      ))
      .orderBy(desc(priceListVersions.createdAt));
  }

  async submitForApproval(versionId: string, tenantId: string, submittedBy: string) {
    const [version] = await this.db
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
    const [version] = await this.db
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
    const [version] = await this.db
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
    return await this.db
      .select()
      .from(priceListItems)
      .where(and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.tenantId, tenantId)
      ))
      .orderBy(asc(priceListItems.createdAt));
  }

  async addPriceListItem(data: any) {
    const [item] = await this.db
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
  async getAllPricingRules(tenantId: string): Promise<any[]> {
    try {
      console.log('🔍 LPURepository.getAllPricingRules: Starting query for tenant:', tenantId);

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const { queryCache } = await import('../../../../database/IntelligentCacheManager');
      const cacheKey = `pricing-rules-${tenantId}`;

      // Check cache first
      const cachedRules = queryCache.get(cacheKey);
      if (cachedRules) {
        console.log(`📈 [LPURepository] Cache hit for pricing rules: ${tenantId}`);
        return cachedRules;
      }

      console.log('🔍 LPURepository.getAllPricingRules: Cache miss, executing optimized query...');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Set search path to tenant schema
      await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`));

      const startTime = Date.now();
      const result = await Promise.race([
        this.db.execute(sql`
          SELECT 
            pr.id,
            pr.tenant_id,
            pr.name,
            pr.description,
            pr.rule_type,
            pr.conditions,
            pr.actions,
            pr.priority,
            pr.is_active,
            pr.created_at,
            pr.updated_at
          FROM pricing_rules pr
          WHERE pr.tenant_id = ${tenantId}
          ORDER BY pr.priority DESC, pr.created_at DESC
          LIMIT 100
        `),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 6000)
        )
      ]);

      const queryTime = Date.now() - startTime;
      console.log(`⚡ [LPURepository] Pricing rules query completed in ${queryTime}ms`);
      console.log(`✅ LPURepository.getAllPricingRules: Query successful, found ${result.rows.length} pricing rules`);

      // Cache results with 5-minute TTL
      queryCache.set(cacheKey, result.rows, {
        ttl: 300000, // 5 minutes
        tags: [`tenant-${tenantId}`, 'pricing-rules']
      });

      console.log(`💾 [LPURepository] Pricing rules cached for tenant: ${tenantId}`);
      return result.rows;
    } catch (error) {
      console.error('❌ LPURepository.getAllPricingRules: Database error:', error);
      console.error('❌ LPURepository.getAllPricingRules: Stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to fetch pricing rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPricingRule(data: InsertPricingRule) {
    // Invalidate cache for the tenant when a new pricing rule is created
    await this.invalidateCache(data.tenantId, 'pricing-rules');
    const [rule] = await this.db
      .insert(pricingRules)
      .values(data)
      .returning();
    return rule;
  }

  async updatePricingRule(id: string, tenantId: string, data: Partial<InsertPricingRule>) {
    // Invalidate cache for the tenant when a pricing rule is updated
    await this.invalidateCache(tenantId, 'pricing-rules');
    const [rule] = await this.db
      .update(pricingRules)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId)))
      .returning();
    return rule;
  }

  async getPricingRuleById(id: string, tenantId: string) {
    const [rule] = await this.db
      .select()
      .from(pricingRules)
      .where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId)));
    return rule;
  }

  async deletePricingRule(id: string, tenantId: string) {
    // Invalidate cache for the tenant when a pricing rule is deleted
    await this.invalidateCache(tenantId, 'pricing-rules');
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

    // Invalidate cache when margins are updated
    await this.invalidateCache(tenantId, 'price-lists');
    await this.invalidateCache(tenantId, 'pricing-rules'); // Rules might be affected by margin changes

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
      // Invalidate cache when rules are associated
      await this.invalidateCache(tenantId, 'pricing-rules');
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
    // Invalidate cache when rules are removed
    await this.invalidateCache(tenantId, 'pricing-rules');
  }

  async applyRulesToPriceList(priceListId: string, ruleIds: string[] = [], tenantId: string) {
    const results = [];

    // Get all items in the price list
    const items = await db
      .select()
      .from(priceListItems)
      .where(and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.tenantId, tenantId)
      ));

    // Get the rules to apply - if no specific rules provided, get all active rules
    let rules;
    if (ruleIds.length > 0) {
      rules = await db
        .select()
        .from(pricingRules)
        .where(and(
          inArray(pricingRules.id, ruleIds),
          eq(pricingRules.tenantId, tenantId),
          eq(pricingRules.isActive, true)
        ))
        .orderBy(desc(pricingRules.priority));
    } else {
      rules = await db
        .select()
        .from(pricingRules)
        .where(and(
          eq(pricingRules.tenantId, tenantId),
          eq(pricingRules.isActive, true)
        ))
        .orderBy(desc(pricingRules.priority));
    }

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
            unitPrice: newPrice.toFixed(2),
            updatedAt: new Date()
          })
          .where(and(
            eq(priceListItems.id, item.id),
            eq(priceListItems.tenantId, tenantId)
          ));

        results.push({ itemId: item.itemId, oldPrice: item.unitPrice, newPrice: newPrice.toFixed(2) });
      }
    }

    // Invalidate cache after applying rules, as prices might have changed
    await this.invalidateCache(tenantId, 'price-lists');

    return results;
  }

  // Cache invalidation methods
  async invalidateCache(tenantId: string, cacheType?: 'stats' | 'price-lists' | 'pricing-rules'): Promise<void> {
    try {
      const { queryCache } = await import('../../../../database/IntelligentCacheManager');

      if (cacheType) {
        const cacheKey = `${cacheType === 'stats' ? 'lpu-stats' : cacheType}-${tenantId}`;
        queryCache.delete(cacheKey);
        console.log(`🗑️ [LPURepository] Cache invalidated: ${cacheKey}`);
      } else {
        // Invalidate all tenant cache
        const invalidated = queryCache.invalidateByTag(`tenant-${tenantId}`);
        console.log(`🗑️ [LPURepository] All tenant cache invalidated: ${invalidated} entries`);
      }
    } catch (error) {
      console.error('❌ [LPURepository] Cache invalidation error:', error);
    }
  }
}