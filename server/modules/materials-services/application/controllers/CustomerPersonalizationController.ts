import { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../../../middleware/jwtAuth.js';
import { pool } from '../../../../db.js';
import { 
  customerItemMappings, 
  items, 
  customers,
  insertCustomerItemMappingSchema,
  type CustomerItemMapping,
  type InsertCustomerItemMapping 
} from '../../../../../shared/schema-master.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

export class CustomerPersonalizationController {
  /**
   * Get all customer item mappings for a specific customer
   */
  async getCustomerMappings(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant não identificado' });
      }

      const db = drizzle(pool, { schema: { customerItemMappings, items, customers } });

      // Get mappings with item details
      const mappings = await db
        .select({
          id: customerItemMappings.id,
          customerId: customerItemMappings.customerId,
          itemId: customerItemMappings.itemId,
          customSku: customerItemMappings.customSku,
          customName: customerItemMappings.customName,
          customDescription: customerItemMappings.customDescription,
          customerReference: customerItemMappings.customerReference,
          leadTimeDays: customerItemMappings.leadTimeDays,
          preferredSupplier: customerItemMappings.preferredSupplier,
          specialInstructions: customerItemMappings.specialInstructions,
          customFields: customerItemMappings.customFields,
          contractReference: customerItemMappings.contractReference,
          requiresApproval: customerItemMappings.requiresApproval,
          approvalLimit: customerItemMappings.approvalLimit,
          isActive: customerItemMappings.isActive,
          notes: customerItemMappings.notes,
          createdAt: customerItemMappings.createdAt,
          updatedAt: customerItemMappings.updatedAt,
          // Item details
          itemName: items.name,
          itemType: items.type,
          itemSku: items.integrationCode,
          itemDescription: items.description,
        })
        .from(customerItemMappings)
        .leftJoin(items, eq(customerItemMappings.itemId, items.id))
        .where(
          and(
            eq(customerItemMappings.tenantId, tenantId),
            eq(customerItemMappings.customerId, customerId),
            eq(customerItemMappings.isActive, true)
          )
        )
        .orderBy(desc(customerItemMappings.createdAt));

      res.json({
        success: true,
        mappings: mappings
      });

    } catch (error) {
      console.error('Error fetching customer mappings:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Get items with resolved names for a specific customer
   */
  async getCustomerItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const { search, type } = req.query;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant não identificado' });
      }

      const db = drizzle(pool, { schema: { customerItemMappings, items, customers } });

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
          // Personalized fields (null if no mapping exists)
          customName: customerItemMappings.customName,
          customSku: customerItemMappings.customSku,
          customDescription: customerItemMappings.customDescription,
          customerReference: customerItemMappings.customerReference,
          mappingId: customerItemMappings.id,
          isPersonalized: sql<boolean>`CASE WHEN ${customerItemMappings.id} IS NOT NULL THEN true ELSE false END`,
        })
        .from(items)
        .leftJoin(
          customerItemMappings,
          and(
            eq(customerItemMappings.itemId, items.id),
            eq(customerItemMappings.customerId, customerId),
            eq(customerItemMappings.tenantId, tenantId),
            eq(customerItemMappings.isActive, true)
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
        displayName: item.customName || item.originalName,
        displaySku: item.customSku || item.originalSku,
        displayDescription: item.customDescription || item.originalDescription,
      }));

      // Apply search filter on resolved names if provided
      const filteredItems = search 
        ? resolvedItems.filter((item: any) => 
            item.displayName.toLowerCase().includes((search as string).toLowerCase()) ||
            (item.displaySku && item.displaySku.toLowerCase().includes((search as string).toLowerCase()))
          )
        : resolvedItems;

      res.json({
        success: true,
        items: filteredItems
      });

    } catch (error) {
      console.error('Error fetching customer items:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Create a new customer item mapping
   */
  async createMapping(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Validate request body
      const validatedData = insertCustomerItemMappingSchema.parse({
        ...req.body,
        tenantId,
        itemId,
        createdBy: userId,
        updatedBy: userId
      });

      const db = drizzle(pool, { schema: { customerItemMappings, items, customers } });

      // Check if mapping already exists
      const existingMapping = await db
        .select()
        .from(customerItemMappings)
        .where(
          and(
            eq(customerItemMappings.tenantId, tenantId),
            eq(customerItemMappings.customerId, validatedData.customerId),
            eq(customerItemMappings.itemId, itemId)
          )
        )
        .limit(1);

      if (existingMapping.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Personalização já existe para este cliente e item'
        });
      }

      // Check SKU uniqueness for this customer
      if (validatedData.customSku) {
        const existingSku = await db
          .select()
          .from(customerItemMappings)
          .where(
            and(
              eq(customerItemMappings.tenantId, tenantId),
              eq(customerItemMappings.customerId, validatedData.customerId),
              eq(customerItemMappings.customSku, validatedData.customSku)
            )
          )
          .limit(1);

        if (existingSku.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'SKU personalizado já existe para este cliente'
          });
        }
      }

      // Create the mapping
      const [newMapping] = await db
        .insert(customerItemMappings)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        message: 'Personalização criada com sucesso',
        mapping: newMapping
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      console.error('Error creating customer mapping:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Update an existing customer item mapping
   */
  async updateMapping(req: Request, res: Response) {
    try {
      const { mappingId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Validate request body
      const validatedData = insertCustomerItemMappingSchema
        .partial()
        .parse({
          ...req.body,
          updatedBy: userId,
          updatedAt: new Date()
        });

      const db = getTenantDb(tenantId);

      // Check if mapping exists
      const existingMapping = await db
        .select()
        .from(customerItemMappings)
        .where(
          and(
            eq(customerItemMappings.tenantId, tenantId),
            eq(customerItemMappings.id, mappingId)
          )
        )
        .limit(1);

      if (existingMapping.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Personalização não encontrada'
        });
      }

      // Check SKU uniqueness if updating customSku
      if (validatedData.customSku) {
        const existingSku = await db
          .select()
          .from(customerItemMappings)
          .where(
            and(
              eq(customerItemMappings.tenantId, tenantId),
              eq(customerItemMappings.customerId, existingMapping[0].customerId),
              eq(customerItemMappings.customSku, validatedData.customSku),
              sql`${customerItemMappings.id} != ${mappingId}`
            )
          )
          .limit(1);

        if (existingSku.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'SKU personalizado já existe para este cliente'
          });
        }
      }

      // Update the mapping
      const [updatedMapping] = await db
        .update(customerItemMappings)
        .set(validatedData)
        .where(
          and(
            eq(customerItemMappings.tenantId, tenantId),
            eq(customerItemMappings.id, mappingId)
          )
        )
        .returning();

      res.json({
        success: true,
        message: 'Personalização atualizada com sucesso',
        mapping: updatedMapping
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      console.error('Error updating customer mapping:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Delete a customer item mapping
   */
  async deleteMapping(req: Request, res: Response) {
    try {
      const { mappingId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const db = getTenantDb(tenantId);

      // Soft delete by setting isActive to false
      const [deletedMapping] = await db
        .update(customerItemMappings)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
          updatedBy: req.user?.id
        })
        .where(
          and(
            eq(customerItemMappings.tenantId, tenantId),
            eq(customerItemMappings.id, mappingId)
          )
        )
        .returning();

      if (!deletedMapping) {
        return res.status(404).json({
          success: false,
          error: 'Personalização não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Personalização removida com sucesso'
      });

    } catch (error) {
      console.error('Error deleting customer mapping:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Resolve item name hierarchically for a specific customer context
   */
  async resolveItemForCustomer(itemId: string, customerId: string, tenantId: string) {
    const db = getTenantDb(tenantId);

    const result = await db
      .select({
        id: items.id,
        originalName: items.name,
        originalSku: items.integrationCode,
        originalDescription: items.description,
        customName: customerItemMappings.customName,
        customSku: customerItemMappings.customSku,
        customDescription: customerItemMappings.customDescription,
      })
      .from(items)
      .leftJoin(
        customerItemMappings,
        and(
          eq(customerItemMappings.itemId, items.id),
          eq(customerItemMappings.customerId, customerId),
          eq(customerItemMappings.tenantId, tenantId),
          eq(customerItemMappings.isActive, true)
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
      displayName: item.customName || item.originalName,
      displaySku: item.customSku || item.originalSku,
      displayDescription: item.customDescription || item.originalDescription,
    };
  }
}