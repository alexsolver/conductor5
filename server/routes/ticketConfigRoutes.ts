import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Response } from 'express'; // Import Response type
import { TenantTemplateService } from '../services/TenantTemplateService'; // Direct import

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
      (id, tenant_id, company_id, category_id, name, description, color, icon, sort_order, created_at, updated_at)
      VALUES (gen_random_uuid(), ${tenantId}, ${tenantId}, ${categoryId}, ${name}, ${description || null}, ${color}, ${icon || null}, ${sortOrder}, NOW(), NOW())
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

    // Update subcategory
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_subcategories" 
      SET 
        name = ${name},
        description = ${description || null},
        category_id = ${categoryId},
        color = ${color || '#3b82f6'},
        icon = ${icon || null},
        active = ${active !== false},
        sort_order = ${sortOrder || 1},
        updated_at = NOW()
      WHERE id = ${subcategoryId} AND tenant_id = ${tenantId}
    `);

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
// COPY STRUCTURE - Copiar estrutura padrão para empresa
// ============================================================================

// POST /api/ticket-config/copy-structure
router.post('/copy-structure', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { companyId } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    console.log(`🔄 Applying default structure to company ${companyId} in tenant ${tenantId}`);

    // Import and apply the default structure
    // const { TenantTemplateService } = await import('../services/TenantTemplateService'); // This line was causing the issue
    await TenantTemplateService.applyDefaultStructureToCompany(tenantId, companyId);

    res.json({
      success: true,
      message: 'Estrutura padrão aplicada com sucesso'
    });
  } catch (error) {
    console.error('Error copying structure:', error);
    res.status(500).json({
      error: 'Failed to copy structure',
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
        id, tenant_id, company_id, subcategory_id, name, description,
        color, icon, active, sort_order, created_at, updated_at
      ) VALUES (
        ${actionId}, ${tenantId}, ${finalCompanyId}, ${subcategoryId}, ${name}, ${description || null}, 
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

    // Update action
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_actions" 
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

// Helper function to get fallback options
function getFallbackFieldOptions(fieldName: string | undefined): Array<{ id: string; field_name: string; value: string; display_label: string; color: string; sort_order: number; is_active: boolean; company_id: string; created_at: string }> {
  const FIELD_OPTIONS = {
    status: [
      { value: 'new', label: 'Novo', color: '#3b82f6' },
      { value: 'open', label: 'Aberto', color: '#f59e0b' },
      { value: 'in_progress', label: 'Em Progresso', color: '#8b5cf6' },
      { value: 'pending', label: 'Pendente', color: '#ef4444' },
      { value: 'resolved', label: 'Resolvido', color: '#10b981' },
      { value: 'closed', label: 'Fechado', color: '#6b7280' }
    ],
    priority: [
      { value: 'low', label: 'Baixa', color: '#10b981' },
      { value: 'medium', label: 'Média', color: '#f59e0b' },
      { value: 'high', label: 'Alta', color: '#ef4444' },
      { value: 'urgent', label: 'Urgente', color: '#dc2626' },
      { value: 'critical', label: 'Crítica', color: '#991b1b' }
    ],
    impact: [
      { value: 'low', label: 'Baixo', color: '#10b981' },
      { value: 'medium', label: 'Médio', color: '#f59e0b' },
      { value: 'high', label: 'Alto', color: '#ef4444' },
      { value: 'critical', color: '#dc2626' }
    ],
    urgency: [
      { value: 'low', label: 'Baixa', color: '#10b981' },
      { value: 'medium', label: 'Média', color: '#f59e0b' },
      { value: 'high', label: 'Alta', color: '#ef4444' },
      { value: 'urgent', label: 'Urgente', color: '#dc2626' }
    ]
  };

  const options = FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS];
  if (!options) return [];

  return options.map((option, index) => ({
    id: `fallback_${fieldName}_${index}`,
    field_name: fieldName || '',
    value: option.value,
    display_label: option.label,
    color: option.color,
    sort_order: index + 1,
    is_active: true,
    company_id: 'fallback', // Indicate it's a fallback
    created_at: new Date().toISOString()
  }));
}


// GET /api/ticket-config/field-options
router.get('/field-options', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const customerId = req.query.companyId as string; // ⚡ ainda vem como companyId, mas é tratado como customerId
    const fieldName = req.query.fieldName as string;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: "User not associated with a tenant" });
    }

    // se não passar, usa o default
    const effectiveCustomerId = customerId || '00000000-0000-0000-0000-000000000001';
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`🔍 Fetching field options for:
      tenantId=${tenantId},
      customerId=${effectiveCustomerId},
      fieldName=${fieldName}
    `);

    // monta condições dinamicamente
    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    where.push(`tenant_id = $${i++}`);
    params.push(tenantId);

    where.push(`is_active = true`);

    if (fieldName) {
      where.push(`field_name = $${i++}`);
      params.push(fieldName);
    }

    if (effectiveCustomerId && effectiveCustomerId !== '00000000-0000-0000-0000-000000000001') {
      where.push(`(customer_id = $${i++} OR customer_id IS NULL)`);
      params.push(effectiveCustomerId);
    } else {
      where.push(`(customer_id IS NULL OR customer_id = '00000000-0000-0000-0000-000000000001')`);
    }

    const result = await db.execute(sql`
      SELECT * 
      FROM ${sql.raw(schemaName)}.ticket_field_options
      WHERE tenant_id = ${tenantId}
        AND is_active = true
        AND (customer_id = ${effectiveCustomerId} OR customer_id IS NULL)
    `);

    console.log(`✅ Found ${result.rows.length} records for field=${fieldName || 'all'} / customer=${effectiveCustomerId}`);

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.json({
      success: true,
      data: result.rows,
      fieldName: fieldName || 'all',
      customerId: effectiveCustomerId,
      tenantId
    });
  } catch (error) {
    console.error('❌ Error fetching field options:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch field options',
      error: error instanceof Error ? error.message : 'Unknown error'
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
// COPY STRUCTURE - Metadados dos campos
// ============================================================================

// POST /api/ticket-config/copy-structure
router.post('/copy-structure', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { companyId } = req.body;

    console.log('🔄 [COPY-STRUCTURE] Starting copy for:', { tenantId, companyId });

    if (!tenantId) {
      return res.status(401).json({ 
        success: false,
        message: 'Tenant required' 
      });
    }

    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        message: 'Company ID required' 
      });
    }

    // Import TenantTemplateService
    // const { TenantTemplateService } = await import('../services/TenantTemplateService'); // This line was causing the issue

    // Apply default structure to the company
    await TenantTemplateService.applyDefaultStructureToCompany(tenantId, companyId);

    console.log('✅ [COPY-STRUCTURE] Structure copied successfully');

    res.json({
      success: true,
      message: 'Estrutura hierárquica copiada com sucesso!',
      data: {
        tenantId,
        companyId,
        templateApplied: 'DEFAULT_COMPANY_TEMPLATE'
      }
    });
  } catch (error) {
    console.error('❌ [COPY-STRUCTURE] Error copying structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to copy structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// FIELD OPTIONS - Metadados dos campos
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
      SELECT 
        id,
        field_name as "fieldName",
        value,
        display_label as "displayLabel", 
        color,
        icon,
        is_default as "isDefault",
        active,
        sort_order as "sortOrder",
        status_type as "statusType"
      FROM "${sql.raw(schemaName)}"."ticket_field_options" 
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

// ============================================================================
// COPY DEFAULT STRUCTURE - Copiar estrutura hierárquica padrão
// ============================================================================

// POST /api/ticket-config/copy-default-structure
router.post('/copy-default-structure', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { companyId } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    console.log('🔄 APPLYING estrutura padrão para empresa:', companyId);

    // Importar o serviço de template
    // const { TenantTemplateService } = await import('../services/TenantTemplateService'); // This line was causing the issue

    // Aplicar a estrutura padrão apenas para esta empresa específica
    await TenantTemplateService.applyDefaultStructureToCompany(tenantId, companyId);

    console.log('✅ Estrutura padrão aplicada com sucesso');

    res.json({
      success: true,
      message: 'Estrutura hierárquica padrão copiada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao copiar estrutura padrão:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to copy default structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// COPY HIERARCHY - Copiar hierarquia de uma empresa para outra
// ============================================================================
// Copy hierarchy from one company to another
router.post('/copy-hierarchy', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sourceCompanyId, targetCompanyId } = req.body;
    const tenantId = req.user?.tenantId;
    const userEmail = req.user?.email;

    // Validate tenant ID exists
    if (!tenantId) {
      console.error('❌ [COPY-HIERARCHY] No tenant ID found in user context');
      return res.status(401).json({
        success: false,
        message: 'Tenant ID not found in user context'
      });
    }

    // Validate input parameters
    if (!sourceCompanyId || !targetCompanyId) {
      console.error('❌ [COPY-HIERARCHY] Missing required parameters');
      return res.status(400).json({
        success: false,
        message: 'sourceCompanyId and targetCompanyId are required'
      });
    }

    // Validate that source and target are different
    if (sourceCompanyId === targetCompanyId) {
      console.error('❌ [COPY-HIERARCHY] Source and target companies are the same');
      return res.status(400).json({
        success: false,
        message: 'Source and target companies must be different'
      });
    }

    // Validate tenant ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error(`❌ [COPY-HIERARCHY] Invalid tenant ID format: ${tenantId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid tenant ID format',
        details: `Received: ${tenantId}`
      });
    }

    console.log(`🔄 [COPY-HIERARCHY] Starting copy process:`, {
      tenantId,
      sourceCompanyId,
      targetCompanyId,
      userFromToken: req.user?.id,
      expectedSchema: `tenant_${tenantId.replace(/-/g, "_")}`
    });

    // Use the TenantTemplateService to copy hierarchy within the same tenant
    const result = await TenantTemplateService.copyHierarchy(tenantId, sourceCompanyId, targetCompanyId);

    console.log('✅ [COPY-HIERARCHY] Hierarchy copied successfully:', result);

    res.json({
      success: true,
      message: 'Hierarchy copied successfully',
      summary: result.summary || `Hierarquia copiada de ${sourceCompanyId} para ${targetCompanyId}`,
      details: result.details
    });

  } catch (error) {
    console.error('❌ [COPY-HIERARCHY] Error copying hierarchy:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to copy hierarchy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;