// CustomerItemMappingController.ts - Controlador para gerenciar mapeamentos personalizados de itens por cliente
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { pool } from '../../../../db';

/**
 * Buscar mapeamentos personalizados de itens por cliente
 * GET /api/materials-services/customer-item-mappings
 */
export const getCustomerItemMappings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const { customerId, itemId, isActive, search, page = '1', limit = '50' } = req.query;
    
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
        cc.name as company_name,
        cc.trade_name as company_trade_name,
        cc.email as company_email
      FROM customer_item_mappings m
      LEFT JOIN items i ON m.item_id = i.id AND i.tenant_id = m.tenant_id
      LEFT JOIN companies cc ON m.customer_id = cc.id AND cc.tenant_id = m.tenant_id
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
 * Criar novo mapeamento personalizado
 * POST /api/materials-services/customer-item-mappings
 */  
export const createCustomerItemMapping = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const {
      customer_id,
      item_id,
      custom_sku,
      custom_name,
      custom_description,
      customer_reference,
      special_instructions,
      notes
    } = req.body;

    const query = `
      INSERT INTO customer_item_mappings (
        tenant_id, customer_id, item_id, custom_sku, custom_name, 
        custom_description, customer_reference, special_instructions, 
        notes, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW()
      ) RETURNING *
    `;

    const params = [
      tenantId, customer_id, item_id, custom_sku, custom_name,
      custom_description, customer_reference, special_instructions, notes
    ];

    const result = await pool.query(query, params);

    console.log(`✅ [CustomerItemMappings] Created mapping for customer ${customer_id} and item ${item_id}`);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Customer item mapping created successfully'
    });

  } catch (error) {
    console.error('Error creating customer item mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create customer item mapping',
      error: (error as Error).message
    });
  }
};

/**
 * Buscar um mapeamento específico por ID
 * GET /api/materials-services/customer-item-mappings/:id
 */
export const getCustomerItemMappingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const query = `
      SELECT 
        m.*,
        i.name as item_name,
        i.integration_code as item_integration_code,
        i.type as item_type,
        i.description as item_description,
        cc.name as company_name,
        cc.trade_name as company_trade_name,
        cc.email as company_email
      FROM customer_item_mappings m
      LEFT JOIN items i ON m.item_id = i.id AND i.tenant_id = m.tenant_id
      LEFT JOIN companies cc ON m.customer_id = cc.id AND cc.tenant_id = m.tenant_id
      WHERE m.id = $1 AND m.tenant_id = $2
    `;

    
    const result = await pool.query(query, [id, tenantId]);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
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
 * Atualizar mapeamento personalizado
 * PUT /api/materials-services/customer-item-mappings/:id
 */
export const updateCustomerItemMapping = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const {
      custom_sku,
      custom_name,
      custom_description,
      customer_reference,
      special_instructions,
      notes,
      is_active
    } = req.body;

    const query = `
      UPDATE customer_item_mappings 
      SET custom_sku = $1, custom_name = $2, custom_description = $3, 
          customer_reference = $4, special_instructions = $5, notes = $6, 
          is_active = $7, updated_at = NOW()
      WHERE id = $8 AND tenant_id = $9
      RETURNING *
    `;

    const params = [
      custom_sku, custom_name, custom_description, customer_reference,
      special_instructions, notes, is_active, id, tenantId
    ];

    
    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Customer item mapping updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer item mapping:', error);
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
export const deleteCustomerItemMapping = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const query = `
      DELETE FROM customer_item_mappings 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;

    
    const result = await pool.query(query, [id, tenantId]);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

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
 * Alternar status ativo/inativo
 * PATCH /api/materials-services/customer-item-mappings/:id/toggle
 */
export const toggleCustomerItemMapping = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const query = `
      UPDATE customer_item_mappings 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    
    const result = await pool.query(query, [id, tenantId]);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Customer item mapping not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Customer item mapping status updated successfully'
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

/**
 * Buscar itens personalizados para um cliente específico
 * GET /api/materials-services/customer-item-mappings/customer/:customerId/items
 */
export const getCustomerItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { customerId } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const query = `
      SELECT 
        m.*,
        i.name as item_name,
        i.integration_code as item_integration_code,
        i.type as item_type,
        i.description as item_description,
        i.measurement_unit as item_measurement_unit
      FROM customer_item_mappings m
      LEFT JOIN items i ON m.item_id = i.id AND i.tenant_id = m.tenant_id
      WHERE m.customer_id = $1 AND m.tenant_id = $2 AND m.is_active = true
      ORDER BY m.custom_name
    `;

    
    const result = await pool.query(query, [customerId, tenantId]);

    return res.json({
      success: true,
      data: result.rows,
      message: `Found ${result.rows.length} items for customer`
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