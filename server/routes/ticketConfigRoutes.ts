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
      SELECT * FROM "${sql.raw(schemaName)}"."ticket_categories" 
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
        message: 'Não é possível excluir categoria que possui subcategorias'
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
      SELECT s.*, c.name as category_name 
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
        message: 'Não é possível excluir subcategoria que possui ações'
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
      SELECT a.*, s.name as subcategory_name, c.name as category_name 
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
    const companyId = req.query.companyId as string;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const result = await db.execute(sql`
      SELECT * FROM "${sql.raw(schemaName)}"."ticket_field_options" 
      WHERE tenant_id = ${tenantId} 
      AND company_id = ${companyId}
      AND active = true
      ORDER BY field_name, sort_order, display_label
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching field options:', error);
    res.status(500).json({
      error: 'Failed to fetch field options',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ticket-config/field-options
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
      companyId
    } = req.body;

    if (!fieldName || !value || !displayLabel) {
      return res.status(400).json({ message: 'Field name, value, and display label are required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const optionId = randomUUID();

    // Se esta opção for marcada como padrão, desmarcar outras do mesmo campo
    if (isDefault) {
      await db.execute(sql`
        UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
        SET is_default = false 
        WHERE tenant_id = ${tenantId} 
        AND company_id = ${companyId}
        AND field_name = ${fieldName}
      `);
    }

    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" (
        id, tenant_id, company_id, field_name, option_value, display_label, 
        color_hex, icon, is_default, active, sort_order, status_type, created_at, updated_at
      ) VALUES (
        ${optionId}, ${tenantId}, ${companyId}, ${fieldName}, ${value}, ${displayLabel}, 
        ${color || '#3b82f6'}, ${icon || null}, ${isDefault || false}, 
        ${active !== false}, ${sortOrder || 1}, ${req.body.statusType || null}, NOW(), NOW()
      )
    `);

    res.status(201).json({
      success: true,
      data: {
        id: optionId,
        fieldName,
        value,
        displayLabel,
        color: color || '#3b82f6',
        icon,
        isDefault: isDefault || false,
        active: active !== false,
        sortOrder: sortOrder || 1
      }
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
      companyId
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
          separator = ${separator || '-'},
          reset_yearly = ${resetYearly !== false},
          updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND company_id = ${companyId}
      `);
    } else {
      // Criar nova configuração
      const configId = randomUUID();
      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_numbering_config" (
          id, tenant_id, company_id, prefix, year_format, sequential_digits, 
          separator, reset_yearly, created_at, updated_at
        ) VALUES (
          ${configId}, ${tenantId}, ${companyId}, ${prefix}, ${yearFormat || '4'}, 
          ${sequentialDigits || 6}, ${separator || '-'}, ${resetYearly !== false}, 
          NOW(), NOW()
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

// ============================================================================
// VALIDATION RULES - Regras de validação
// ============================================================================

// GET /api/ticket-config/validation-rules
router.get('/validation-rules', jwtAuth, async (req: AuthenticatedRequest, res) => {
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
      SELECT * FROM "${sql.raw(schemaName)}"."ticket_validation_rules" 
      WHERE tenant_id = ${tenantId} 
      AND company_id = ${companyId}
      ORDER BY field_name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    res.status(500).json({
      error: 'Failed to fetch validation rules',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ticket-config/validation-rules
router.post('/validation-rules', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      fieldName,
      isRequired,
      validationPattern,
      errorMessage,
      defaultValue,
      companyId
    } = req.body;

    if (!fieldName || !companyId) {
      return res.status(400).json({ message: 'Field name and company ID are required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const ruleId = randomUUID();

    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_validation_rules" (
        id, tenant_id, company_id, field_name, is_required, validation_pattern, 
        error_message, default_value, created_at, updated_at
      ) VALUES (
        ${ruleId}, ${tenantId}, ${companyId}, ${fieldName}, ${isRequired || false}, 
        ${validationPattern || null}, ${errorMessage || null}, ${defaultValue || null}, 
        NOW(), NOW()
      )
    `);

    res.status(201).json({
      success: true,
      data: {
        id: ruleId,
        fieldName,
        isRequired: isRequired || false,
        validationPattern,
        errorMessage,
        defaultValue
      }
    });
  } catch (error) {
    console.error('Error creating validation rule:', error);
    res.status(500).json({
      error: 'Failed to create validation rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;