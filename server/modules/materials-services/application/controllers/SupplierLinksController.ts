import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantDb } from '../../../../storage/tenant-db.js';
import { 
  itemSupplierLinks, 
  items, 
  suppliers,
  insertItemSupplierLinkSchema,
  type ItemSupplierLink,
  type InsertItemSupplierLink 
} from '../../../../../shared/schema-master.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export class SupplierLinksController {
  /**
   * Get all supplier links for a specific supplier
   */
  async getSupplierLinks(req: Request, res: Response) {
    try {
      const { supplierId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant não identificado' });
      }

      const db = getTenantDb(tenantId);

      // Get links with item details
      const links = await db
        .select({
          id: itemSupplierLinks.id,
          supplierId: itemSupplierLinks.supplierId,
          itemId: itemSupplierLinks.itemId,
          partNumber: itemSupplierLinks.partNumber,
          supplierItemCode: itemSupplierLinks.supplierItemCode,
          supplierItemName: itemSupplierLinks.supplierItemName,
          description: itemSupplierLinks.description,
          unitPrice: itemSupplierLinks.unitPrice,
          currency: itemSupplierLinks.currency,
          leadTimeDays: itemSupplierLinks.leadTimeDays,
          minimumOrderQuantity: itemSupplierLinks.minimumOrderQuantity,
          qrCode: itemSupplierLinks.qrCode,
          barcode: itemSupplierLinks.barcode,
          isPreferred: itemSupplierLinks.isPreferred,
          isActive: itemSupplierLinks.isActive,
          notes: itemSupplierLinks.notes,
          lastPriceUpdate: itemSupplierLinks.lastPriceUpdate,
          createdAt: itemSupplierLinks.createdAt,
          updatedAt: itemSupplierLinks.updatedAt,
          // Item details
          itemName: items.name,
          itemType: items.type,
          itemSku: items.integrationCode,
          itemDescription: items.description,
        })
        .from(itemSupplierLinks)
        .leftJoin(items, eq(itemSupplierLinks.itemId, items.id))
        .where(
          and(
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.supplierId, supplierId),
            eq(itemSupplierLinks.isActive, true)
          )
        )
        .orderBy(desc(itemSupplierLinks.createdAt));

      res.json({
        success: true,
        links: links
      });

    } catch (error) {
      console.error('Error fetching supplier links:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Get items with resolved names for a specific supplier
   */
  async getSupplierItems(req: Request, res: Response) {
    try {
      const { supplierId } = req.params;
      const { search, type } = req.query;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant não identificado' });
      }

      const db = getTenantDb(tenantId);

      // Build base query
      const baseQuery = db
        .select({
          id: items.id,
          originalName: items.name,
          originalSku: items.integrationCode,
          originalDescription: items.description,
          type: items.type,
          measurementUnit: items.measurementUnit,
          active: items.active,
          // Supplier-specific fields (null if no link exists)
          partNumber: itemSupplierLinks.partNumber,
          supplierItemName: itemSupplierLinks.supplierItemName,
          supplierDescription: itemSupplierLinks.description,
          unitPrice: itemSupplierLinks.unitPrice,
          currency: itemSupplierLinks.currency,
          leadTimeDays: itemSupplierLinks.leadTimeDays,
          minimumOrderQuantity: itemSupplierLinks.minimumOrderQuantity,
          isPreferred: itemSupplierLinks.isPreferred,
          linkId: itemSupplierLinks.id,
          isLinked: sql<boolean>`CASE WHEN ${itemSupplierLinks.id} IS NOT NULL THEN true ELSE false END`,
        })
        .from(items)
        .leftJoin(
          itemSupplierLinks,
          and(
            eq(itemSupplierLinks.itemId, items.id),
            eq(itemSupplierLinks.supplierId, supplierId),
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.isActive, true)
          )
        )
        .where(
          and(
            eq(items.tenantId, tenantId),
            eq(items.active, true),
            type ? eq(items.type, type as string) : undefined
          )
        );

      const result = await baseQuery.orderBy(items.name);

      // Apply hierarchical name resolution
      const resolvedItems = result.map(item => ({
        ...item,
        displayName: item.supplierItemName || item.originalName,
        displayDescription: item.supplierDescription || item.originalDescription,
        displayPrice: item.unitPrice ? `${item.currency || 'BRL'} ${Number(item.unitPrice).toFixed(2)}` : null,
      }));

      // Apply search filter on resolved names if provided
      const filteredItems = search 
        ? resolvedItems.filter(item => 
            item.displayName.toLowerCase().includes((search as string).toLowerCase()) ||
            (item.partNumber && item.partNumber.toLowerCase().includes((search as string).toLowerCase())) ||
            (item.originalSku && item.originalSku.toLowerCase().includes((search as string).toLowerCase()))
          )
        : resolvedItems;

      res.json({
        success: true,
        items: filteredItems
      });

    } catch (error) {
      console.error('Error fetching supplier items:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Create a new supplier link
   */
  async createLink(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Validate request body
      const validatedData = insertItemSupplierLinkSchema.parse({
        ...req.body,
        tenantId,
        itemId,
        createdBy: userId,
        updatedBy: userId,
        lastPriceUpdate: req.body.unitPrice ? new Date() : undefined
      });

      const db = getTenantDb(tenantId);

      // Check if link already exists
      const existingLink = await db
        .select()
        .from(itemSupplierLinks)
        .where(
          and(
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.supplierId, validatedData.supplierId),
            eq(itemSupplierLinks.itemId, itemId)
          )
        )
        .limit(1);

      if (existingLink.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Vínculo já existe para este fornecedor e item'
        });
      }

      // Check part number uniqueness for this supplier
      if (validatedData.partNumber) {
        const existingPartNumber = await db
          .select()
          .from(itemSupplierLinks)
          .where(
            and(
              eq(itemSupplierLinks.tenantId, tenantId),
              eq(itemSupplierLinks.supplierId, validatedData.supplierId),
              eq(itemSupplierLinks.partNumber, validatedData.partNumber)
            )
          )
          .limit(1);

        if (existingPartNumber.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'Part Number já existe para este fornecedor'
          });
        }
      }

      // Create the link
      const [newLink] = await db
        .insert(itemSupplierLinks)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        message: 'Vínculo criado com sucesso',
        link: newLink
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      console.error('Error creating supplier link:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Update an existing supplier link
   */
  async updateLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Validate request body
      const validatedData = insertItemSupplierLinkSchema
        .partial()
        .parse({
          ...req.body,
          updatedBy: userId,
          updatedAt: new Date(),
          lastPriceUpdate: req.body.unitPrice ? new Date() : undefined
        });

      const db = getTenantDb(tenantId);

      // Check if link exists
      const existingLink = await db
        .select()
        .from(itemSupplierLinks)
        .where(
          and(
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.id, linkId)
          )
        )
        .limit(1);

      if (existingLink.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vínculo não encontrado'
        });
      }

      // Check part number uniqueness if updating partNumber
      if (validatedData.partNumber) {
        const existingPartNumber = await db
          .select()
          .from(itemSupplierLinks)
          .where(
            and(
              eq(itemSupplierLinks.tenantId, tenantId),
              eq(itemSupplierLinks.supplierId, existingLink[0].supplierId),
              eq(itemSupplierLinks.partNumber, validatedData.partNumber),
              sql`${itemSupplierLinks.id} != ${linkId}`
            )
          )
          .limit(1);

        if (existingPartNumber.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'Part Number já existe para este fornecedor'
          });
        }
      }

      // Update the link
      const [updatedLink] = await db
        .update(itemSupplierLinks)
        .set(validatedData)
        .where(
          and(
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.id, linkId)
          )
        )
        .returning();

      res.json({
        success: true,
        message: 'Vínculo atualizado com sucesso',
        link: updatedLink
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      console.error('Error updating supplier link:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Delete a supplier link
   */
  async deleteLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const db = getTenantDb(tenantId);

      // Soft delete by setting isActive to false
      const [deletedLink] = await db
        .update(itemSupplierLinks)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
          updatedBy: req.user?.id
        })
        .where(
          and(
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.id, linkId)
          )
        )
        .returning();

      if (!deletedLink) {
        return res.status(404).json({
          success: false,
          error: 'Vínculo não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Vínculo removido com sucesso'
      });

    } catch (error) {
      console.error('Error deleting supplier link:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Get price comparison for an item across all suppliers
   */
  async getPriceComparison(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant não identificado' });
      }

      const db = getTenantDb(tenantId);

      const priceComparison = await db
        .select({
          linkId: itemSupplierLinks.id,
          supplierId: itemSupplierLinks.supplierId,
          supplierName: suppliers.name,
          partNumber: itemSupplierLinks.partNumber,
          supplierItemName: itemSupplierLinks.supplierItemName,
          unitPrice: itemSupplierLinks.unitPrice,
          currency: itemSupplierLinks.currency,
          leadTimeDays: itemSupplierLinks.leadTimeDays,
          minimumOrderQuantity: itemSupplierLinks.minimumOrderQuantity,
          isPreferred: itemSupplierLinks.isPreferred,
          lastPriceUpdate: itemSupplierLinks.lastPriceUpdate,
        })
        .from(itemSupplierLinks)
        .leftJoin(suppliers, eq(itemSupplierLinks.supplierId, suppliers.id))
        .where(
          and(
            eq(itemSupplierLinks.tenantId, tenantId),
            eq(itemSupplierLinks.itemId, itemId),
            eq(itemSupplierLinks.isActive, true)
          )
        )
        .orderBy(itemSupplierLinks.unitPrice);

      // Calculate price statistics
      const prices = priceComparison
        .filter(link => link.unitPrice !== null)
        .map(link => Number(link.unitPrice));

      const stats = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((sum, price) => sum + price, 0) / prices.length,
        count: prices.length
      } : null;

      res.json({
        success: true,
        comparison: priceComparison,
        priceStats: stats
      });

    } catch (error) {
      console.error('Error fetching price comparison:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Resolve item name hierarchically for a specific supplier context
   */
  async resolveItemForSupplier(itemId: string, supplierId: string, tenantId: string) {
    const db = getTenantDb(tenantId);

    const result = await db
      .select({
        id: items.id,
        originalName: items.name,
        originalSku: items.integrationCode,
        originalDescription: items.description,
        partNumber: itemSupplierLinks.partNumber,
        supplierItemName: itemSupplierLinks.supplierItemName,
        supplierDescription: itemSupplierLinks.description,
        unitPrice: itemSupplierLinks.unitPrice,
        currency: itemSupplierLinks.currency,
      })
      .from(items)
      .leftJoin(
        itemSupplierLinks,
        and(
          eq(itemSupplierLinks.itemId, items.id),
          eq(itemSupplierLinks.supplierId, supplierId),
          eq(itemSupplierLinks.tenantId, tenantId),
          eq(itemSupplierLinks.isActive, true)
        )
      )
      .where(
        and(
          eq(items.tenantId, tenantId),
          eq(items.id, itemId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    return {
      ...item,
      displayName: item.supplierItemName || item.originalName,
      displayDescription: item.supplierDescription || item.originalDescription,
      displayPrice: item.unitPrice ? `${item.currency || 'BRL'} ${Number(item.unitPrice).toFixed(2)}` : null,
    };
  }
}