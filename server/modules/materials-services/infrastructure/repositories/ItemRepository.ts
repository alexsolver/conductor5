import { eq, and, like, desc, or, sql, inArray, asc } from 'drizzle-orm';
import { items, itemAttachments, itemLinks, itemCustomerLinks, itemSupplierLinks, customerItemMappings } from '@shared/schema';
import { companies as companyTable } from '@shared/schema';
import { suppliers as supplierTable } from '@shared/schema';
import type { Item } from '../../domain/entities';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as crypto from 'crypto';

import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';
import { Material } from '../../domain/entities/Material';

export class ItemRepository implements IMaterialRepository {
  private db: NodePgDatabase<any>;
  private tenantId: string; // Adicionado para uso nos métodos SQL brutos

  constructor(db: NodePgDatabase<any>, tenantId?: string) {
    this.db = db;
    this.tenantId = tenantId || '';
  }

  async create(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const [item] = await this.db
      .insert(items)
      .values({
        ...data,
        // Handle text fields properly
        maintenancePlan: data.maintenancePlan || null,
        defaultChecklist: data.defaultChecklist || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return item as Item;
  }

  async findById(id: string, tenantId: string): Promise<Item | null> {
    const [item] = await this.db
      .select({
        id: items.id,
        tenantId: items.tenantId,
        name: items.name,
        description: items.description,
        type: items.type,
        integrationCode: items.integrationCode,
        measurementUnit: items.measurementUnit,
        maintenancePlan: items.maintenancePlan,
        defaultChecklist: items.defaultChecklist,
        status: items.status,
        active: items.active,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        createdBy: items.createdBy,
        updatedBy: items.updatedBy
      })
      .from(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .limit(1);

    return item as Item || null;
  }

  async findByTenant(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    search?: string;
    type?: string;
    status?: string;
    active?: boolean;
    companyId?: string;
  }): Promise<Item[]> {
    this.tenantId = tenantId; // Define o tenantId para uso em métodos SQL brutos
    const conditions = [eq(items.tenantId, tenantId)];

    if (options?.search) {
      conditions.push(
        or(
          like(items.name, `%${options.search}%`),
          like(items.description, `%${options.search}%`),
          like(items.integrationCode, `%${options.search}%`)
        )!
      );
    }

    if (options?.type && options.type !== 'all') {
      conditions.push(eq(items.type, options.type));
    }

    if (options?.status && options.status !== 'all') {
      conditions.push(eq(items.status, options.status as any));
    }

    if (options?.active !== undefined) {
      conditions.push(eq(items.active, options.active));
    }

    // Filter by company - only show items linked to specific company
    if (options?.companyId) {
      const linkedItemIds = await this.db
        .select({ itemId: itemCustomerLinks.itemId })
        .from(itemCustomerLinks)
        .where(and(
          eq(itemCustomerLinks.tenantId, tenantId),
          eq(itemCustomerLinks.companyId, options.companyId),
          eq(itemCustomerLinks.isActive, true)
        ));

      const itemIds = linkedItemIds.map(link => link.itemId);
      if (itemIds.length > 0) {
        conditions.push(inArray(items.id, itemIds));
      } else {
        // If no items are linked to this company, return empty array
        return [];
      }
    }

    const baseQuery = this.db
      .select({
        id: items.id,
        tenantId: items.tenantId,
        active: items.active,
        type: items.type,
        name: items.name,
        integrationCode: items.integrationCode,
        description: items.description,
        measurementUnit: items.measurementUnit,
        maintenancePlan: items.maintenancePlan,
        defaultChecklist: items.defaultChecklist,
        // groupName: items.groupName, // Column doesn't exist in current schema
        status: items.status,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        createdBy: items.createdBy,
        updatedBy: items.updatedBy
      })
      .from(items)
      .where(and(...conditions))
      .orderBy(desc(items.createdAt));

    if (options?.limit && options?.offset) {
      return await baseQuery.limit(options.limit).offset(options.offset);
    } else if (options?.limit) {
      return await baseQuery.limit(options.limit);
    }

    return await baseQuery;
  }

  async update(id: string, tenantId: string, data: Partial<Item>): Promise<Item | null> {
    // Filter out any properties that don't exist in the schema and handle JSON fields
    const { groupName, maintenancePlan, defaultChecklist, ...validData } = data as any;

    // Handle text fields properly - fields are TEXT, not JSON
    const updateData = {
      ...validData,
      updatedAt: new Date()
    };

    // Add text fields if they have content
    if (maintenancePlan !== undefined) {
      updateData.maintenancePlan = maintenancePlan || null;
    }
    if (defaultChecklist !== undefined) {
      updateData.defaultChecklist = defaultChecklist || null;
    }

    const [item] = await this.db
      .update(items)
      .set(updateData)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .returning();

    return item as Item || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)));

