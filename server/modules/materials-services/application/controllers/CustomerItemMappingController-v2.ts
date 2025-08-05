// CustomerItemMappingController-v2.ts - Simplified controller with correct company mappings
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { pool } from '../../../../db';

/**
 * Buscar mapeamentos personalizados de itens por empresa cliente
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

    const query = `
      SELECT 
        m.*,
        i.name as item_name,
        i.integration_code as item_integration_code,
        i.type as item_type,
        i.description as item_description,
        cc.name as customer_company_name
      FROM customer_item_mappings m
      LEFT JOIN items i ON m.item_id = i.id
      LEFT JOIN customer_companies cc ON m.customer_id = cc.id
      WHERE m.tenant_id = $1
      ORDER BY m.created_at DESC
    `;

    const result = await pool.query(query, [tenantId]);

    return res.json({
      success: true,
      data: result.rows,
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
        cc.name as customer_company_name
      FROM customer_item_mappings m
      LEFT JOIN items i ON m.item_id = i.id
      LEFT JOIN customer_companies cc ON m.customer_id = cc.id
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
 * Buscar itens personalizados para uma empresa específica
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
      LEFT JOIN items i ON m.item_id = i.id
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