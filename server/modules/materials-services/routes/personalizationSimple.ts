// Simplified personalization routes that work with existing project patterns
import { Router } from 'express';
import { pool } from '../../../db.js';

const router = Router();

// Get customer personalizations
router.get('/customers/:customerId/personalizations', async (req: any, res) => {
  try {
    const { customerId } = req.params;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const query = `
      SELECT 
        m.id,
        m.customer_id,
        m.item_id,
        m.custom_sku,
        m.custom_name,
        m.custom_description,
        m.customer_reference,
        m.special_instructions,
        m.is_active,
        m.created_at,
        m.updated_at,
        i.name as item_name,
        i.type as item_type,
        i.integration_code as item_sku,
        i.description as item_description,
        c.name as customer_name
      FROM tenant_${tenantId.replace(/-/g, '_')}.customer_item_mappings m
      LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.items i ON m.item_id = i.id
      LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.customer_companies c ON m.customer_id = c.id
      WHERE m.tenant_id = $1 AND m.customer_id = $2 AND m.is_active = true
      ORDER BY m.created_at DESC
    `;

    const result = await pool.query(query, [tenantId, customerId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching customer personalizations:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Get customer items with hierarchical resolution
router.get('/customers/:customerId/items', async (req: any, res) => {
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

    if (type) {
      whereClause += ` AND i.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (
        i.name ILIKE $${paramIndex} OR 
        i.integration_code ILIKE $${paramIndex} OR
        m.custom_name ILIKE $${paramIndex} OR
        m.custom_sku ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
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
      FROM tenant_${tenantId.replace(/-/g, '_')}.items i
      LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.customer_item_mappings m ON (
        m.item_id = i.id AND 
        m.customer_id = $${paramIndex} AND 
        m.tenant_id = i.tenant_id AND 
        m.is_active = true
      )
      ${whereClause}
      ORDER BY display_name
      LIMIT 100
    `;

    params.push(customerId);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching customer context items:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Create customer personalization
router.post('/items/:itemId/customer-personalizations', async (req: any, res) => {
  try {
    const { itemId } = req.params;
    const {
      customerId,
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

    // Check if personalization already exists
    const existingQuery = `
      SELECT id FROM tenant_${tenantId.replace(/-/g, '_')}.customer_item_mappings 
      WHERE tenant_id = $1 AND customer_id = $2 AND item_id = $3
    `;
    
    const existing = await pool.query(existingQuery, [tenantId, customerId, itemId]);
    
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Personalização já existe para este cliente e item'
      });
    }

    // Create personalization
    const insertQuery = `
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.customer_item_mappings (
        tenant_id, customer_id, item_id, custom_sku, custom_name, 
        custom_description, customer_reference, special_instructions,
        created_by, updated_by, created_at, updated_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), true)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      tenantId, customerId, itemId, customSku, customName,
      customDescription, customerReference, specialInstructions,
      userId, userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Personalização criada com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating customer personalization:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Get supplier links
router.get('/suppliers/:supplierId/links', async (req: any, res) => {
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
      FROM tenant_${tenantId.replace(/-/g, '_')}.item_supplier_links l
      LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.items i ON l.item_id = i.id
      WHERE l.tenant_id = $1 AND l.supplier_id = $2 AND l.is_active = true
      ORDER BY l.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, [tenantId, supplierId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching supplier links:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Create supplier link
router.post('/items/:itemId/supplier-links', async (req: any, res) => {
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
      SELECT id FROM tenant_${tenantId.replace(/-/g, '_')}.item_supplier_links 
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
      INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.item_supplier_links (
        tenant_id, supplier_id, item_id, part_number, supplier_item_name,
        description, unit_price, currency, lead_time_days, minimum_order_quantity,
        is_preferred, created_by, updated_by, created_at, updated_at, 
        last_price_update, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW(), true)
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
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating supplier link:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export { router as personalizationSimpleRoutes };