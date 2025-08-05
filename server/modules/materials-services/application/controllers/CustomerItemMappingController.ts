// CustomerItemMappingController.ts - Controlador para gerenciar mapeamentos personalizados de itens por cliente
import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../../../db';

/**
 * Buscar mapeamentos personalizados de itens por cliente
 * GET /api/materials-services/customer-item-mappings
 */
export const getCustomerItemMappings = async (req: Request, res: Response) => {
  try {
    const { tenantId, customerId, itemId, isActive, search, page = '1', limit = '50' } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId é obrigatório'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build the WHERE conditions
    let whereConditions = [`m.tenant_id = $1`];
    let paramIndex = 2;
    const params: any[] = [tenantId];

    if (customerId) {
      whereConditions.push(`m.customer_id = $${paramIndex}`);
      params.push(customerId);
      paramIndex++;
    }

    if (itemId) {
      whereConditions.push(`m.item_id = $${paramIndex}`);
      params.push(itemId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereConditions.push(`m.is_active = $${paramIndex}`);
      params.push(isActive === 'true');
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        m.custom_sku ILIKE $${paramIndex} OR 
        m.custom_name ILIKE $${paramIndex} OR 
        m.customer_reference ILIKE $${paramIndex} OR
        i.name ILIKE $${paramIndex} OR
        i.integration_code ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        m.*,
        i.name as item_name,
        i.integration_code as item_integration_code,
        i.type as item_type,
        i.description as item_description,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email
      FROM customer_item_mappings m
      LEFT JOIN items i ON m.item_id = i.id AND i.tenant_id = m.tenant_id
      LEFT JOIN customers c ON m.customer_id = c.id AND c.tenant_id = m.tenant_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    console.log(`🔍 [CustomerItemMappings] Found ${result.rowCount} mappings for tenant ${tenantId}`);

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.rowCount || 0
      },
      message: `Found ${result.rowCount || 0} customer item mappings`
    });

  } catch (error) {
    console.error('Error fetching customer item mappings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer item mappings',
      error: (error as Error).message
    });
  }
};

/**
 * Buscar um mapeamento específico por ID
 * GET /api/materials-services/customer-item-mappings/:id
 */
export const getCustomerItemMappingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId é obrigatório'
      });
    }

    const result = await db
      .select({
        mapping: customerItemMappings,
        item: {
          id: items.id,
          name: items.name,
          integrationCode: items.integrationCode,
          type: items.type,
          description: items.description,
          measurementUnit: items.measurementUnit,
          status: items.status,
        },
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
        }
      })
      .from(customerItemMappings)
      .leftJoin(items, eq(customerItemMappings.itemId, items.id))
      .leftJoin(customers, eq(customerItemMappings.customerId, customers.id))
      .where(and(
        eq(customerItemMappings.id, id),
        eq(customerItemMappings.tenantId, tenantId as string)
      ));

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

    return res.json({
      success: true,
      data: result[0],
      message: 'Customer item mapping retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching customer item mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer item mapping',
      error: (error as Error).message
    });
  }
};

/**
 * Criar novo mapeamento personalizado
 * POST /api/materials-services/customer-item-mappings
 */
export const createCustomerItemMapping = async (req: Request, res: Response) => {
  try {
    const validatedData = insertCustomerItemMappingSchema.parse(req.body);

    const result = await db
      .insert(customerItemMappings)
      .values(validatedData)
      .returning();

    console.log(`✅ [CustomerItemMappings] Created mapping for customer ${validatedData.customerId} and item ${validatedData.itemId}`);

    return res.status(201).json({
      success: true,
      data: result[0],
      message: 'Customer item mapping created successfully'
    });

  } catch (error) {
    console.error('Error creating customer item mapping:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create customer item mapping',
      error: (error as Error).message
    });
  }
};

/**
 * Atualizar mapeamento personalizado
 * PUT /api/materials-services/customer-item-mappings/:id
 */
