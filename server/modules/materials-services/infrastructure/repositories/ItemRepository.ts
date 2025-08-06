import { eq, and, like, desc, or, sql, inArray } from 'drizzle-orm';
import { items, itemAttachments, itemLinks, itemCustomerLinks, itemSupplierLinks, customerItemMappings } from '../../../../../shared/schema-master';
import type { Item } from '../../domain/entities';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class ItemRepository {
  private db: NodePgDatabase<any>;

  constructor(db: NodePgDatabase<any>) {
    this.db = db;
  }

  async create(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const [item] = await this.db
      .insert(items)
      .values({
        ...data,
        // Remove title reference - column doesn't exist in actual schema
        maintenancePlan: data.maintenancePlan || null,
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
          eq(itemCustomerLinks.customerCompanyId, options.companyId),
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

    // Handle JSON fields properly - filter out empty strings that cause JSON parsing errors
    const updateData = {
      ...validData,
      updatedAt: new Date()
    };

    // Only add JSON fields if they have valid content
    if (maintenancePlan !== undefined && maintenancePlan !== '') {
      updateData.maintenancePlan = typeof maintenancePlan === 'string' ? maintenancePlan : JSON.stringify(maintenancePlan);
    }
    if (defaultChecklist !== undefined && defaultChecklist !== '') {
      updateData.defaultChecklist = typeof defaultChecklist === 'string' ? defaultChecklist : JSON.stringify(defaultChecklist);
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

  async getItemLinks(itemId: string, tenantId: string) {
    try {
      // Buscar vínculos de clientes
      const customerLinksResult = await this.db
        .select({ customerId: customerItemMappings.customerId })
        .from(customerItemMappings)
        .where(
          and(
            eq(customerItemMappings.tenantId, tenantId),
            eq(customerItemMappings.itemId, itemId),
            eq(customerItemMappings.isActive, true)
          )
        );

      // Buscar vínculos de fornecedores
      const supplierLinksResult = await this.db
        .select({ supplierId: itemSupplierLinks.supplierId })
        .from(itemSupplierLinks)
        .where(
          and(
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.itemId, itemId)
          )
        );

      return {
        customers: customerLinksResult.map(link => link.customerId),
        suppliers: supplierLinksResult.map(link => link.supplierId)
      };

    } catch (error) {
      console.error('Error getting item links:', error);
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

      // Vínculos de clientes (usar customer_item_mappings)
      if (links.customers.length > 0) {
        const customerLinkData = links.customers
          .filter(customerId => customerId && customerId.trim() !== '') // Filter out empty values
          .map(customerId => ({
            tenantId,
            itemId,
            customerId,
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
}