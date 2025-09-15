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
    const { fieldName, companyId } = req.query;

    console.log(`🔍 Fetching field options for ${fieldName}:`, {
      tenantId,
      companyId,
      fieldName
    });

    // Import db connection
    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');

    // Use default company if none specified
    const effectiveCompanyId = companyId || '00000000-0000-0000-0000-000000000001';
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`🎯 Using company ${effectiveCompanyId} for field options`);

    // Try to get from ticket_field_options table first
    try {
      const result = await db.execute(sql.raw(`
        SELECT 
          id,
          field_name,
          value as option_value,
          label as display_label,
          color as color_hex,
          sort_order,
          is_active,
          company_id,
          created_at
        FROM "${schemaName}".ticket_field_options 
        WHERE tenant_id = $1
        AND company_id = $2 
        AND field_name = $3
        AND is_active = true
        ORDER BY sort_order ASC, label ASC
      `, [tenantId, effectiveCompanyId, fieldName || 'status']));

      if (result.rows.length > 0) {
        console.log(`✅ Found ${result.rows.length} field options in database`);
        return res.json({
          success: true,
          data: result.rows,
          fieldName,
          companyId: effectiveCompanyId,
          tenantId
        });
      }
    } catch (dbError) {
      console.log('⚠️ ticket_field_options table not found, using fallback:', dbError.message);
    }

    // Fallback to mock data if no database records found
    console.log('🔄 Using fallback field options data');
    
    const fallbackOptions = FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS] || FIELD_OPTIONS.status;
    
    // Transform mock data to match expected format
    const transformedOptions = fallbackOptions.map((option, index) => ({
      id: `mock_${index}`,
      field_name: fieldName || 'status',
      option_value: option.value,
      display_label: option.label,
      color_hex: option.color,
      sort_order: index + 1,
      is_active: true,
      company_id: effectiveCompanyId,
      created_at: new Date().toISOString()
    }));

    console.log(`🏢 Field options found: ${transformedOptions.length} records for ${fieldName}`);

    res.json({
      success: true,
      data: transformedOptions,
      fieldName,
      companyId: effectiveCompanyId,
      tenantId,
      source: 'fallback'
    });
  } catch (error) {
    console.error('❌ Error fetching field options:', error);
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