export const updateCustomerItemMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId, ...updateData } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId é obrigatório'
      });
    }

    // Validate the update data (excluding tenantId which is handled separately)
    const updateSchema = insertCustomerItemMappingSchema.partial().omit({ tenantId: true });
    const validatedData = updateSchema.parse(updateData);

    const result = await db
      .update(customerItemMappings)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(and(
        eq(customerItemMappings.id, id),
        eq(customerItemMappings.tenantId, tenantId)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

    console.log(`✅ [CustomerItemMappings] Updated mapping ${id}`);

    return res.json({
      success: true,
      data: result[0],
      message: 'Customer item mapping updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer item mapping:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update customer item mapping',
      error: (error as Error).message
    });
  }
};

/**
 * Deletar mapeamento personalizado
 * DELETE /api/materials-services/customer-item-mappings/:id
 */
export const deleteCustomerItemMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId é obrigatório'
      });
    }

    const result = await db
      .delete(customerItemMappings)
      .where(and(
        eq(customerItemMappings.id, id),
        eq(customerItemMappings.tenantId, tenantId as string)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

    console.log(`🗑️ [CustomerItemMappings] Deleted mapping ${id}`);

    return res.json({
      success: true,
      message: 'Customer item mapping deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting customer item mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete customer item mapping',
      error: (error as Error).message
    });
  }
};

/**
 * Buscar itens personalizados para um cliente específico
 * GET /api/materials-services/customer-item-mappings/customer/:customerId/items
 */
export const getCustomerItems = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { tenantId, search, type, category, page = '1', limit = '50' } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId é obrigatório'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [
      eq(items.tenantId, tenantId as string),
      eq(items.active, true)
    ];

    if (type) {
      conditions.push(eq(items.type, type as string));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(items.name, searchTerm),
          ilike(items.integrationCode, searchTerm),
        )
      );
    }

    // Get items with their custom mappings for this customer
    const result = await db
      .select({
        id: items.id,
        name: items.name,
        description: items.description,
        type: items.type,
        integrationCode: items.integrationCode,
        measurementUnit: items.measurementUnit,
        status: items.status,
        // Custom mapping fields (null if no mapping exists)
        customSku: customerItemMappings.customSku,
        customName: customerItemMappings.customName,
        customDescription: customerItemMappings.customDescription,
        customerReference: customerItemMappings.customerReference,
        negotiatedPrice: customerItemMappings.negotiatedPrice,
        minimumQuantity: customerItemMappings.minimumQuantity,
        discountPercent: customerItemMappings.discountPercent,
        specialInstructions: customerItemMappings.specialInstructions,
        notes: customerItemMappings.notes,
        mappingId: customerItemMappings.id,
        isCustomized: sql<boolean>`CASE WHEN ${customerItemMappings.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(items)
      .leftJoin(
        customerItemMappings,
        and(
          eq(customerItemMappings.itemId, items.id),
          eq(customerItemMappings.customerId, customerId),
          eq(customerItemMappings.tenantId, tenantId as string),
          eq(customerItemMappings.isActive, true)
        )
      )
      .where(and(...conditions))
      .orderBy(items.name)
      .limit(limitNum)
      .offset(offset);

    console.log(`🔍 [CustomerItems] Found ${result.length} items for customer ${customerId}`);

    return res.json({
      success: true,
      data: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.length
      },
      message: `Found ${result.length} items for customer`
    });

  } catch (error) {
    console.error('Error fetching customer items:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer items',
      error: (error as Error).message
    });
  }
};

/**
 * Ativar/Desativar mapeamento personalizado
 * PATCH /api/materials-services/customer-item-mappings/:id/toggle
 */
export const toggleCustomerItemMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId é obrigatório'
      });
    }

    // First get the current status
    const current = await db
      .select({ isActive: customerItemMappings.isActive })
      .from(customerItemMappings)
      .where(and(
        eq(customerItemMappings.id, id),
        eq(customerItemMappings.tenantId, tenantId)
      ));

    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

    const newStatus = !current[0].isActive;

    const result = await db
      .update(customerItemMappings)
      .set({
        isActive: newStatus,
        updatedAt: new Date()
      })
      .where(and(
        eq(customerItemMappings.id, id),
        eq(customerItemMappings.tenantId, tenantId)
      ))
      .returning();

    console.log(`🔄 [CustomerItemMappings] Toggled mapping ${id} to ${newStatus ? 'active' : 'inactive'}`);

    return res.json({
      success: true,
      data: result[0],
      message: `Customer item mapping ${newStatus ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error toggling customer item mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle customer item mapping',
      error: (error as Error).message
    });
  }
};