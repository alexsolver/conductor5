// TICKET FIELD OPTIONS API ENDPOINTS
// Provides dynamic field options for status, priority, category, etc.

import { Router } from 'express';
import { Request, Response } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
// Assuming 'pool' is imported from a database connection module
// import pool from '../db'; // Example import, adjust as necessary

const router = Router();

// Field options data - can be moved to database later
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
  category: [
    { value: 'hardware', label: 'Hardware', color: '#6366f1' },
    { value: 'software', label: 'Software', color: '#8b5cf6' },
    { value: 'network', label: 'Rede', color: '#06b6d4' },
    { value: 'security', label: 'Segurança', color: '#ef4444' },
    { value: 'access', label: 'Acesso', color: '#f59e0b' },
    { value: 'maintenance', label: 'Manutenção', color: '#10b981' },
    { value: 'training', label: 'Treinamento', color: '#84cc16' },
    { value: 'other', label: 'Outros', color: '#6b7280' }
  ],
  impact: [
    { value: 'low', label: 'Baixo', color: '#10b981' },
    { value: 'medium', label: 'Médio', color: '#f59e0b' },
    { value: 'high', label: 'Alto', color: '#ef4444' },
    { value: 'critical', label: 'Crítico', color: '#dc2626' }
  ],
  urgency: [
    { value: 'low', label: 'Baixa', color: '#10b981' },
    { value: 'medium', label: 'Média', color: '#f59e0b' },
    { value: 'high', label: 'Alta', color: '#ef4444' },
    { value: 'urgent', label: 'Urgente', color: '#dc2626' }
  ]
};

/**
 * GET /api/ticket-field-options/:fieldName
 * Returns field options for dynamic selects
 */
router.get('/:fieldName', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fieldName } = req.params;
    const tenantId = req.user?.tenantId;

    console.log(`🔍 Fetching field options for: ${fieldName}, tenant: ${tenantId}`);

    // Get options for the specified field
    const options = FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS];

    if (!options) {
      console.log(`❌ Field options not found for: ${fieldName}`);
      return res.status(404).json({
        success: false,
        message: `Field options not found for: ${fieldName}`,
        options: []
      });
    }

    console.log(`✅ Field options found for ${fieldName}:`, {
      totalOptions: options.length,
      fieldOptions: options
    });

    res.json({
      success: true,
      message: `Field options for ${fieldName}`,
      options: options
    });

  } catch (error) {
    console.error('❌ Error fetching field options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field options',
      error: error.message,
      options: []
    });
  }
});

/**
 * GET /api/ticket-config/field-options
 * Get field options with hierarchical customer support
 */
router.get('/field-options', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { fieldName, customerId, dependsOn } = req.query;

    console.log(`🔍 Fetching field options for ${fieldName}:`, {
      tenantId,
      customerId,
      fieldName,
      dependsOn
    });

    // Usar a empresa padrão se nenhuma for especificada
    const effectiveCustomerId = customerId || '00000000-0000-0000-0000-000000000001';
    const effectiveCompanyId = effectiveCustomerId; // Alias for clarity in queries

    console.log(`🎯 ${customerId ? 'Company specific' : 'No company selected'}, using ${effectiveCustomerId === '00000000-0000-0000-0000-000000000001' ? 'Default' : 'Selected'} company for field options`);

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    let query = '';
    let queryParams: any[] = [];

    // Para campos hierárquicos (categoria → subcategoria → ação)
    if (fieldName === 'subcategory' && dependsOn) {
      // Buscar subcategorias baseadas na categoria selecionada
      query = `
        SELECT 
          tso.id,
          tso.field_name,
          tso.option_value as value,
          tso.display_label as label,
          tso.color_hex,
          tso.icon_name,
          tso.sort_order,
          tso.is_default,
          tso.company_id,
          tso.created_at
        FROM ${schemaName}.ticket_field_options tso
        INNER JOIN ${schemaName}.ticket_subcategories ts ON ts.code = tso.option_value
        INNER JOIN ${schemaName}.ticket_categories tc ON tc.id = ts.category_id
        WHERE tso.tenant_id = $1 
        AND tso.company_id = $2 
        AND tso.field_name = $3 
        AND tc.code = $4
        AND tso.is_active = true
        ORDER BY tso.sort_order ASC, tso.display_label ASC
      `;
      queryParams = [tenantId, effectiveCompanyId, fieldName, dependsOn];
    } else if (fieldName === 'action' && dependsOn) {
      // Buscar ações baseadas na subcategoria selecionada
      query = `
        SELECT 
          tso.id,
          tso.field_name,
          tso.option_value as value,
          tso.display_label as label,
          tso.color_hex,
          tso.icon_name,
          tso.sort_order,
          tso.is_default,
          tso.company_id,
          tso.created_at
        FROM ${schemaName}.ticket_field_options tso
        INNER JOIN ${schemaName}.ticket_actions ta ON ta.code = tso.option_value
        INNER JOIN ${schemaName}.ticket_subcategories ts ON ts.id = ta.subcategory_id
        WHERE tso.tenant_id = $1 
        AND tso.company_id = $2 
        AND tso.field_name = $3 
        AND ts.code = $4
        AND tso.is_active = true
        ORDER BY tso.sort_order ASC, tso.display_label ASC
      `;
      queryParams = [tenantId, effectiveCompanyId, fieldName, dependsOn];
    } else {
      // Query padrão para campos não hierárquicos ou categoria (nível raiz)
      query = `
        SELECT 
          id,
          field_name,
          option_value as value,
          display_label as label,
          color_hex,
          icon_name,
          sort_order,
          is_default,
          company_id,
          created_at
        FROM ${schemaName}.ticket_field_options 
        WHERE tenant_id = $1 
        AND company_id = $2 
        AND field_name = $3 
        AND is_active = true
        ORDER BY sort_order ASC, display_label ASC
      `;
      queryParams = [tenantId, effectiveCompanyId, fieldName];
    }

    // Assuming 'pool' is available in this scope and is a valid database connection pool object
    // Replace this with your actual pool query logic
    const result = { rows: [] }; // Placeholder for actual query result
    console.log('Executing query:', query);
    console.log('With params:', queryParams);
    // const result = await pool.query(query, queryParams);


    console.log(`🔍 Field options query result for company: ${effectiveCompanyId}`, {
      totalRows: result.rows.length,
      hierarchical: !!dependsOn,
      dependsOn,
      byFieldName: result.rows.reduce((acc: any, row: any) => {
        acc[row.field_name] = (acc[row.field_name] || 0) + 1;
        return acc;
      }, {}),
      statusRows: fieldName === 'status' ? result.rows : undefined
    });

    res.json({
      success: true,
      data: result.rows,
      fieldName,
      companyId: effectiveCompanyId, // Changed from customerId to companyId for consistency
      tenantId,
      dependsOn
    });
  } catch (error) {
    console.error('Error fetching field options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch field options',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ticket-field-options/all
 * Returns all available field options
 */
router.get('/', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    console.log(`🔍 Fetching all field options for tenant: ${tenantId}`);

    res.json({
      success: true,
      message: 'All field options',
      data: FIELD_OPTIONS
    });

  } catch (error) {
    console.error('❌ Error fetching all field options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field options',
      error: error.message
    });
  }
});

export default router;