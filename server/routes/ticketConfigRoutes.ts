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

    // Sync color with ticket_field_options
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
      SET 
        color = ${color || '#3b82f6'},
        updated_at = NOW()
      WHERE field_name = 'category' 
      AND value = ${name}
      AND tenant_id = ${tenantId}
    `);

    console.log(`🔄 Synced category color: ${name} = ${color || '#3b82f6'}`);

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

    // Check if category exists and get its company_id
    const categoryCheck = await db.execute(sql`
      SELECT id, company_id FROM "${sql.raw(schemaName)}"."ticket_categories" 
      WHERE id = ${categoryId} AND tenant_id = ${tenantId}
    `);

    if (categoryCheck.rows.length === 0) {
      console.error('❌ Category not found:', categoryId);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const categoryCompanyId = categoryCheck.rows[0].company_id;
    console.log('✅ Category found, creating subcategory with company_id:', categoryCompanyId);

    // Insert subcategory with correct company_id from parent category
    const result = await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories" 
      (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
      VALUES (gen_random_uuid(), ${tenantId}, ${categoryCompanyId}, ${categoryId}, ${name}, ${description || null}, ${color}, ${icon || null}, ${active}, ${sortOrder}, NOW(), NOW())
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

// PUT /api/ticket-config/subcategories/:id
router.put('/subcategories/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const subcategoryId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      name,
      description,
      categoryId,
      color,
      icon,
      active,
      sortOrder
    } = req.body;

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // If categoryId is being changed, validate same-company constraint
    if (categoryId) {
      // Get current subcategory's company_id
      const currentSubcategory = await db.execute(sql`
        SELECT company_id FROM "${sql.raw(schemaName)}"."ticket_subcategories" 
        WHERE id = ${subcategoryId} AND tenant_id = ${tenantId}
      `);

      if (currentSubcategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      // Validate new category exists and belongs to same company
      const categoryCheck = await db.execute(sql`
        SELECT id, company_id FROM "${sql.raw(schemaName)}"."ticket_categories" 
        WHERE id = ${categoryId} AND tenant_id = ${tenantId}
      `);

      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const currentCompanyId = currentSubcategory.rows[0].company_id;
      const newCompanyId = categoryCheck.rows[0].company_id;

      if (currentCompanyId !== newCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move subcategory to a different company'
        });
      }
    }

    // Update subcategory (company_id remains unchanged for integrity)
    const updateFields = {
      name,
      description: description || null,
      color: color || '#3b82f6',
      icon: icon || null,
      active: active !== false,
      sort_order: sortOrder || 1
    };

    if (categoryId) {
      await db.execute(sql`
        UPDATE "${sql.raw(schemaName)}"."ticket_subcategories" 
        SET 
          name = ${updateFields.name},
          description = ${updateFields.description},
          category_id = ${categoryId},
          color = ${updateFields.color},
          icon = ${updateFields.icon},
          active = ${updateFields.active},
          sort_order = ${updateFields.sort_order},
          updated_at = NOW()
        WHERE id = ${subcategoryId} AND tenant_id = ${tenantId}
      `);
    } else {
      await db.execute(sql`
        UPDATE "${sql.raw(schemaName)}"."ticket_subcategories" 
        SET 
          name = ${updateFields.name},
          description = ${updateFields.description},
          color = ${updateFields.color},
          icon = ${updateFields.icon},
          active = ${updateFields.active},
          sort_order = ${updateFields.sort_order},
          updated_at = NOW()
        WHERE id = ${subcategoryId} AND tenant_id = ${tenantId}
      `);
    }

    // Sync color with ticket_field_options
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
      SET 
        color = ${color || '#3b82f6'},
        updated_at = NOW()
      WHERE field_name = 'subcategory' 
      AND value = ${name}
      AND tenant_id = ${tenantId}
    `);

    console.log(`🔄 Synced subcategory color: ${name} = ${color || '#3b82f6'}`);

    res.json({
      success: true,
      message: 'Subcategory updated successfully'
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      error: 'Failed to update subcategory',
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
      SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_action_types" 
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
             a.sort_order as "sortOrder",
             s.name as subcategory_name, 
             c.name as category_name 
      FROM "${sql.raw(schemaName)}"."ticket_action_types" a
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
      color,
      icon,
      active,
      sortOrder
    } = req.body;

    if (!name || !subcategoryId) {
      return res.status(400).json({ message: 'Name and subcategory ID are required' });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Get company_id from subcategory to ensure consistency
    const subcategoryCheck = await db.execute(sql`
      SELECT s.company_id 
      FROM "${sql.raw(schemaName)}"."ticket_subcategories" s
      JOIN "${sql.raw(schemaName)}"."ticket_categories" c ON s.category_id = c.id
      WHERE s.id = ${subcategoryId} AND s.tenant_id = ${tenantId}
    `);

    if (subcategoryCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    const subcategoryCompanyId = subcategoryCheck.rows[0].company_id;
    const actionId = randomUUID();

    await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_action_types" (
        id, tenant_id, company_id, subcategory_id, name, description,
        color, icon, active, sort_order, created_at, updated_at
      ) VALUES (
        ${actionId}, ${tenantId}, ${subcategoryCompanyId}, ${subcategoryId}, ${name}, ${description || null}, 
        ${color || '#3b82f6'}, ${icon || null}, 
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
        color: color || '#3b82f6',
        icon,
        active: active !== false,
        sortOrder: sortOrder || 1,
        companyId: subcategoryCompanyId
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

// PUT /api/ticket-config/actions/:id
router.put('/actions/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const actionId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const {
      name,
      description,
      subcategoryId,
      color,
      icon,
      active,
      sortOrder
    } = req.body;

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // If subcategoryId is being changed, validate same-company constraint
    if (subcategoryId) {
      // Get current action's company_id
      const currentAction = await db.execute(sql`
        SELECT company_id FROM "${sql.raw(schemaName)}"."ticket_action_types" 
        WHERE id = ${actionId} AND tenant_id = ${tenantId}
      `);

      if (currentAction.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Action not found'
        });
      }

      // Validate new subcategory exists and belongs to same company
      const subcategoryCheck = await db.execute(sql`
        SELECT s.company_id 
        FROM "${sql.raw(schemaName)}"."ticket_subcategories" s
        JOIN "${sql.raw(schemaName)}"."ticket_categories" c ON s.category_id = c.id
        WHERE s.id = ${subcategoryId} AND s.tenant_id = ${tenantId}
      `);

      if (subcategoryCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      const currentCompanyId = currentAction.rows[0].company_id;
      const newCompanyId = subcategoryCheck.rows[0].company_id;

      if (currentCompanyId !== newCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move action to a different company'
        });
      }
    }

    // Update action (company_id remains unchanged for integrity)
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_action_types" 
      SET 
        name = ${name},
        description = ${description || null},
        subcategory_id = ${subcategoryId},
        color = ${color || '#3b82f6'},
        icon = ${icon || null},
        active = ${active !== false},
        sort_order = ${sortOrder || 1},
        updated_at = NOW()
      WHERE id = ${actionId} AND tenant_id = ${tenantId}
    `);

    // Sync color with ticket_field_options
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_field_options" 
      SET 
        color = ${color || '#3b82f6'},
        updated_at = NOW()
      WHERE field_name = 'action' 
      AND value = ${name}
      AND tenant_id = ${tenantId}
    `);

    console.log(`🔄 Synced action color: ${name} = ${color || '#3b82f6'}`);

    res.json({
      success: true,
      message: 'Action updated successfully'
    });
  } catch (error) {
    console.error('Error updating action:', error);
    res.status(500).json({
      error: 'Failed to update action',
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
      DELETE FROM "${sql.raw(schemaName)}"."ticket_action_types" 
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
    const fieldName = req.query.fieldName as string;
    const dependsOn = req.query.dependsOn as string; // Para hierarquias (categoria → subcategoria → ação)

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "User not associated with a tenant" });
    }

    // Se nenhuma empresa foi selecionada, usar a empresa padrão Default
    if (!companyId) {
      companyId = '00000000-0000-0000-0000-000000000001'; // Empresa Default
      console.log('🎯 No company selected, using Default company for field options');
    }

    console.log('🔍 Fetching field options for:', { tenantId, companyId, fieldName, dependsOn });

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    let result: any;

    // CRÍTICO: Verificar se é campo hierárquico
    const isHierarchical = ['category', 'subcategory', 'action'].includes(fieldName);
    console.log(`🔧 Processing field: ${fieldName}, hierarchical: ${isHierarchical}, dependsOn: ${dependsOn}`);

    // Handle hierarchical field types
    if (fieldName === 'category') {
      // Buscar categorias
      result = await db.execute(sql`
        SELECT 
          id,
          name as label,
          name as value,
          color,
          sort_order,
          active as is_active,
          created_at,
          updated_at
        FROM "${sql.raw(schemaName)}".ticket_categories 
        WHERE tenant_id = ${tenantId}
        AND company_id = ${companyId}
        AND active = true
        ORDER BY sort_order, name
      `);

      // Sincronização automática: garantir que cores existam na ticket_field_options
      for (const row of result.rows) {
        await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}".ticket_field_options 
          (tenant_id, company_id, field_name, value, label, color, sort_order, is_active, is_default)
          VALUES (${tenantId}, ${companyId}, 'category', ${row.value}, ${row.label}, ${row.color}, ${row.sort_order || 0}, true, false)
          ON CONFLICT (tenant_id, company_id, field_name, value) 
          DO UPDATE SET color = EXCLUDED.color, label = EXCLUDED.label
        `);
      }
      console.log(`🔄 Auto-synced ${result.rows.length} category colors to ticket_field_options`);
    } else if (fieldName === 'subcategory') {
      if (dependsOn) {
        // Buscar subcategorias para uma categoria específica
        result = await db.execute(sql`
          SELECT 
            s.id,
            s.name as label,
            s.name as value,
            s.color,
            s.sort_order,
            s.active as is_active,
            s.category_id,
            s.created_at,
            s.updated_at
          FROM "${sql.raw(schemaName)}".ticket_subcategories s
          JOIN "${sql.raw(schemaName)}".ticket_categories c ON s.category_id = c.id
          WHERE s.tenant_id = ${tenantId}
          AND s.company_id = ${companyId}
          AND c.name = ${dependsOn}
          AND s.active = true
          ORDER BY s.sort_order, s.name
        `);
        console.log(`🏷️ Subcategories found for category '${dependsOn}': ${result.rows.length} records`);

        // Sincronização automática: garantir que cores existam na ticket_field_options
        for (const row of result.rows) {
          await db.execute(sql`
            INSERT INTO "${sql.raw(schemaName)}".ticket_field_options 
            (tenant_id, company_id, field_name, value, label, color, sort_order, is_active, is_default)
            VALUES (${tenantId}, ${companyId}, 'subcategory', ${row.value}, ${row.label}, ${row.color}, ${row.sort_order || 0}, true, false)
            ON CONFLICT (tenant_id, company_id, field_name, value) 
            DO UPDATE SET color = EXCLUDED.color, label = EXCLUDED.label
          `);
        }
        console.log(`🔄 Auto-synced ${result.rows.length} subcategory colors to ticket_field_options`);
      } else {
        // Retornar array vazio se não há dependência selecionada
        result = { rows: [] };
        console.log(`🏷️ Subcategory: No category selected, returning empty array`);
      }
    } else if (fieldName === 'action') {
      if (dependsOn) {
        // Buscar ações para uma subcategoria específica
        result = await db.execute(sql`
          SELECT 
            a.id,
            a.name as label,
            a.name as value,
            a.color,
            a.sort_order,
            a.active as is_active,
            a.subcategory_id,
            a.created_at,
            a.updated_at
          FROM "${sql.raw(schemaName)}".ticket_actions a
          JOIN "${sql.raw(schemaName)}".ticket_subcategories s ON a.subcategory_id = s.id
          WHERE a.tenant_id = ${tenantId}
          AND a.company_id = ${companyId}
          AND s.name = ${dependsOn}
          AND a.active = true
          ORDER BY a.sort_order, a.name
        `);
        console.log(`🏷️ Actions found for subcategory '${dependsOn}': ${result.rows.length} records`);

        // Sincronização automática: garantir que cores existam na ticket_field_options
        for (const row of result.rows) {
          await db.execute(sql`
            INSERT INTO "${sql.raw(schemaName)}".ticket_field_options 
            (tenant_id, company_id, field_name, value, label, color, sort_order, is_active, is_default)
            VALUES (${tenantId}, ${companyId}, 'action', ${row.value}, ${row.label}, ${row.color}, ${row.sort_order || 0}, true, false)
            ON CONFLICT (tenant_id, company_id, field_name, value) 
            DO UPDATE SET color = EXCLUDED.color, label = EXCLUDED.label
          `);
        }
        console.log(`🔄 Auto-synced ${result.rows.length} action colors to ticket_field_options`);
      } else {
        // Retornar array vazio se não há dependência selecionada
        result = { rows: [] };
        console.log(`🏷️ Action: No subcategory selected, returning empty array`);
      }
    } else {
      // Buscar opções de campos normais (status, priority, impact, urgency)
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
        AND customer_id = ${companyId}
        AND is_active = true
        ${fieldName ? sql`AND field_name = ${fieldName}` : sql``}
        ORDER BY field_name, sort_order, label
      `);
    }

    console.log(`🏢 Field options found: ${result.rows.length} records for ${fieldName || 'all fields'} (hierarchical: ${['category', 'subcategory', 'action'].includes(fieldName)})`);

    if (result.rows.length === 0) {
      console.log(`⚠️ No field options found for ${fieldName || 'any field'} in company ${companyId}`);
    }

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
          INSERT INTO "${sql.raw(schemaName)}"."ticket_action_types" 
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
          FROM "${sql.raw(schemaName)}"."ticket_action_types" a
          JOIN "${sql.raw(schemaName)}"."ticket_subcategories" ss ON a.subcategory_id = ss.id
          JOIN "${sql.raw(schemaName)}"."ticket_categories" sc ON ss.category_id = sc.id
          JOIN "${sql.raw(schemaName)}"."ticket_categories" tc ON sc.name = tc.name 
            AND tc.company_id = ${targetCompanyId} AND tc.tenant_id = ${tenantId}
          JOIN "${sql.raw(schemaName)}"."ticket_subcategories" ts ON ss.name = ts.name 
            AND ts.category_id = tc.id AND ts.tenant_id = ${tenantId}
          WHERE a.tenant_id = ${tenantId} 
          AND sc.company_id = ${sourceCompanyId}
          AND NOT EXISTS (
            SELECT 1 FROM "${sql.raw(schemaName)}"."ticket_action_types" target
            WHERE target.tenant_id = ${tenantId} 
            AND target.subcategory_id = ts.id
            AND target.name = a.name
          )
          RETURNING id
        `);
        copiedItems.actions = actionsResult.rows.length;
      }
    }

    // 4. Copy Field Options - Fixed logic for Default company fallback
    console.log(`🔍 Copying field options from ${sourceCompanyId} to ${targetCompanyId}`);

    // Try to copy from source company first, then fallback to Default company if none found
    let sourceCompanyIdToUse = sourceCompanyId;

    // Check if source company has specific field options
    const sourceOptionsCheck = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM "${sql.raw(schemaName)}"."ticket_field_options"
      WHERE tenant_id = ${tenantId} 
      AND customer_id = ${sourceCompanyId}
    `);

    const sourceHasOptions = Number(sourceOptionsCheck.rows[0]?.count) > 0;

    if (!sourceHasOptions) {
      // Fallback to Default company
      sourceCompanyIdToUse = '00000000-0000-0000-0000-000000000001';
      console.log(`🔄 Source company has no field options, using Default company as source`);
    }

    // Delete existing field options for the target company to avoid conflicts
    const deleteExistingResult = await db.execute(sql`
      DELETE FROM "${sql.raw(schemaName)}"."ticket_field_options"
      WHERE tenant_id = ${tenantId} 
      AND customer_id = ${targetCompanyId}::uuid
    `);
    console.log(`🗑️ Deleted ${deleteExistingResult.rowCount} existing field options for target company`);

    // Now insert the field options with proper company mapping - bypassing unique constraint
    // First get all source field options
    const sourceFieldOptions = await db.execute(sql`
      SELECT * FROM "${sql.raw(schemaName)}"."ticket_field_options" source
      WHERE source.tenant_id = ${tenantId} 
      AND source.customer_id = ${sourceCompanyIdToUse}::uuid
      ORDER BY field_name, sort_order
    `);

    console.log(`🔍 Found ${sourceFieldOptions.rows.length} source field options to copy`);
    console.log(`🔍 Source field options:`, sourceFieldOptions.rows.map(o => `${o.field_name}:${o.value}`));

    let copiedFieldOptionsCount = 0;

    // Insert each field option individually with detailed logging  
    for (const option of sourceFieldOptions.rows) {
      try {
        console.log(`🔄 Copying field option: ${option.field_name}:${option.value} from ${sourceCompanyIdToUse} to ${targetCompanyId}`);

        const insertResult = await db.execute(sql`
          INSERT INTO "${sql.raw(schemaName)}"."ticket_field_options" 
          (id, tenant_id, customer_id, field_name, value, label, color, sort_order, is_default, is_active, status_type, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            ${tenantId},
            ${targetCompanyId}::uuid,
            ${option.field_name},
            ${option.value},
            ${option.label},
            ${option.color},
            ${option.sort_order},
            ${option.is_default},
            ${option.is_active},
            ${option.status_type},
            NOW(),
            NOW()
          )
          ON CONFLICT (tenant_id, customer_id, field_name, value) DO NOTHING
          RETURNING id
        `);

        if (insertResult.rows.length > 0) {
          copiedFieldOptionsCount++;
          console.log(`✅ Successfully copied ${option.field_name}:${option.value}`);
        } else {
          console.log(`⚠️ No rows returned for ${option.field_name}:${option.value}`);
        }
      } catch (error) {
        console.log(`❌ Failed to copy field option ${option.field_name}:${option.value}:`, error.message);
      }
    }

    const fieldOptionsResult = { rows: Array(copiedFieldOptionsCount).fill({}) };
    copiedItems.fieldOptions = fieldOptionsResult.rows.length;
    console.log(`✅ Copied ${copiedItems.fieldOptions} field options from ${sourceCompanyIdToUse} to ${targetCompanyId}`);

    // 5. Copy Numbering Configuration - Fixed logic with fallback
    console.log(`🔍 Copying numbering config from ${sourceCompanyId} to ${targetCompanyId}`);

    // Delete existing numbering config for target company
    await db.execute(sql`
      DELETE FROM "${sql.raw(schemaName)}"."ticket_numbering_config"
      WHERE tenant_id = ${tenantId} AND company_id = ${targetCompanyId}
    `);

    // Try to copy from source company first, then fallback to Default company
    let numberingSourceId = sourceCompanyId;

    const sourceNumberingCheck = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM "${sql.raw(schemaName)}"."ticket_numbering_config"
      WHERE tenant_id = ${tenantId} AND company_id = ${sourceCompanyId}
    `);

    const sourceHasNumbering = Number(sourceNumberingCheck.rows[0]?.count) > 0;

    if (!sourceHasNumbering) {
      // Fallback to Default company
      numberingSourceId = '00000000-0000-0000-0000-000000000001';
      console.log(`🔄 Source company has no numbering config, using Default company as source`);
    }

    const numberingResult = await db.execute(sql`
      INSERT INTO "${sql.raw(schemaName)}"."ticket_numbering_config" 
      (id, tenant_id, company_id, prefix, year_format, sequential_digits, separator, reset_yearly, first_separator, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        tenant_id,
        ${targetCompanyId}::uuid,
        prefix,
        year_format,
        sequential_digits,
        separator,
        reset_yearly,
        first_separator,
        NOW(),
        NOW()
      FROM "${sql.raw(schemaName)}"."ticket_numbering_config"
      WHERE tenant_id = ${tenantId} AND company_id = ${numberingSourceId}::uuid
      RETURNING id
    `);
    copiedItems.numberingConfig = numberingResult.rows.length;
    console.log(`✅ Copied ${copiedItems.numberingConfig} numbering config from ${numberingSourceId} to ${targetCompanyId}`);

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