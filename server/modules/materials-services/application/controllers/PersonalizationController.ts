// PersonalizationController.ts - Complete controller for item personalization
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../../../middleware/jwtAuth.js';
import { pool } from '../../../../db.js';

/**
 * Get customer item mappings
 * GET /api/materials-services/customers/:customerId/personalizations
 */
export const getCustomerPersonalizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT 
        m.id,
        m.customer_id,
        m.item_id,
        m.alias as custom_name,
        m.is_active,
        m.created_at,
        m.updated_at,
        i.name as item_name,
        i.type as item_type,
        i.integration_code as item_sku,
        i.description as item_description
      FROM ${tenantSchema}.customer_item_mappings m
      LEFT JOIN ${tenantSchema}.items i ON m.item_id = i.id
      WHERE m.tenant_id = $1 AND m.customer_id = $2 AND m.is_active = true
      ORDER BY m.created_at DESC
    `;

    const result = await pool.query(query, [tenantId, customerId]);

    res.json({
      success: true,
      personalizations: result.rows
    });

  } catch (error) {
    console.error('Error fetching customer personalizations:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Get all personalizations for a specific item
 * GET /api/materials-services/items/:itemId/customer-personalizations
 */
export const getItemPersonalizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      SELECT 
        m.id,
        m.customer_id,
        m.item_id,
        m.alias as custom_name,
        m.is_active,
        m.created_at,
        m.updated_at,
        c.company as customer_name,
        c.first_name,
        c.last_name
      FROM ${tenantSchema}.customer_item_mappings m
      LEFT JOIN ${tenantSchema}.customers c ON m.customer_id = c.id
      WHERE m.tenant_id = $1 AND m.item_id = $2
      ORDER BY m.created_at DESC
    `;

    const result = await pool.query(query, [tenantId, itemId]);

    res.json({
      success: true,
      personalizations: result.rows
    });

  } catch (error) {
    console.error('Error fetching item personalizations:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Update customer item personalization  
 * PUT /api/materials-services/customer-mappings/:mappingId
 */
export const updateCustomerPersonalization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mappingId } = req.params;
    const {
      customSku,
      customName,
      customDescription,
      customerReference,
      specialInstructions,
      isActive = true
    } = req.body;

    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    // Usar schema correto com underscore
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const updateQuery = `
      UPDATE ${tenantSchema}.customer_item_mappings 
      SET 
        alias = $1,
        is_active = $2,
        updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      customName || '',
      isActive,
      mappingId,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Personalização não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      personalization: result.rows[0],
      message: 'Personalização atualizada com sucesso'
    });

  } catch (error) {
    console.error('Error updating customer personalization:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Delete customer item personalization
 * DELETE /api/materials-services/customer-mappings/:mappingId
 */
export const deleteCustomerPersonalization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mappingId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    // Usar schema correto com underscore
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const deleteQuery = `
      DELETE FROM ${tenantSchema}.customer_item_mappings 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;

    const result = await pool.query(deleteQuery, [mappingId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Personalização não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Personalização removida com sucesso'
    });

  } catch (error) {
    console.error('Error deleting customer personalization:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Create customer item personalization
 * POST /api/materials-services/items/:itemId/customer-personalizations
 */
export const createCustomerPersonalization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const {
      companyId,
      customSku,
      customName,
      customDescription,
      customerReference,
      specialInstructions
    } = req.body;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID é obrigatório'
      });
    }

    // Usar schema correto com underscore
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Check if personalization already exists
    const existingQuery = `
      SELECT id FROM ${tenantSchema}.customer_item_mappings 
      WHERE tenant_id = $1 AND customer_id = $2 AND item_id = $3
    `;

    const result = await pool.query(existingQuery, [tenantId, companyId, itemId]);

    if (result.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Personalização já existe para esta empresa e item'
      });
    }

    // Create personalization
    const insertQuery = `
      INSERT INTO ${tenantSchema}.customer_item_mappings (
        tenant_id, customer_id, item_id, alias, is_active,
        created_by, updated_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const personalizationResult = await pool.query(insertQuery, [
      tenantId, companyId, itemId, customName || '', true, userId, userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Personalização criada com sucesso',
      personalization: personalizationResult.rows[0]
    });

  } catch (error) {
    console.error('Error creating customer personalization:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Get supplier item links
 * GET /api/materials-services/suppliers/:supplierId/links
 */
export const getSupplierLinks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplierId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const query = `
      SELECT 
        l.id,
        l.supplier_id,
        l.item_id,
        l.part_number,
        l.supplier_item_name,
        l.description as supplier_description,
        l.unit_price,
        l.currency,
        l.lead_time_days,
        l.minimum_order_quantity,
        l.is_preferred,
        l.is_active,
        l.created_at,
        l.updated_at,
        i.name as item_name,
        i.type as item_type,
        i.integration_code as item_sku,
        i.description as item_description
      FROM ${tenantId}.item_supplier_links l
      LEFT JOIN ${tenantId}.items i ON l.item_id = i.id
      WHERE l.tenant_id = $1 AND l.supplier_id = $2 AND l.is_active = true
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query, [tenantId, supplierId]);

    res.json({
      success: true,
      links: result.rows
    });

  } catch (error) {
    console.error('Error fetching supplier links:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Create supplier item link
 * POST /api/materials-services/items/:itemId/supplier-links
 */
export const createSupplierLink = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const {
      supplierId,
      partNumber,
      supplierItemName,
      description,
      unitPrice,
      currency = 'BRL',
      leadTimeDays,
      minimumOrderQuantity,
      isPreferred = false
    } = req.body;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if link already exists
    const existingQuery = `
      SELECT id FROM ${tenantId}.item_supplier_links 
      WHERE tenant_id = $1 AND supplier_id = $2 AND item_id = $3
    `;

    const existing = await pool.query(existingQuery, [tenantId, supplierId, itemId]);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Vínculo já existe para este fornecedor e item'
      });
    }

    // Create link
    const insertQuery = `
      INSERT INTO ${tenantId}.item_supplier_links (
        tenant_id, supplier_id, item_id, part_number, supplier_item_name,
        description, unit_price, currency, lead_time_days, minimum_order_quantity,
        is_preferred, created_by, updated_by, created_at, updated_at, last_price_update
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      tenantId, supplierId, itemId, partNumber, supplierItemName,
      description, unitPrice, currency, leadTimeDays, minimumOrderQuantity,
      isPreferred, userId, userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Vínculo criado com sucesso',
      link: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating supplier link:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Get items with hierarchical resolution for company context
 * GET /api/materials-services/companies/:companyId/items
 */
export const getCompanyContextItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const { search, type } = req.query;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    let whereClause = `WHERE i.tenant_id = $1 AND i.active = true`;
    const params = [tenantId];
    let paramIndex = 2;

    if (type && typeof type === 'string') {
      whereClause += ` AND i.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search && typeof search === 'string') {
      whereClause += ` AND (
        i.name ILIKE $${paramIndex} OR 
        i.integration_code ILIKE $${paramIndex} OR
        m.custom_name ILIKE $${paramIndex} OR
        m.custom_sku ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by company - only show items linked to specific company
    if (companyId && companyId !== '00000000-0000-0000-0000-000000000001') {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM customer_item_mappings cim 
        WHERE cim.item_id = i.id 
        AND cim.tenant_id = i.tenant_id 
        AND cim.customer_id = $${paramIndex}
        AND cim.is_active = true
      )`;
      params.push(companyId);
      paramIndex++;
    }

    // Build company parameter reference
    const companyParamRef = companyId && companyId !== '00000000-0000-0000-0000-000000000001' 
      ? `$${params.indexOf(companyId) + 1}` 
      : 'NULL';

    const query = `
      SELECT 
        i.id,
        i.tenant_id,
        i.type,
        i.name as title,
        i.description,
        i.integration_code as sku,
        i.measurement_unit,
        i.active,
        i.created_at,
        i.updated_at,
        
        -- Customer mapping fields
        m.custom_name,
        m.custom_sku,
        m.custom_description,
        m.discount_percent,
        m.customer_reference,
        m.unit_cost as price,
        
        -- Check if item has custom mapping
        CASE WHEN m.id IS NOT NULL THEN true ELSE false END as has_custom_mapping,
        
        -- Determine final display values (custom takes precedence)
        COALESCE(m.custom_name, i.name) as display_name,
        COALESCE(m.custom_description, i.description) as display_description,
        COALESCE(m.custom_sku, i.integration_code) as display_sku
        
      FROM items i
      LEFT JOIN customer_item_mappings m ON i.id = m.item_id 
        AND m.tenant_id = i.tenant_id 
        AND m.customer_id = ${companyParamRef}
        AND m.is_active = true
      ${whereClause}
      ORDER BY 
        -- Prioritize items with custom mappings
        has_custom_mapping DESC,
        display_name ASC
      LIMIT 100
    `;

    console.log('🔍 [getCompanyContextItems] Executing query:', query);
    console.log('🔍 [getCompanyContextItems] Parameters:', params);

    const result = await db.execute(sql.raw(query, params));
    const items = result.rows;

    const stats = {
      totalItems: items.length,
      itemsWithCustomMappings: items.filter((item: any) => item.has_custom_mapping).length,
      companiesLinked: companyId && companyId !== '00000000-0000-0000-0000-000000000001' ? 1 : 0
    };

    console.log(`✅ [getCompanyContextItems] Found ${items.length} items for company ${companyId}`);
    console.log(`📊 [getCompanyContextItems] Stats:`, stats);

    res.json({
      success: true,
      data: items,
      stats
    });

  } catch (error) {
    console.error('Error fetching company context items:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Get items with hierarchical resolution for customer context
 * GET /api/materials-services/customers/:customerId/items
 */
export const getCustomerContextItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const { search, type } = req.query;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    let whereClause = `WHERE i.tenant_id = $1 AND i.active = true`;
    const params = [tenantId];
    let paramIndex = 2;

    if (type && typeof type === 'string') {
      whereClause += ` AND i.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search && typeof search === 'string') {
      whereClause += ` AND (
        i.name ILIKE $${paramIndex} OR 
        i.integration_code ILIKE $${paramIndex} OR
        m.custom_name ILIKE $${paramIndex} OR
        m.custom_sku ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++; // Increment paramIndex after using it for search
    }

    const query = `
      SELECT 
        i.id,
        i.name as original_name,
        i.integration_code as original_sku,
        i.description as original_description,
        i.type,
        i.measurement_unit,
        i.active,
        m.custom_name,
        m.custom_sku,
        m.custom_description,
        m.customer_reference,
        m.id as mapping_id,
        CASE WHEN m.id IS NOT NULL THEN true ELSE false END as is_personalized,
        COALESCE(m.custom_name, i.name) as display_name,
        COALESCE(m.custom_sku, i.integration_code) as display_sku,
        COALESCE(m.custom_description, i.description) as display_description
      FROM ${tenantId}.items i
      LEFT JOIN ${tenantId}.customer_item_mappings m ON (
        m.item_id = i.id AND 
        m.customer_id = $${paramIndex} AND 
        m.tenant_id = i.tenant_id AND 
        m.is_active = true
      )
      ${whereClause}
      ORDER BY display_name
    `;

    params.push(customerId);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      items: result.rows
    });

  } catch (error) {
    console.error('Error fetching customer context items:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Get items with hierarchical resolution for supplier context
 * GET /api/materials-services/suppliers/:supplierId/items
 */
export const getSupplierContextItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { search, type } = req.query;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    let whereClause = `WHERE i.tenant_id = $1 AND i.active = true`;
    const params = [tenantId];
    let paramIndex = 2;

    if (type && typeof type === 'string') {
      whereClause += ` AND i.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search && typeof search === 'string') {
      whereClause += ` AND (
        i.name ILIKE $${paramIndex} OR 
        i.integration_code ILIKE $${paramIndex} OR
        l.supplier_item_name ILIKE $${paramIndex} OR
        l.part_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++; // Increment paramIndex after using it for search
    }

    const query = `
      SELECT 
        i.id,
        i.name as original_name,
        i.integration_code as original_sku,
        i.description as original_description,
        i.type,
        i.measurement_unit,
        i.active,
        l.part_number,
        l.supplier_item_name,
        l.description as supplier_description,
        l.unit_price,
        l.currency,
        l.lead_time_days,
        l.minimum_order_quantity,
        l.is_preferred,
        l.id as link_id,
        CASE WHEN l.id IS NOT NULL THEN true ELSE false END as is_linked,
        COALESCE(l.supplier_item_name, i.name) as display_name,
        COALESCE(l.description, i.description) as display_description,
        CASE 
          WHEN l.unit_price IS NOT NULL THEN 
            CONCAT(COALESCE(l.currency, 'BRL'), ' ', l.unit_price::text)
          ELSE NULL 
        END as display_price
      FROM ${tenantId}.items i
      LEFT JOIN ${tenantId}.item_supplier_links l ON (
        l.item_id = i.id AND 
        l.supplier_id = $${paramIndex} AND 
        l.tenant_id = i.tenant_id AND 
        l.is_active = true
      )
      ${whereClause}
      ORDER BY display_name
    `;

    params.push(supplierId);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      items: result.rows
    });

  } catch (error) {
    console.error('Error fetching supplier context items:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};