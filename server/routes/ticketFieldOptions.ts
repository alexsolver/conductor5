import { Request, Response, Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// AuthenticatedRequest interface
interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    role: string;
    permissions: string[];
  };
}

// GET /api/tickets/field-options - Retrieve field options for dynamic components
router.get('/field-options', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🎨 [Field Options] Getting field options for tenant:', req.user.tenantId);

    // Standard field options following business rules
    const fieldOptions = {
      status: [
        { value: 'new', label: 'Novo', color: '#3b82f6', icon: '🆕' },
        { value: 'open', label: 'Aberto', color: '#10b981', icon: '📂' },
        { value: 'in_progress', label: 'Em Progresso', color: '#f59e0b', icon: '⚡' },
        { value: 'resolved', label: 'Resolvido', color: '#8b5cf6', icon: '✅' },
        { value: 'closed', label: 'Fechado', color: '#6b7280', icon: '🔒' },
        { value: 'cancelled', label: 'Cancelado', color: '#ef4444', icon: '❌' }
      ],
      priority: [
        { value: 'low', label: 'Baixa', color: '#10b981', icon: '🟢' },
        { value: 'medium', label: 'Média', color: '#f59e0b', icon: '🟡' },
        { value: 'high', label: 'Alta', color: '#ef4444', icon: '🔴' },
        { value: 'critical', label: 'Crítica', color: '#dc2626', icon: '🚨' }
      ],
      urgency: [
        { value: 'low', label: 'Baixa', color: '#10b981', icon: '🟢' },
        { value: 'medium', label: 'Média', color: '#f59e0b', icon: '🟡' },
        { value: 'high', label: 'Alta', color: '#ef4444', icon: '🔴' },
        { value: 'critical', label: 'Crítica', color: '#dc2626', icon: '🚨' }
      ],
      category: [
        { value: 'suporte_tecnico', label: 'Suporte Técnico', color: '#3b82f6', icon: '🛠️' },
        { value: 'infraestrutura', label: 'Infraestrutura', color: '#8b5cf6', icon: '🏗️' },
        { value: 'financeiro', label: 'Financeiro', color: '#10b981', icon: '💰' },
        { value: 'atendimento_cliente', label: 'Atendimento', color: '#f59e0b', icon: '📞' },
        { value: 'hardware', label: 'Hardware', color: '#6b7280', icon: '🖥️' },
        { value: 'software', label: 'Software', color: '#ec4899', icon: '💻' }
      ],
      impact: [
        { value: 'low', label: 'Baixo', color: '#10b981', icon: '🟢' },
        { value: 'medium', label: 'Médio', color: '#f59e0b', icon: '🟡' },
        { value: 'high', label: 'Alto', color: '#ef4444', icon: '🔴' },
        { value: 'critical', label: 'Crítico', color: '#dc2626', icon: '🚨' }
      ]
    };

    res.json({
      success: true,
      data: fieldOptions,
      meta: {
        tenant: req.user.tenantId,
        timestamp: new Date().toISOString(),
        cached: true
      }
    });

  } catch (error: any) {
    console.error('❌ [Field Options] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve field options',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;