import { db } from '../../../../db';
import {
  priceLists,
  priceListItems,
  priceListVersions,
  pricingRules,
  dynamicPricing,
  items,
  type PriceList,
  type PricingRule,
  type InsertPricingRule,
  type DynamicPricing,
  type InsertDynamicPricing
} from '@shared/schema';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class LPURepository {
  private db: any;
  private tenantSchema: string = ''; // Added to store tenant schema
  private tenantId: string = ''; // Added to store tenant ID
  private cache: any; // Assuming cache is available

  constructor(db: any, cache: any = null) { // Added cache parameter
    if (!db) {
      throw new Error('Database connection is required but was not provided');
    }

    this.db = db;
    this.cache = cache; // Assign cache
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
      throw new Error(`LPURepository database validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper to set tenant schema and ID, usually called by the service layer before repository methods
  setTenantContext(tenantId: string) {
    this.tenantId = tenantId;
    this.tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    console.log(`🔌 LPURepository: Tenant context set to ${this.tenantSchema}`);
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
          0 as pending_approval,
          COUNT(*) FILTER (WHERE is_active = true) as approved_versions,
          0 as active_rules,
          0 as approval_rate
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
            pl.name,
            COALESCE(pl.description, '') as description,
            COALESCE(pl.list_code, CONCAT('LIST_', pl.id)) as code,
            '1.0' as version,
            COALESCE(pl.currency, 'BRL') as currency,
            NULL as company_id,
            NULL as contract_id,
            NULL as cost_center_id,
            pl.valid_from,
            pl.valid_to,
            pl.is_active,
            pl.automatic_margin,
            '' as notes,
            pl.created_at,
            pl.updated_at,
            pl.created_by_id,
            pl.updated_by
          FROM price_lists pl
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

      // Debug the first row to check data types
      if (result.rows.length > 0) {
        console.log('🔍 [DEBUG] First price list row:', JSON.stringify(result.rows[0], null, 2));
        console.log('🔍 [DEBUG] isActive field type:', typeof result.rows[0].is_active);
        console.log('🔍 [DEBUG] isActive value:', result.rows[0].is_active);
      }

      // Cache results with 3-minute TTL
      queryCache.set(cacheKey, result.rows, {
        ttl: 180000, // 3 minutes
        tags: [`tenant-${tenantId}`, 'price-lists']
      });

      console.log(`💾 [LPURepository] Price lists cached for tenant: ${tenantId}`);

      // Transform snake_case to camelCase for frontend compatibility
      const transformedRows = result.rows.map((row: any) => ({
        ...row,
        isActive: row.is_active, // Map snake_case to camelCase
        validFrom: row.valid_from,
        validTo: row.valid_to,
        tenantId: row.tenant_id,
        customerCompanyId: row.customer_company_id,
        contractId: row.contract_id,
        costCenterId: row.cost_center_id,
        automaticMargin: row.automatic_margin,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by_id || row.created_by,
        updatedBy: row.updated_by
      }));

      return transformedRows;

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

    // Build update object with only valid fields, handling timestamps properly
    const updateData: any = {
      updatedAt: new Date()
    };

    // Safely add fields that exist in the schema
    const validFields = ['name', 'code', 'description', 'version', 'customerId', 'customerCompanyId', 
                        'contractId', 'costCenterId', 'isActive', 'currency', 'automaticMargin', 'notes', 'updatedBy'];

    validFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Handle timestamp fields specially
    if (data.validFrom) {
      updateData.validFrom = data.validFrom instanceof Date ? data.validFrom : new Date(data.validFrom);
    }
    if (data.validTo) {
      updateData.validTo = data.validTo instanceof Date ? data.validTo : new Date(data.validTo);
    }

    const [priceList] = await this.db
      .update(priceLists)
      .set(updateData)
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

  async duplicatePriceList(priceListId: string, tenantId: string): Promise<any> {
    try {
      console.log('🔍 LPURepository.duplicatePriceList: Starting for ID:', priceListId);

      // Validate inputs
      if (!priceListId || !tenantId) {
        throw new Error('ID da lista e tenant são obrigatórios');
      }

      // Get original price list
      const originalList = await this.db
        .select()
        .from(priceLists)
        .where(and(
          eq(priceLists.id, priceListId),
          eq(priceLists.tenantId, tenantId)
        ))
        .limit(1);

      if (originalList.length === 0) {
        console.log('❌ Lista de preços não encontrada:', priceListId);
        return null;
      }

      const original = originalList[0];
      console.log('✅ Lista original encontrada:', original.name);

      // Create duplicate with new ID and updated version
      const currentVersion = parseFloat(original.version || '1.0');
      const newVersion = (currentVersion + 0.1).toFixed(1);
      const timestamp = Date.now();

      const duplicateData = {
        id: crypto.randomUUID(),
        tenantId,
        name: `${original.name} (Cópia)`,
        description: original.description || null,
        code: `${original.code}_COPY_${timestamp}`.substring(0, 50), // Ensure code length limit
        version: newVersion,
        currency: original.currency || 'BRL',
        customerCompanyId: original.customerCompanyId || null,
        contractId: original.contractId || null,
        costCenterId: original.costCenterId || null,
        validFrom: new Date(),
        validTo: original.validTo || null,
        isActive: false, // Duplicates start as inactive
        automaticMargin: original.automaticMargin || null,
        notes: `Duplicado de: ${original.name} (v${original.version})`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: original.createdById || null,
        updatedBy: original.updatedBy || null
      };

      // Insert new price list
      const [newPriceList] = await this.db
        .insert(priceLists)
        .values(duplicateData)
        .returning();

      console.log('✅ Nova lista criada:', newPriceList.id);

      // Also duplicate price list items if they exist
      try {
        const originalItems = await this.db
          .select()
          .from(priceListItems)
          .where(eq(priceListItems.priceListId, priceListId));

        if (originalItems.length > 0) {
          console.log(`🔄 Duplicando ${originalItems.length} itens...`);

          const duplicateItems = originalItems.map(item => ({
            id: crypto.randomUUID(),
            priceListId: newPriceList.id,
            tenantId: tenantId,
            itemId: item.itemId || null,
            serviceTypeId: item.serviceTypeId || null,
            unitPrice: item.unitPrice || 0,
            specialPrice: item.specialPrice || null,
            hourlyRate: item.hourlyRate || null,
            travelCost: item.travelCost || null,
            isActive: item.isActive || true,
            notes: item.notes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdById: item.createdById || null,
            updatedBy: item.updatedBy || null
          }));

          await this.db
            .insert(priceListItems)
            .values(duplicateItems);

          console.log('✅ Itens duplicados com sucesso');
        }
      } catch (itemsError) {
        console.warn('⚠️ Erro ao duplicar itens (não crítico):', itemsError);
        // Continue even if items duplication fails
      }

      // Clear cache
      const cacheKey = `price-lists-${tenantId}`;
      if (this.cache) {
        this.cache.delete(cacheKey);
      }

      console.log('✅ Lista duplicada com sucesso:', newPriceList.name);
      return newPriceList;

    } catch (error) {
      console.error('❌ Repository duplicate price list error:', error);

      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Erro ao duplicar lista: ${error.message}`);
      }
      throw new Error('Erro interno ao duplicar lista de preços');
    }
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
    const priceListItemsWithNames = await this.db
      .select({
        // Price List Item fields
        id: priceListItems.id,
        tenantId: priceListItems.tenantId,
        priceListId: priceListItems.priceListId,
        itemId: priceListItems.itemId,
        serviceTypeId: priceListItems.serviceTypeId,
        unitPrice: priceListItems.unitPrice,
        specialPrice: priceListItems.specialPrice,
        scaleDiscounts: priceListItems.scaleDiscounts,
        hourlyRate: priceListItems.hourlyRate,
        travelCost: priceListItems.travelCost,
        isActive: priceListItems.isActive,
        createdAt: priceListItems.createdAt,
        updatedAt: priceListItems.updatedAt,
        // Item fields
        itemName: items.name,
        itemType: items.type,
        itemDescription: items.description,
        measurementUnit: items.measurementUnit
      })
      .from(priceListItems)
      .leftJoin(items, eq(priceListItems.itemId, items.id))
      .where(and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.tenantId, tenantId)
      ))
      .orderBy(asc(priceListItems.createdAt));

    return priceListItemsWithNames;
  }

  async getPriceListItemById(id: string): Promise<any> {
    if (!this.tenantSchema || !this.tenantId) {
      throw new Error("Tenant context not set. Call setTenantContext first.");
    }
    return await this.db.execute(sql.raw(`SET search_path TO "${this.tenantSchema}"`))
      .then(() => this.db
        .select()
        .from(priceListItems)
        .where(and(
          eq(priceListItems.id, id),
          eq(priceListItems.tenantId, this.tenantId)
        ))
      ).then((rows: any[]) => rows?.[0]);
  }

  async addPriceListItem(data: any): Promise<any> {
    // Ensure price_list_id is provided
    if (!data.priceListId && !data.price_list_id) {
      throw new Error('price_list_id é obrigatório');
    }

    // Use priceListId or price_list_id
    const priceListId = data.priceListId || data.price_list_id;
    const tenantId = data.tenantId;

    if (!tenantId) {
      throw new Error('tenant_id é obrigatório');
    }

    // Invalidate cache for the tenant when an item is added
    await this.invalidateCache(tenantId);

    const [newItem] = await this.db
      .insert(priceListItems)
      .values({
        tenantId,
        priceListId,
        itemId: data.itemId || null,
        serviceTypeId: data.serviceTypeId || null,
        unitPrice: data.unitPrice || '0',
        specialPrice: data.specialPrice || null,
        hourlyRate: data.hourlyRate || null,
        travelCost: data.travelCost || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      })
      .returning();

    return newItem;
  }

  async updatePriceListItem(id: string, tenantId: string, data: any) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const [item] = await this.db
      .execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
        .update(priceListItems)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(priceListItems.id, id), eq(priceListItems.tenantId, tenantId)))
        .returning());
    return item;
  }

  async deletePriceListItem(id: string, tenantId: string) {
    // Invalidate cache for the tenant when an item is deleted
    await this.invalidateCache(tenantId, 'price-list-items');

    const [deletedItem] = await this.db
      .delete(priceListItems)
      .where(and(eq(priceListItems.id, id), eq(priceListItems.tenantId, tenantId)))
      .returning();

    return deletedItem;
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

      let result;
      try {
        result = await this.db.execute(sql`
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
          ORDER BY pr.priority ASC, pr.created_at DESC
          LIMIT 50
        `);
      } catch (tableError: any) {
        if (tableError.message.includes('does not exist')) {
          console.warn('🔄 [LPURepository] pricing_rules table does not exist, returning empty array');
          return [];
        }
        throw tableError;
      }

      console.log(`✅ LPURepository.getAllPricingRules: Query successful, found ${result.rows.length} pricing rules`);

      // Cache results with 5-minute TTL
      queryCache.set(cacheKey, result.rows, {
        ttl: 300000, // 5 minutes
        tags: [`tenant-${tenantId}`, 'pricing-rules']
      });

      return result.rows;

    } catch (error) {
      console.error('❌ LPURepository.getAllPricingRules: Database error:', error);
      console.error('❌ LPURepository.getAllPricingRules: Stack:', error instanceof Error ? error.stack : 'No stack trace');

      // Return empty array instead of throwing error to prevent 500 responses
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.warn('🔄 [LPURepository] Returning empty array due to missing table/column');
        return [];
      }

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
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const [rule] = await this.db
      .execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
        .select()
        .from(pricingRules)
        .where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId))));
    return rule;
  }

  async deletePricingRule(id: string, tenantId: string) {
    // Invalidate cache for the tenant when a pricing rule is deleted
    await this.invalidateCache(tenantId, 'pricing-rules');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
        .delete(pricingRules)
        .where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId))));
  }

  // PRECIFICAÇÃO DINÂMICA
  async getDynamicPricing(priceListId: string, tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    return await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
        .select()
        .from(dynamicPricing)
        .where(and(
          eq(dynamicPricing.priceListId, priceListId),
          eq(dynamicPricing.tenantId, tenantId)
        ))
        .orderBy(desc(dynamicPricing.lastUpdated)));
  }

  async updateDynamicPricing(data: InsertDynamicPricing) {
    const schemaName = `tenant_${data.tenantId.replace(/-/g, '_')}`;
    const [pricing] = await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
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
        .returning());
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
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`));

    // Atualizar margem base da lista
    if (baseMargin !== undefined) {
      await this.db
        .update(priceLists)
        .set({ automaticMargin: baseMargin, updatedAt: new Date() })
        .where(and(eq(priceLists.id, priceListId), eq(priceLists.tenantId, tenantId)));
    }

    // Atualizar margens específicas por item
    if (itemMargins && itemMargins.length > 0) {
      for (const { itemId, margin } of itemMargins) {
        // Buscar preço base do item
        const [currentItem] = await this.db
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

          await this.db
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
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    return await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
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
        .orderBy(desc(pricingRules.priority)));
  }

  async associateRuleWithPriceList(priceListId: string, ruleId: string, tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    // Simplified: Just ensure the rule exists and is active
    const [rule] = await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
        .select()
        .from(pricingRules)
        .where(and(
          eq(pricingRules.id, ruleId),
          eq(pricingRules.tenantId, tenantId)
        )));

    if (rule) {
      await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`))
        .then(() => this.db
          .update(pricingRules)
          .set({ isActive: true })
          .where(eq(pricingRules.id, ruleId)));
      // Invalidate cache when rules are associated
      await this.invalidateCache(tenantId, 'pricing-rules');
    }
  }

  async removeRuleFromPriceList(priceListId: string, ruleId: string, tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    // Simplified: Just deactivate the rule
    await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`))
      .then(() => this.db
        .update(pricingRules)
        .set({ isActive: false })
        .where(and(
          eq(pricingRules.id, ruleId),
          eq(pricingRules.tenantId, tenantId)
        )));
    // Invalidate cache when rules are removed
    await this.invalidateCache(tenantId, 'pricing-rules');
  }

  async applyRulesToPriceList(priceListId: string, ruleIds: string[] = [], tenantId: string) {
    const results = [];
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    await this.db.execute(sql.raw(`SET search_path TO "${schemaName}"`));

    // Get all items in the price list
    const items = await this.db
      .select()
      .from(priceListItems)
      .where(and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.tenantId, tenantId)
      ));

    // Get the rules to apply - if no specific rules provided, get all active rules
    let rules;
    if (ruleIds.length > 0) {
      rules = await this.db
        .select()
        .from(pricingRules)
        .where(and(
          inArray(pricingRules.id, ruleIds),
          eq(pricingRules.tenantId, tenantId),
          eq(pricingRules.isActive, true)
        ))
        .orderBy(desc(pricingRules.priority));
    } else {
      rules = await this.db
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

        if (conditions?.minPrice && newPrice < conditions.minPrice) shouldApply = false;
        if (conditions?.maxPrice && newPrice > conditions.maxPrice) shouldApply = false;

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
        await this.db
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