    return (result.rowCount || 0) > 0;
  }

  async addAttachment(itemId: string, tenantId: string, attachment: {
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemAttachments)
      .values({
        itemId,
        tenantId,
        ...attachment,
        createdAt: new Date()
      })
      .returning();

    return result;
  }

  async getAttachments(itemId: string, tenantId: string) {
    // Return empty array if table doesn't exist
    try {
      return await this.db
        .select()
        .from(itemAttachments)
        .where(and(eq(itemAttachments.itemId, itemId), eq(itemAttachments.tenantId, tenantId)))
        .orderBy(desc(itemAttachments.createdAt));
    } catch (error: any) {
      if (error.code === '42P01') { // relation does not exist
        return [];
      }
      throw error;
    }
  }

  async addItemLink(linkData: {
    tenantId: string;
    itemId: string;
    linkedItemId: string;
    relationship: string;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemLinks)
      .values({
        ...linkData,
        linkType: 'item_item' as any,
        createdAt: new Date()
      })
      .returning();

    return result;
  }

  async addCustomerLink(linkData: {
    tenantId: string;
    itemId: string;
    customerId: string;
    alias?: string;
    sku?: string;
    barcode?: string;
    qrCode?: string;
    isAsset?: boolean;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemCustomerLinks)
      .values({
        ...linkData,
        createdAt: new Date()
      })
      .returning();

    return result;
  }

  async addSupplierLink(linkData: {
    tenantId: string;
    itemId: string;
    supplierId: string;
    partNumber?: string;
    description?: string;
    qrCode?: string;
    barcode?: string;
    unitPrice?: number;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemSupplierLinks)
      .values({
        ...linkData,
        createdAt: new Date()
      })
      .returning();

    return result;
  }

  async getItemLinks(itemId: string, tenantId?: string): Promise<{ customers: any[], suppliers: any[] }> {
    try {
      const { pool } = await import('../../../../db');

      if (!tenantId) {
        console.warn('⚠️  Tenant ID não fornecido para getItemLinks');
        return { customers: [], suppliers: [] };
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`🔍 Buscando vínculos para item ${itemId} no schema ${schemaName}`);

      // 🔧 CORREÇÃO: Buscar vínculos de empresas com fallback robusto e verificação de tabelas
      let customerLinks = [];

      // Primeiro: verificar quais tabelas existem
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_name IN ('customer_item_mappings', 'item_customer_links', 'companies', 'customers')
      `;

      try {
        const tablesResult = await pool.query(tableCheckQuery);
        const availableTables = tablesResult.rows.map(row => row.table_name);
        console.log(`🔍 [CUSTOMER-LINKS] Available tables: ${availableTables.join(', ')}`);

        // Estratégia 1: customer_item_mappings (preferencial)
        if (availableTables.includes('customer_item_mappings')) {
          try {
            const customerLinksResult = await pool.query(`
              SELECT 
                c.id,
                c.name,
                c.display_name,
                COALESCE(c.display_name, c.name, 'Empresa sem nome') as name,
                cim.created_at as linked_at,
                cim.is_active,
                'customer_item_mappings' as source_table
              FROM "${schemaName}".customer_item_mappings cim
              JOIN "${schemaName}".companies c ON cim.customer_id = c.id
              WHERE cim.item_id = $1 AND cim.is_active = true AND c.is_active = true
              ORDER BY COALESCE(c.display_name, c.name)
            `, [itemId]);
            customerLinks = customerLinksResult.rows;
            console.log(`✅ [CUSTOMER-LINKS] Found ${customerLinks.length} companies via customer_item_mappings`);
          } catch (error) {
            console.log(`⚠️ [CUSTOMER-LINKS] customer_item_mappings query failed:`, error.message);
          }
        }

        // Estratégia 2: item_customer_links + companies
        if (customerLinks.length === 0 && availableTables.includes('item_customer_links') && availableTables.includes('companies')) {
          try {
            const fallbackResult = await pool.query(`
              SELECT 
                c.id, 
                c.name,
                c.display_name,
                COALESCE(c.display_name, c.name, 'Empresa sem nome') as name,
                icl.created_at as linked_at,
                icl.is_active,
                'item_customer_links' as source_table
              FROM "${schemaName}".item_customer_links icl
              JOIN "${schemaName}".companies c ON icl.customer_id = c.id
              WHERE icl.item_id = $1 AND icl.is_active = true AND c.is_active = true
              ORDER BY COALESCE(c.display_name, c.name)
            `, [itemId]);
            customerLinks = fallbackResult.rows;
            console.log(`✅ [CUSTOMER-LINKS] Found ${customerLinks.length} companies via item_customer_links + companies`);
          } catch (fallbackError) {
            console.log(`⚠️ [CUSTOMER-LINKS] Fallback 1 failed:`, fallbackError.message);
          }
        }

        // Estratégia 3: item_customer_links + customers
        if (customerLinks.length === 0 && availableTables.includes('item_customer_links') && availableTables.includes('customers')) {
          try {
            const fallback2Result = await pool.query(`
              SELECT 
                c.id, 
                c.name,
                c.display_name,
                COALESCE(c.display_name, c.name, 'Empresa sem nome') as name,
                icl.created_at as linked_at,
                icl.is_active,
                'item_customer_links_alt' as source_table
              FROM "${schemaName}".item_customer_links icl
              JOIN "${schemaName}".companies c ON icl.company_id = c.id
              WHERE icl.item_id = $1 AND icl.is_active = true AND c.is_active = true
              ORDER BY COALESCE(c.display_name, c.name)
            `, [itemId]);
            customerLinks = fallback2Result.rows;
            console.log(`✅ [CUSTOMER-LINKS] Found ${customerLinks.length} companies via item_customer_links + customers`);
          } catch (fallback2Error) {
            console.log(`⚠️ [CUSTOMER-LINKS] Fallback 2 failed:`, fallback2Error.message);
          }
        }

        if (customerLinks.length === 0) {
          console.log('❌ [CUSTOMER-LINKS] No customer links found using any strategy');
        }

      } catch (error) {
        console.error('❌ [CUSTOMER-LINKS] Critical error in table detection:', error);
        customerLinks = [];
      }

      // 🔧 CORREÇÃO: Buscar vínculos de fornecedores
      let supplierLinks = [];
      try {
        const supplierLinksResult = await pool.query(`
          SELECT s.id, 
                 COALESCE(s.name, 'Fornecedor sem nome') as name 
          FROM "${schemaName}".supplier_item_links sil
          INNER JOIN "${schemaName}".suppliers s ON sil.supplier_id = s.id
          WHERE sil.item_id = $1 
            AND sil.tenant_id = $2 
            AND sil.is_active = true
            AND s.is_active = true
          LIMIT 50
        `, [itemId, tenantId]);
        supplierLinks = supplierLinksResult.rows;
        console.log(`✅ [SUPPLIER-LINKS] Found ${supplierLinks.length} suppliers for item ${itemId}`);
      } catch (error) {
        console.error('❌ [SUPPLIER-LINKS] Error fetching supplier links:', error.message);
        supplierLinks = [];
      }

      console.log(`✅ Links encontrados para item ${itemId}: ${customerLinks.length} clientes, ${supplierLinks.length} fornecedores`);

      return {
        customers: customerLinks.map(c => ({
          id: c.id,
          name: c.name,
          linked_at: c.linked_at, // Note: linked_at might not be available in the new query
          is_active: c.is_active // Note: is_active might not be available in the new query
        })),
        suppliers: supplierLinks.map(s => ({
          id: s.id,
          name: s.name,
          linked_at: s.linked_at, // Note: linked_at might not be available in the new query
          is_active: s.is_active // Note: is_active might not be available in the new query
        }))
      };

    } catch (error) {
      console.error('❌ Erro crítico ao buscar vínculos do item:', error);
      return { customers: [], suppliers: [] };
    }
  }

  async getCustomerLinks(itemId: string, tenantId: string) {
    try {
      // Usar customer_item_mappings ao invés de itemCustomerLinks
      return await this.db
        .select()
        .from(customerItemMappings)
        .where(and(eq(customerItemMappings.itemId, itemId), eq(customerItemMappings.tenantId, tenantId)))
        .orderBy(desc(customerItemMappings.createdAt));
    } catch (error: any) {
      if (error.code === '42P01') { // relation does not exist
        return [];
      }
      throw error;
    }
  }

  async getSupplierLinks(itemId: string, tenantId: string) {
    try {
      // Usar item_supplier_links (tabela correta no schema)
      return await this.db
        .select({
          id: itemSupplierLinks.id,
          tenantId: itemSupplierLinks.tenantId,
          itemId: itemSupplierLinks.itemId,
          supplierId: itemSupplierLinks.supplierId,
          supplierItemCode: itemSupplierLinks.supplierItemCode,
          supplierItemName: itemSupplierLinks.supplierItemName,
          // leadTime: itemSupplierLinks.leadTime, // Column doesn't exist in current schema
          // minimumOrder: itemSupplierLinks.minimumOrder, // Column doesn't exist in current schema
          isPreferred: itemSupplierLinks.isPreferred,
          isActive: itemSupplierLinks.isActive,
          createdAt: itemSupplierLinks.createdAt
        })
        .from(itemSupplierLinks)
        .where(and(eq(itemSupplierLinks.itemId, itemId), eq(itemSupplierLinks.tenantId, tenantId)))
        .orderBy(desc(itemSupplierLinks.createdAt));
    } catch (error: any) {
      if (error.code === '42P01') { // relation does not exist
        return [];
      }
      throw error;
    }
  }

  async getStats(tenantId: string) {
    const totalItems = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.tenantId, tenantId));

    const activeItems = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.active, true)));

    const itemsByType = await this.db
      .select({
        type: items.type,
        count: sql<number>`count(*)`
      })
      .from(items)
      .where(eq(items.tenantId, tenantId))
      .groupBy(items.type);

    return {
      total: totalItems[0]?.count || 0,
      active: activeItems[0]?.count || 0,
      materials: itemsByType.find(item => item.type === 'material')?.count || 0,
      services: itemsByType.find(item => item.type === 'service')?.count || 0
    };
  }

  // 🔧 MÉTODO CORRIGIDO: Atualizar vínculos de item usando tabelas corretas
  async updateItemLinks(
    tenantId: string,
    itemId: string,
    links: { customers: string[]; suppliers: string[] },
    createdBy?: string
  ): Promise<void> {
    try {
      // 1. Remover vínculos existentes (usar tabelas corretas)
      const deletePromises = [];

      // customer_item_mappings ao invés de itemCustomerLinks
      try {
        await this.db.delete(customerItemMappings).where(and(
          eq(customerItemMappings.itemId, itemId),
          eq(customerItemMappings.tenantId, tenantId)
        ));
      } catch (error: any) {
        if (error.code !== '42P01') throw error; // Ignore table not found
      }

      // item_supplier_links (tabela correta no schema)
      try {
        await this.db.delete(itemSupplierLinks).where(and(
          eq(itemSupplierLinks.itemId, itemId),
          eq(itemSupplierLinks.tenantId, tenantId)
        ));
      } catch (error: any) {
        if (error.code !== '42P01') throw error; // Ignore table not found
      }

      // 2. Inserir novos vínculos
      const promises = [];

      // Vínculos de empresas (usar customer_item_mappings)
      if (links.customers.length > 0) {
        const customerLinkData = links.customers
          .filter(companyId => companyId && companyId.trim() !== '') // Filter out empty values
          .map(companyId => ({
            tenantId,
            itemId,
            customerId: companyId, // Referencia company_id
            isActive: true,
            createdBy,
            createdAt: new Date()
          }));
        if (customerLinkData.length > 0) {
          promises.push(this.db.insert(customerItemMappings).values(customerLinkData));
        }
      }

      // Vínculos de fornecedores (usar item_supplier_links)
      if (links.suppliers.length > 0) {
        const supplierLinkData = links.suppliers
          .filter(supplierId => supplierId && supplierId.trim() !== '') // Filter out empty values
          .map(supplierId => ({
            tenantId,
            itemId,
            supplierId,
            createdBy,
            createdAt: new Date()
          }));
        if (supplierLinkData.length > 0) {
          promises.push(this.db.insert(itemSupplierLinks).values(supplierLinkData));
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      return; // Retorna void como esperado
    } catch (error) {
      console.error('Error updating item links:', error);
      // Não lançar erro para não quebrar o fluxo principal de atualização
      // Retornar false ou lançar um erro específico se necessário para o fluxo chamador
    }
  }

  /**
   * Link a customer to an item
   */
  async linkCustomerToItem(itemId: string, customerId: string, userId: string): Promise<any> {
    try {
      console.log(`🔗 [LINK-CUSTOMER] Iniciando vinculação: item=${itemId}, customer=${customerId}, tenant=${this.tenantId}`);

      const schemaName = `tenant_${this.tenantId.replace(/-/g, '_')}`;
      console.log(`🔗 [LINK-CUSTOMER] Schema: ${schemaName}`);

      // Use direct pool query instead of drizzle execute for better parameter handling
      const { pool } = await import('../../../../db');

      // Verify item exists
      const itemExists = await pool.query(
        `SELECT id, name FROM "${schemaName}".items WHERE id = $1 AND tenant_id = $2`,
        [itemId, this.tenantId]
      );

      if (itemExists.rows.length === 0) {
        throw new Error('Item não encontrado');
      }

      console.log(`✅ [LINK-CUSTOMER] Item encontrado: ${itemExists.rows[0].name}`);

      // Verify customer exists
      const customerExists = await pool.query(
        `SELECT id, name FROM "${schemaName}".companies WHERE id = $1 AND tenant_id = $2`,
        [customerId, this.tenantId]
      );

      if (customerExists.rows.length === 0) {
        throw new Error('Empresa não encontrada');
      }

      console.log(`✅ [LINK-CUSTOMER] Empresa encontrada: ${customerExists.rows[0].name}`);

      // Generate unique ID for the link
      const linkId = crypto.randomUUID();
      console.log(`🔗 [LINK-CUSTOMER] Inserindo em customer_item_mappings com ID: ${linkId}`);

      // Check if link already exists
      const existingLink = await pool.query(
        `SELECT id FROM "${schemaName}".customer_item_mappings WHERE tenant_id = $1 AND item_id = $2 AND customer_id = $3`,
        [this.tenantId, itemId, customerId]
      );

      let result;
      if (existingLink.rows.length > 0) {
        // Update existing link
        result = await pool.query(
          `UPDATE "${schemaName}".customer_item_mappings SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING id`,
          [existingLink.rows[0].id]
        );
      } else {
        // Insert new link
        result = await pool.query(
          `INSERT INTO "${schemaName}".customer_item_mappings (id, tenant_id, item_id, customer_id, created_by, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW()) RETURNING id`,
          [linkId, this.tenantId, itemId, customerId, userId]
        );
      }

      if (result.rows.length > 0) {
        console.log(`✅ [LINK-CUSTOMER] Vínculo criado/atualizado com sucesso: ${result.rows[0].id}`);
        return { success: true, linkId: result.rows[0].id };
      } else {
        console.log(`⚠️ [LINK-CUSTOMER] Nenhuma linha retornada`);
        return { success: true, message: 'Vínculo processado' };
      }

    } catch (error) {
      console.error(`❌ [LINK-CUSTOMER] Erro ao vincular cliente ao item:`, error);
      throw new Error(`Erro ao vincular empresa: ${error.message}`);
    }
  }

  async unlinkCustomerFromItem(itemId: string, customerId: string, tenantId: string): Promise<void> {
    try {
      const { pool } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Tentar desvincular da tabela customer_item_mappings
      try {
        const result = await pool.query(`
          UPDATE "${schemaName}".customer_item_mappings
          SET is_active = false, updated_at = NOW()
          WHERE customer_id = $1 AND item_id = $2
        `, [customerId, itemId]);

        if (result.rowCount === 0) {
          // Fallback para item_customer_links
          await pool.query(`
            UPDATE "${schemaName}".item_customer_links
            SET is_active = false
            WHERE company_id = $1 AND item_id = $2
          `, [customerId, itemId]);
        }

        console.log(`✅ Empresa ${customerId} desvinculada do item ${itemId}`);
      } catch (error) {
        console.log('Tentando estrutura alternativa...');
        await pool.query(`
          DELETE FROM "${schemaName}".item_customer_links
          WHERE company_id = $1 AND item_id = $2
        `, [customerId, itemId]);
      }
    } catch (error) {
      console.error('Erro ao desvincular cliente do item:', error);
      throw error;
    }
  }

  async linkSupplierToItem(itemId: string, supplierId: string, tenantId: string): Promise<void> {
    try {
      // Validar parâmetros obrigatórios
      if (!itemId || !supplierId || !tenantId) {
        throw new Error('itemId, supplierId e tenantId são obrigatórios');
      }

      const { pool } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Primeiro, verificar se as colunas existem na tabela
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = '${schemaName}' 
        AND table_name = 'item_supplier_links'
      `);

      const columns = columnCheck.rows.map(row => row.column_name);
      const hasLeadTime = columns.includes('lead_time');
      const hasMinimumOrder = columns.includes('minimum_order');

      // Verificar se já existe vínculo
      const existingCheck = await pool.query(`
        SELECT id FROM "${schemaName}".item_supplier_links 
        WHERE item_id = $1 AND supplier_id = $2 AND tenant_id = $3
      `, [itemId, supplierId, tenantId]);

      if (existingCheck.rows.length > 0) {
        // Atualizar existente
        await pool.query(`
          UPDATE "${schemaName}".item_supplier_links 
          SET is_active = true, updated_at = NOW()
          WHERE item_id = $1 AND supplier_id = $2 AND tenant_id = $3
        `, [itemId, supplierId, tenantId]);
      } else {
        // Inserir novo sem ON CONFLICT
        const insertQuery = `
          INSERT INTO "${schemaName}".item_supplier_links 
          (id, tenant_id, item_id, supplier_id, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        `;
        const params = [crypto.randomUUID(), tenantId, itemId, supplierId];
        await pool.query(insertQuery, params);
      }

      console.log(`✅ Fornecedor ${supplierId} vinculado ao item ${itemId}`);
    } catch (error) {
      console.error('Erro ao vincular fornecedor ao item:', error);
      throw error;
    }
  }

  async unlinkSupplierFromItem(itemId: string, supplierId: string, tenantId: string): Promise<void> {
    try {
      const { pool } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      await pool.query(`
        UPDATE "${schemaName}".item_supplier_links
        SET is_active = false
        WHERE supplier_id = $1 AND item_id = $2
      `, [supplierId, itemId]);

      console.log(`✅ Fornecedor ${supplierId} desvinculado do item ${itemId}`);
    } catch (error) {
      console.error('Erro ao desvincular fornecedor do item:', error);
      throw error;
    }
  }
}