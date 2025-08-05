import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// ============================================================================
// CATEGORIES - Nível 2 da hierarquia
// ============================================================================

// GET /api/ticket-config/categories
router.get('/categories', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const companyId = req.query.companyId as string;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const result = await db.execute(sql`
      SELECT *, sort_order as "sortOrder" 
      FROM "${sql.raw(schemaName)}"."ticket_categories" 
      WHERE tenant_id = ${tenantId} 
      AND company_id = ${companyId}
      AND active = true
      ORDER BY sort_order, name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ticket-config/categories
router.post('/categories', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      name,
      description,
      color,
      icon,
      active,
      sortOrder,
      companyId
    } = req.body;

    if (!name || !companyId) {
      return res.status(400).json({ message: 'Name and company ID are required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const categoryId = randomUUID();

    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_categories" (
        id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at
      ) VALUES (
        ${categoryId}, ${tenantId}, ${companyId}, ${name}, ${description || null}, 
        ${color || '#3b82f6'}, ${icon || null}, ${active !== false}, ${sortOrder || 1}, 
        NOW(), NOW()
      )
    `);

    res.status(201).json({
      success: true,
      data: {
        id: categoryId,
        name,
        description,
        color: color || '#3b82f6',
        icon,
        active: active !== false,
        sortOrder: sortOrder || 1,
        companyId
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      error: 'Failed to create category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/ticket-config/categories/:id
router.put('/categories/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const categoryId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      name,
      description,
      color,
      icon,
      active,
      sortOrder
    } = req.body;

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_categories" 
      SET 
        name = ${name},
        description = ${description || null},
        color = ${color || '#3b82f6'},
        icon = ${icon || null},
        active = ${active !== false},
        sort_order = ${sortOrder || 1},
        updated_at = NOW()
      WHERE id = ${categoryId} AND tenant_id = ${tenantId}
    `);

    res.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      error: 'Failed to update category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/ticket-config/categories/:id
router.delete('/categories/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const categoryId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Check if category has subcategories
    const subcategoriesCheck = await db.execute(sql`
      SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_subcategories" 
      WHERE category_id = ${categoryId} AND tenant_id = ${tenantId}
    `);

    if (Number(subcategoriesCheck.rows[0]?.count) > 0) {
      return res.status(400).json({
        success: false,
        message: `Não é possível excluir categoria que possui ${subcategoriesCheck.rows[0]?.count} subcategoria(s). Exclua primeiro as subcategorias.`
      });
    }

    await db.execute(sql`
      DELETE FROM "${sql.raw(schemaName)}"."ticket_categories" 
      WHERE id = ${categoryId} AND tenant_id = ${tenantId}
    `);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      error: 'Failed to delete category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// SUBCATEGORIES - Nível 3 da hierarquia
// ============================================================================

// GET /api/ticket-config/subcategories
router.get('/subcategories', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const companyId = req.query.companyId as string;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const result = await db.execute(sql`
      SELECT s.*, 
             s.category_id as "categoryId",
             s.sort_order as "sortOrder",
             c.name as category_name 
      FROM "${sql.raw(schemaName)}"."ticket_subcategories" s
      JOIN "${sql.raw(schemaName)}"."ticket_categories" c ON s.category_id = c.id
      WHERE s.tenant_id = ${tenantId} 
      AND c.company_id = ${companyId}
      AND s.active = true
      ORDER BY s.sort_order, s.name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      error: 'Failed to fetch subcategories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ticket-config/subcategories
router.post('/subcategories', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    console.log('🔄 Creating subcategory with data:', req.body);

    const {
      categoryId,
      name,
      description,
      color = '#3b82f6',
      icon,
      active = true,
      sortOrder = 1
    } = req.body;

    // Validate required fields
    if (!categoryId || !name) {
      console.error('❌ Missing required fields:', { categoryId, name });
      return res.status(400).json({ 
        success: false,
        message: 'Category ID and name are required' 
      });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log('🔍 Checking if category exists:', categoryId);

    // Check if category exists
    const categoryCheck = await db.execute(sql`
      SELECT id FROM "${sql.raw(schemaName)}"."ticket_categories" 
      WHERE id = ${categoryId} AND tenant_id = ${tenantId}
    `);

    if (categoryCheck.rows.length === 0) {
      console.error('❌ Category not found:', categoryId);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ Category found, creating subcategory...');

    // Insert subcategory with proper company_id field
    const result = await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories" 
      (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
      VALUES (gen_random_uuid(), ${tenantId}, ${tenantId}, ${categoryId}, ${name}, ${description || null}, ${color}, ${icon || null}, ${active}, ${sortOrder}, NOW(), NOW())
      RETURNING *
    `);

    console.log('✅ Subcategory created successfully:', result.rows[0]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Subcategory created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subcategory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/ticket-config/subcategories/:id
router.delete('/subcategories/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const subcategoryId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Check if subcategory has actions
    const actionsCheck = await db.execute(sql`
      SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_actions" 
      WHERE subcategory_id = ${subcategoryId} AND tenant_id = ${tenantId}
    `);

    if (Number(actionsCheck.rows[0]?.count) > 0) {
      return res.status(400).json({
        success: false,
        message: `Não é possível excluir subcategoria que possui ${actionsCheck.rows[0]?.count} ação(ões). Exclua primeiro as ações.`
      });
    }

    await db.execute(sql`
      DELETE FROM "${sql.raw(schemaName)}"."ticket_subcategories" 
      WHERE id = ${subcategoryId} AND tenant_id = ${tenantId}
    `);

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      error: 'Failed to delete subcategory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ACTIONS - Nível 4 da hierarquia
// ============================================================================

// GET /api/ticket-config/actions
router.get('/actions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const companyId = req.query.companyId as string;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const result = await db.execute(sql`
      SELECT a.*, 
             a.subcategory_id as "subcategoryId",
             a.estimated_time_minutes as "estimatedTimeMinutes",
             a.sort_order as "sortOrder",
             s.name as subcategory_name, 
             c.name as category_name 
      FROM "${sql.raw(schemaName)}"."ticket_actions" a
      JOIN "${sql.raw(schemaName)}"."ticket_subcategories" s ON a.subcategory_id = s.id
      JOIN "${sql.raw(schemaName)}"."ticket_categories" c ON s.category_id = c.id
      WHERE a.tenant_id = ${tenantId} 
      AND c.company_id = ${companyId}
      AND a.active = true
      ORDER BY a.sort_order, a.name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({
      error: 'Failed to fetch actions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ticket-config/actions
router.post('/actions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      name,
      description,
      subcategoryId,
      estimatedTimeMinutes,
      color,
      icon,
      active,
      sortOrder,
      companyId
    } = req.body;

    if (!name || !subcategoryId) {
      return res.status(400).json({ message: 'Name and subcategory ID are required' });
    }

    // Get companyId from query params if not in body
    const finalCompanyId = companyId || req.query.companyId as string;

    if (!finalCompanyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const actionId = randomUUID();

    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_actions" (
        id, tenant_id, company_id, subcategory_id, name, description, estimated_time_minutes, 
        color, icon, active, sort_order, created_at, updated_at
      ) VALUES (
        ${actionId}, ${tenantId}, ${finalCompanyId}, ${subcategoryId}, ${name}, ${description || null}, 
        ${estimatedTimeMinutes || null}, ${color || '#3b82f6'}, ${icon || null}, 
        ${active !== false}, ${sortOrder || 1}, NOW(), NOW()
      )
    `);

    res.status(201).json({
      success: true,
      data: {
        id: actionId,
        name,
        description,
        subcategoryId,
        estimatedTimeMinutes,
        color: color || '#3b82f6',
        icon,
        active: active !== false,
        sortOrder: sortOrder || 1,
        companyId: finalCompanyId
      }
    });
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({
      error: 'Failed to create action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/ticket-config/actions/:id
router.delete('/actions/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const actionId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    await db.execute(sql`
      DELETE FROM "${sql.raw(schemaName)}"."ticket_actions" 
      WHERE id = ${actionId} AND tenant_id = ${tenantId}
    `);

    res.json({
      success: true,
      message: 'Action deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting action:', error);
    res.status(500).json({
      error: 'Failed to delete action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// FIELD OPTIONS - Configuração de campos (status, priority, impact, urgency)
// ============================================================================

// GET /api/ticket-config/field-options
router.get('/field-options', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    let companyId = req.query.companyId as string;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "User not associated with a tenant" });
    }

    // Se nenhuma empresa foi selecionada, usar a empresa padrão Default
    if (!companyId) {
      companyId = '00000000-0000-0000-0000-000000000001'; // Empresa Default
      console.log('🎯 No company selected, using Default company for field options');
    }

    console.log('🔍 Fetching field options for:', { tenantId, companyId });

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Primeiro, tentar buscar configurações específicas da empresa (INCLUINDO INATIVAS)
    let result = await db.execute(sql`
      SELECT 
        id,
        tenant_id,
        customer_id,
        field_name,
        value,
        label,
        color,
        sort_order,
        is_active,
        is_default,
        status_type,
        created_at,
        updated_at
      FROM "${sql.raw(schemaName)}".ticket_field_options 
      WHERE tenant_id = ${tenantId}
      AND customer_id = ${companyId}
      ORDER BY field_name, sort_order, label
    `);

    // Se não encontrar configurações específicas e não for a empresa Default, buscar na Default (INCLUINDO INATIVAS)
    if (result.rows.length === 0 && companyId !== '00000000-0000-0000-0000-000000000001') {
      console.log('🔄 No specific company config found, falling back to Default company');
      result = await db.execute(sql`
        SELECT 
          id,
          tenant_id,
          customer_id,
          field_name,
          value,
          label,
          color,
          sort_order,
          is_active,
          is_default,
          status_type,
          created_at,
          updated_at
        FROM "${sql.raw(schemaName)}".ticket_field_options 
        WHERE tenant_id = ${tenantId}
        AND customer_id = '00000000-0000-0000-0000-000000000001'
        ORDER BY field_name, sort_order, label
      `);
    }

    console.log('🔍 Field options query result for company:', companyId, {
      totalRows: result.rows.length,
      byFieldName: result.rows.reduce((acc: any, row: any) => {
        acc[row.field_name] = (acc[row.field_name] || 0) + 1;
        return acc;
      }, {}),
      statusRows: result.rows.filter((row: any) => row.field_name === 'status').map((row: any) => ({
        id: row.id,
        value: row.value,
        label: row.label,
        is_default: row.is_default,
        customer_id: row.customer_id,
        created_at: row.created_at
      }))
    });

    // Force fresh response headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching field options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch field options'
    });
  }
});

// Delete field option endpoint
router.delete('/field-options/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const optionId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    console.log('🗑️ Deleting field option:', { tenantId, optionId });

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // First check if the field option exists
    const checkResult = await db.execute(sql`
      SELECT id, label, field_name FROM "${sql.raw(schemaName)}"."ticket_field_options" 
      WHERE id = ${optionId} AND tenant_id = ${tenantId}
    `);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Field option not found' 
      });
    }

    // Delete the field option
    const deleteResult = await db.execute(sql`
      DELETE FROM "${sql.raw(schemaName)}"."ticket_field_options" 
      WHERE id = ${optionId} AND tenant_id = ${tenantId}
    `);

    console.log('✅ Field option deleted successfully:', { 
      optionId,
      affectedRows: deleteResult.rowCount 
    });

    // Force fresh response headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      message: 'Field option deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting field option:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete field option',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create field option endpoint
router.post('/field-options', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      fieldName,
      value,
      displayLabel,
      color,
      icon,
      isDefault,
      active,
      sortOrder,
      companyId,
      statusType
    } = req.body;

    if (!fieldName || !value || !displayLabel) {
      return res.status(400).json({ message: 'Field name, value, and display label are required' });
    }

    // Validate that statusType is required for status field
    if (fieldName === 'status' && !statusType) {
      return res.status(400).json({ message: 'Status type is required for status field options' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const optionId = randomUUID();

    // Se esta opção for marcada como padrão, desmarcar outras do mesmo campo
    if (isDefault) {
      await db.execute(sql`
        UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
        SET is_default = false 
        WHERE tenant_id = ${tenantId} 
        AND customer_id = ${companyId}
        AND field_name = ${fieldName}
      `);
    }

    console.log('💾 Creating field option:', {
      optionId,
      tenantId,
      companyId,
      fieldName,
      value,
      displayLabel,
      statusType: req.body.statusType
    });

    const insertResult = await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" (
        id, tenant_id, customer_id, field_name, value, label, 
        color, sort_order, is_default, is_active, status_type, created_at, updated_at
      ) VALUES (
        ${optionId}, ${tenantId}, ${companyId}, ${fieldName}, ${value}, ${displayLabel}, 
        ${color || '#3b82f6'}, ${sortOrder || 1}, ${isDefault || false}, 
        ${active !== false}, ${statusType || null}, NOW(), NOW()
      )
      RETURNING *
    `);

    console.log('✅ Field option created successfully:', insertResult.rows[0]);

    // Verify it was actually inserted
    const verifyResult = await db.execute(sql`
      SELECT * FROM "${sql.raw(schemaName)}"."ticket_field_options" 
      WHERE id = ${optionId} AND tenant_id = ${tenantId} AND company_id = ${companyId}
    `);

    console.log('🔍 Verification query result:', verifyResult.rows[0]);

    res.status(201).json({
      success: true,
      data: insertResult.rows[0] || {
        id: optionId,
        fieldName,
        value,
        displayLabel,
        color: color || '#3b82f6',
        icon,
        isDefault: isDefault || false,
        active: active !== false,
        sortOrder: sortOrder || 1,
        statusType: req.body.statusType || null
      },
      message: 'Field option created successfully'
    });
  } catch (error) {
    console.error('Error creating field option:', error);
    res.status(500).json({
      error: 'Failed to create field option',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// NUMBERING CONFIGURATION - Configuração de numeração
// ============================================================================

interface NumberingConfig {
  id: string;
  prefix: string;
  firstSeparator: string;
  yearFormat: '2' | '4';
  sequentialDigits: number;
  separator: string;
  resetYearly: boolean;
  companyId: string;
}

// GET /api/ticket-config/numbering
router.get('/numbering', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const companyId = req.query.companyId as string;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const result = await db.execute(sql`
      SELECT * FROM "${sql.raw(schemaName)}"."ticket_numbering_config" 
      WHERE tenant_id = ${tenantId} 
      AND company_id = ${companyId}
      LIMIT 1
    `);

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching numbering config:', error);
    res.status(500).json({
      error: 'Failed to fetch numbering config',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ticket-config/numbering
router.post('/numbering', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      prefix,
      yearFormat,
      sequentialDigits,
      separator,
      resetYearly,
      companyId,
      firstSeparator
    } = req.body;

    if (!prefix || !companyId) {
      return res.status(400).json({ message: 'Prefix and company ID are required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Verificar se já existe configuração para esta empresa
    const existingResult = await db.execute(sql`
      SELECT id FROM "${sql.raw(schemaName)}"."ticket_numbering_config" 
      WHERE tenant_id = ${tenantId} AND company_id = ${companyId}
      LIMIT 1
    `);

    if (existingResult.rows.length > 0) {
      // Atualizar configuração existente
      await db.execute(sql`
        UPDATE "${sql.raw(schemaName)}"."ticket_numbering_config" 
        SET 
          prefix = ${prefix},
          year_format = ${yearFormat || '4'},
          sequential_digits = ${sequentialDigits || 6},
          separator = ${separator || ''},
          reset_yearly = ${resetYearly !== false},
          first_separator = ${firstSeparator || ''},
          updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND company_id = ${companyId}
      `);
    } else {
      // Criar nova configuração
      const configId = randomUUID();
      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_numbering_config" (
          id, tenant_id, company_id, prefix, year_format, sequential_digits, 
          separator, reset_yearly, created_at, updated_at, first_separator
        ) VALUES (
          ${configId}, ${tenantId}, ${companyId}, ${prefix}, ${yearFormat || '4'}, 
          ${sequentialDigits || 6}, ${separator || ''}, ${resetYearly !== false}, 
          NOW(), NOW(), ${firstSeparator || ''}
        )
      `);
    }

    res.json({
      success: true,
      message: 'Numbering configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving numbering config:', error);
    res.status(500).json({
      error: 'Failed to save numbering config',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update field option endpoint - for full field option updates
router.put('/field-options/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const optionId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      fieldName,
      value,
      displayLabel,
      color,
      icon,
      isDefault,
      active,
      sortOrder,
      companyId,
      statusType
    } = req.body;

    if (!fieldName || !value || !displayLabel) {
      return res.status(400).json({ message: 'Field name, value, and display label are required' });
    }

    // Validate that statusType is required for status field
    if (fieldName === 'status' && !statusType) {
      return res.status(400).json({ message: 'Status type is required for status field options' });
    }

    console.log('🔄 Updating field option:', {      optionId,
      tenantId,
      companyId,
      fieldName,
      value,
      displayLabel,
      statusType
    });

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // First check if the field option exists
    const checkResult = await db.execute(sql`
      SELECT id, field_name, label FROM "${sql.raw(schemaName)}"."ticket_field_options" 
      WHERE id = ${optionId} AND tenant_id = ${tenantId}
    `);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Field option not found' 
      });
    }

    // Se esta opção for marcada como padrão, desmarcar outras do mesmo campo
    if (isDefault) {
      await db.execute(sql`
        UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
        SET is_default = false 
        WHERE tenant_id = ${tenantId} 
        AND customer_id = ${companyId}
        AND field_name = ${fieldName}
        AND id != ${optionId}
      `);
    }

    // Update the field option
    const updateResult = await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
      SET 
        field_name = ${fieldName},
        value = ${value},
        label = ${displayLabel},
        color = ${color || '#3b82f6'},
        sort_order = ${sortOrder || 1},
        is_default = ${isDefault || false},
        is_active = ${active !== false},
        status_type = ${statusType || null},
        updated_at = NOW()
      WHERE id = ${optionId} AND tenant_id = ${tenantId}
      RETURNING *
    `);

    console.log('✅ Field option updated successfully:', updateResult.rows[0]);

    // Force fresh response headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: 'Field option updated successfully'
    });
  } catch (error) {
    console.error('Error updating field option:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update field option',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update field option status endpoint - for activate/deactivate toggles
router.put('/field-options/:id/status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const optionId = req.params.id;
    const { active, companyId } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (active === undefined) {
      return res.status(400).json({ message: 'Active status is required' });
    }

    console.log('🔄 Updating field option status:', { 
      tenantId, 
      optionId, 
      active,
      companyId 
    });

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // First check if the field option exists
    const checkResult = await db.execute(sql`
      SELECT id, field_name, label, is_active FROM "${sql.raw(schemaName)}"."ticket_field_options" 
      WHERE id = ${optionId} AND tenant_id = ${tenantId}
    `);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Field option not found' 
      });
    }

    const existingOption = checkResult.rows[0];
    console.log('🔍 Current option status:', {
      id: existingOption.id,
      field_name: existingOption.field_name,
      label: existingOption.label,
      current_active: existingOption.is_active,
      new_active: active
    });

    // Update the active status
    const updateResult = await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
      SET 
        is_active = ${active},
        updated_at = NOW()
      WHERE id = ${optionId} AND tenant_id = ${tenantId}
    `);

    console.log('✅ Field option status updated:', { 
      optionId,
      previousStatus: existingOption.is_active,
      newStatus: active,
      affectedRows: updateResult.rowCount 
    });

    // Verify the update
    const verifyResult = await db.execute(sql`
      SELECT is_active FROM "${sql.raw(schemaName)}"."ticket_field_options" 
      WHERE id = ${optionId} AND tenant_id = ${tenantId}
    `);

    const updatedStatus = verifyResult.rows[0]?.is_active;
    console.log('🔍 Status verification:', { 
      expected: active, 
      actual: updatedStatus,
      matches: updatedStatus === active 
    });

    // Force fresh response headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      message: 'Field option status updated successfully',
      data: {
        id: optionId,
        previousStatus: existingOption.is_active,
        newStatus: active,
        verified: updatedStatus === active
      }
    });
  } catch (error) {
    console.error('❌ Error updating field option status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update field option status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// COPY HIERARCHY - Copiar estrutura hierárquica entre empresas
// ============================================================================

// POST /api/ticket-config/copy-hierarchy
router.post('/copy-hierarchy', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { sourceCompanyId, targetCompanyId } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!sourceCompanyId || !targetCompanyId) {
      return res.status(400).json({ message: 'Source and target company IDs are required' });
    }

    if (sourceCompanyId === targetCompanyId) {
      return res.status(400).json({ message: 'Source and target companies cannot be the same' });
    }

    console.log(`🔄 Copying hierarchy from ${sourceCompanyId} to ${targetCompanyId} for tenant ${tenantId}`);

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    let copiedItems = {
      categories: 0,
      subcategories: 0,
      actions: 0,
      fieldOptions: 0,
      numberingConfig: 0
    };

    // 1. Copy Categories
    const categoriesResult = await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_categories" 
      (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
      SELECT 
        gen_random_uuid(), 
        tenant_id, 
        ${targetCompanyId}, 
        name, 
        description, 
        color, 
        icon, 
        active, 
        sort_order, 
        NOW(), 
        NOW()
      FROM "${sql.raw(schemaName)}"."ticket_categories"
      WHERE tenant_id = ${tenantId} AND company_id = ${sourceCompanyId}
      AND NOT EXISTS (
        SELECT 1 FROM "${sql.raw(schemaName)}"."ticket_categories" target
        WHERE target.tenant_id = ${tenantId} 
        AND target.company_id = ${targetCompanyId}
        AND target.name = "${sql.raw(schemaName)}"."ticket_categories".name
      )
      RETURNING id
    `);
    copiedItems.categories = categoriesResult.rows.length;

    // 2. Copy Subcategories (with category mapping)
    if (copiedItems.categories > 0) {
      const subcategoriesResult = await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories" 
        (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
        SELECT 
          gen_random_uuid(),
          s.tenant_id,
          ${targetCompanyId},
          tc.id,
          s.name,
          s.description,
          s.color,
          s.icon,
          s.active,
          s.sort_order,
          NOW(),
          NOW()
        FROM "${sql.raw(schemaName)}"."ticket_subcategories" s
        JOIN "${sql.raw(schemaName)}"."ticket_categories" sc ON s.category_id = sc.id
        JOIN "${sql.raw(schemaName)}"."ticket_categories" tc ON sc.name = tc.name 
          AND tc.company_id = ${targetCompanyId} AND tc.tenant_id = ${tenantId}
        WHERE s.tenant_id = ${tenantId} 
        AND sc.company_id = ${sourceCompanyId}
        AND NOT EXISTS (
          SELECT 1 FROM "${sql.raw(schemaName)}"."ticket_subcategories" target
          WHERE target.tenant_id = ${tenantId} 
          AND target.category_id = tc.id
          AND target.name = s.name
        )
        RETURNING id
      `);
      copiedItems.subcategories = subcategoriesResult.rows.length;

      // 3. Copy Actions (with subcategory mapping)
      if (copiedItems.subcategories > 0) {
        const actionsResult = await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_actions" 
          (id, tenant_id, company_id, subcategory_id, name, description, estimated_time_minutes, color, icon, active, sort_order, created_at, updated_at)
          SELECT 
            gen_random_uuid(),
            a.tenant_id,
            ${targetCompanyId},
            ts.id,
            a.name,
            a.description,
            a.estimated_time_minutes,
            a.color,
            a.icon,
            a.active,
            a.sort_order,
            NOW(),
            NOW()
          FROM "${sql.raw(schemaName)}"."ticket_actions" a
          JOIN "${sql.raw(schemaName)}"."ticket_subcategories" ss ON a.subcategory_id = ss.id
          JOIN "${sql.raw(schemaName)}"."ticket_categories" sc ON ss.category_id = sc.id
          JOIN "${sql.raw(schemaName)}"."ticket_categories" tc ON sc.name = tc.name 
            AND tc.company_id = ${targetCompanyId} AND tc.tenant_id = ${tenantId}
          JOIN "${sql.raw(schemaName)}"."ticket_subcategories" ts ON ss.name = ts.name 
            AND ts.category_id = tc.id AND ts.tenant_id = ${tenantId}
          WHERE a.tenant_id = ${tenantId} 
          AND sc.company_id = ${sourceCompanyId}
          AND NOT EXISTS (
            SELECT 1 FROM "${sql.raw(schemaName)}"."ticket_actions" target
            WHERE target.tenant_id = ${tenantId} 
            AND target.subcategory_id = ts.id
            AND target.name = a.name
          )
          RETURNING id
        `);
        copiedItems.actions = actionsResult.rows.length;
      }
    }

    // 4. Copy Field Options - with enhanced duplicate checking
    // First, check if there are existing field options for the target company
    const existingFieldOptionsCheck = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM "${sql.raw(schemaName)}"."ticket_field_options"
      WHERE tenant_id = ${tenantId} 
      AND customer_id = ${targetCompanyId}
    `);

    const hasExistingOptions = Number(existingFieldOptionsCheck.rows[0]?.count) > 0;

    if (hasExistingOptions) {
      // Delete existing field options for the target company to avoid conflicts
      await db.execute(sql`
        DELETE FROM "${sql.raw(schemaName)}"."ticket_field_options"
        WHERE tenant_id = ${tenantId} 
        AND customer_id = ${targetCompanyId}
      `);
      console.log(`🗑️ Deleted existing field options for target company ${targetCompanyId}`);
    }

    // Now insert the field options from source with proper deduplication
    const fieldOptionsResult = await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" 
      (id, tenant_id, customer_id, field_name, value, label, color, sort_order, is_default, is_active, status_type, created_at, updated_at)
      SELECT DISTINCT
        gen_random_uuid(),
        source.tenant_id,
        ${targetCompanyId}::uuid,
        source.field_name,
        source.value,
        source.label,
        source.color,
        source.sort_order,
        source.is_default,
        source.is_active,
        source.status_type,
        NOW(),
        NOW()
      FROM "${sql.raw(schemaName)}"."ticket_field_options" source
      WHERE source.tenant_id = ${tenantId} 
      AND source.customer_id = ${sourceCompanyId}
      ON CONFLICT (tenant_id, field_name, value) DO NOTHING
      RETURNING id
    `);
    copiedItems.fieldOptions = fieldOptionsResult.rows.length;

    // 5. Copy Numbering Configuration
    const numberingResult = await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_numbering_config" 
      (id, tenant_id, company_id, prefix, year_format, sequential_digits, separator, reset_yearly, first_separator, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        tenant_id,
        ${targetCompanyId},
        prefix,
        year_format,
        sequential_digits,
        separator,
        reset_yearly,
        first_separator,
        NOW(),
        NOW()
      FROM "${sql.raw(schemaName)}"."ticket_numbering_config"
      WHERE tenant_id = ${tenantId} AND company_id = ${sourceCompanyId}
      AND NOT EXISTS (
        SELECT 1 FROM "${sql.raw(schemaName)}"."ticket_numbering_config" target
        WHERE target.tenant_id = ${tenantId} 
        AND target.company_id = ${targetCompanyId}
      )
      RETURNING id
    `);
    copiedItems.numberingConfig = numberingResult.rows.length;

    const summary = `Copiados: ${copiedItems.categories} categorias, ${copiedItems.subcategories} subcategorias, ${copiedItems.actions} ações, ${copiedItems.fieldOptions} opções de campos, ${copiedItems.numberingConfig} configuração de numeração`;

    console.log('✅ Hierarchy copy completed:', copiedItems);

    res.json({
      success: true,
      message: 'Hierarchy copied successfully',
      data: copiedItems,
      summary: summary
    });
  } catch (error) {
    console.error('Error copying hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to copy hierarchy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;