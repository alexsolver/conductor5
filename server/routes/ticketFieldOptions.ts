
// TICKET FIELD OPTIONS API ENDPOINTS
// Provides dynamic field options for status, priority, category, etc.

import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/jwtAuth';
import { validateTenant } from '../middleware/tenantValidator';

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
router.get('/:fieldName', authenticateToken, validateTenant, async (req: Request, res: Response) => {
  try {
    const { fieldName } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

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
 * GET /api/ticket-field-options
 * Returns all available field options
 */
router.get('/', authenticateToken, validateTenant, async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

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
