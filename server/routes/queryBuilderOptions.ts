import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { getTenantDb } from '../db';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/querybuilder/options
 * Retorna todas as opções dinâmicas para os querybuilders
 * Inclui: canais, status, prioridades, categorias, usuários, grupos, empresas, etc.
 */
router.get('/options', jwtAuth, async (req, res) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Tenant ID não encontrado' 
      });
    }

    const db = await getTenantDb(tenantId);

    // Buscar todos os dados dinâmicos em paralelo
    const [
      channelsResult,
      categoriesResult,
      subcategoriesResult,
      companiesResult,
      usersResult,
      groupsResult,
      queuesResult
    ] = await Promise.all([
      // Canais do OmniBridge
      db.query.omnibridgeChannels?.findMany({
        columns: {
          id: true,
          name: true,
          type: true,
          isEnabled: true
        }
      }).catch(() => []),

      // Categorias
      db.query.ticketCategories?.findMany({
        columns: {
          id: true,
          name: true,
          isActive: true
        }
      }).catch(() => []),

      // Subcategorias
      db.query.ticketSubcategories?.findMany({
        columns: {
          id: true,
          name: true,
          categoryId: true,
          isActive: true
        }
      }).catch(() => []),

      // Empresas
      db.query.companies?.findMany({
        columns: {
          id: true,
          name: true
        }
      }).catch(() => []),

      // Usuários
      db.query.users?.findMany({
        columns: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }).catch(() => []),

      // Grupos de usuários
      db.query.userGroups?.findMany({
        columns: {
          id: true,
          name: true,
          description: true
        }
      }).catch(() => []),

      // Filas de chat
      db.query.queues?.findMany({
        columns: {
          id: true,
          name: true,
          isActive: true
        }
      }).catch(() => [])
    ]);

    // Montar resposta estruturada
    const options = {
      // Campos do OmniBridge
      channelType: (channelsResult || [])
        .filter((ch: any) => ch.isEnabled)
        .map((ch: any) => ({
          value: ch.id,
          label: ch.name,
          type: ch.type
        })),

      // Status de tickets (valores fixos do sistema)
      status: [
        { value: 'new', label: 'Novo' },
        { value: 'open', label: 'Aberto' },
        { value: 'pending', label: 'Pendente' },
        { value: 'in_progress', label: 'Em Progresso' },
        { value: 'on_hold', label: 'Em Espera' },
        { value: 'resolved', label: 'Resolvido' },
        { value: 'closed', label: 'Fechado' },
        { value: 'cancelled', label: 'Cancelado' }
      ],

      // Prioridades
      priority: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' },
        { value: 'critical', label: 'Crítica' }
      ],

      // Impacto
      impact: [
        { value: 'low', label: 'Baixo' },
        { value: 'medium', label: 'Médio' },
        { value: 'high', label: 'Alto' },
        { value: 'critical', label: 'Crítico' }
      ],

      // Urgência
      urgency: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' },
        { value: 'critical', label: 'Crítica' }
      ],

      // Categorias dinâmicas
      category: (categoriesResult || [])
        .filter((cat: any) => cat.isActive !== false)
        .map((cat: any) => ({
          value: cat.id,
          label: cat.name
        })),

      // Subcategorias dinâmicas
      subcategory: (subcategoriesResult || [])
        .filter((sub: any) => sub.isActive !== false)
        .map((sub: any) => ({
          value: sub.id,
          label: sub.name,
          categoryId: sub.categoryId
        })),

      // Empresas dinâmicas
      companyId: (companiesResult || []).map((company: any) => ({
        value: company.id,
        label: company.name
      })),

      // Usuários dinâmicos
      callerId: (usersResult || []).map((user: any) => ({
        value: user.id,
        label: user.name || user.email
      })),

      responsibleId: (usersResult || []).map((user: any) => ({
        value: user.id,
        label: user.name || user.email,
        role: user.role
      })),

      // Grupos dinâmicos
      assignmentGroupId: (groupsResult || []).map((group: any) => ({
        value: group.id,
        label: group.name,
        description: group.description
      })),

      // Filas dinâmicas
      queueId: (queuesResult || [])
        .filter((q: any) => q.isActive !== false)
        .map((q: any) => ({
          value: q.id,
          label: q.name
        })),

      // Tipos de ambiente
      environment: [
        { value: 'production', label: 'Produção' },
        { value: 'staging', label: 'Homologação' },
        { value: 'development', label: 'Desenvolvimento' },
        { value: 'testing', label: 'Testes' }
      ],

      // Tipos de solicitante
      callerType: [
        { value: 'employee', label: 'Funcionário' },
        { value: 'customer', label: 'Cliente' },
        { value: 'partner', label: 'Parceiro' },
        { value: 'vendor', label: 'Fornecedor' }
      ],

      // Tipos de contato
      contactType: [
        { value: 'phone', label: 'Telefone' },
        { value: 'email', label: 'E-mail' },
        { value: 'chat', label: 'Chat' },
        { value: 'portal', label: 'Portal' },
        { value: 'whatsapp', label: 'WhatsApp' }
      ],

      // Tipos de mensagem (OmniBridge)
      messageType: [
        { value: 'inbound', label: 'Entrada' },
        { value: 'outbound', label: 'Saída' }
      ],

      // Tipos de remetente
      senderType: [
        { value: 'customer', label: 'Cliente' },
        { value: 'agent', label: 'Agente' },
        { value: 'system', label: 'Sistema' }
      ],

      // Horário comercial
      businessHours: [
        { value: 'yes', label: 'Sim' },
        { value: 'no', label: 'Não' }
      ],

      // Sentimento (IA)
      sentiment: [
        { value: 'positive', label: 'Positivo' },
        { value: 'negative', label: 'Negativo' },
        { value: 'neutral', label: 'Neutro' }
      ],

      // Intenção (IA)
      intent: [
        { value: 'question', label: 'Pergunta' },
        { value: 'complaint', label: 'Reclamação' },
        { value: 'request', label: 'Solicitação' },
        { value: 'feedback', label: 'Feedback' },
        { value: 'other', label: 'Outro' }
      ],

      // Booleanos
      isRead: [
        { value: 'true', label: 'Sim' },
        { value: 'false', label: 'Não' }
      ],

      attachments: [
        { value: 'true', label: 'Sim' },
        { value: 'false', label: 'Não' }
      ],

      // Idiomas
      language: [
        { value: 'pt', label: 'Português' },
        { value: 'en', label: 'Inglês' },
        { value: 'es', label: 'Espanhol' },
        { value: 'fr', label: 'Francês' },
        { value: 'de', label: 'Alemão' }
      ]
    };

    res.json({
      success: true,
      data: options
    });
  } catch (error: any) {
    console.error('❌ [QUERYBUILDER-OPTIONS] Error fetching options:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar opções do querybuilder'
    });
  }
});

export default router;
