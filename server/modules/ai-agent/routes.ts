import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { aiAgents } from '../../../shared/schema-ai-agent';
import { aiConfigurableActions, aiAgentActionBindings } from '../../../shared/schema-ai-configurable-actions';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Schema para configuração visual do agente
const visualAgentConfigSchema = z.object({
  name: z.string().min(1),
  avatar: z.string(),
  greeting: z.string(),
  farewell: z.string(),
  tone: z.enum(['formal', 'friendly', 'casual']),
  maxTurns: z.number().min(1).max(20),
  confidence: z.number().min(0).max(100),
  escalationKeywords: z.array(z.string()),
  escalationQueue: z.string(),
  autoLearn: z.boolean(),
  uncertainBehavior: z.enum(['ask_again', 'use_widget', 'use_profile']),
  flowIds: z.array(z.string()).optional() // IDs dos fluxos atribuídos ao agente
});

// GET /api/ai-agent/config - Obter configuração do agente
router.get('/config', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Buscar agente padrão do tenant (com tratamento para schema desatualizado)
    let agent;
    try {
      agent = await db.query.aiAgents.findFirst({
        where: eq(aiAgents.tenantId, tenantId)
      });
    } catch (agentError: any) {
      // Se erro de coluna inexistente, tentar criar novo agente
      if (agentError.code === '42703') {
        agent = null; // Forçar criação de novo agente
      } else {
        throw agentError;
      }
    }

    // Se não existe, criar agente padrão
    if (!agent) {
      const [newAgent] = await db.insert(aiAgents).values({
        tenantId,
        name: 'Ana',
        description: 'Agente de IA conversacional',
        status: 'active',
        configPrompt: 'Agente criado via interface visual',
        personality: {
          tone: 'friendly',
          language: 'pt-BR',
          greeting: 'Olá! Como posso ajudar?',
          fallbackMessage: 'Desculpe, não entendi. Pode reformular?',
          confirmationStyle: 'brief',
          avatar: '😊',
          farewell: 'Até breve!'
        },
        enabledActions: [],
        permissions: {},
        behaviorRules: {
          requireConfirmation: [],
          autoEscalateKeywords: ['urgente', 'emergência', 'crítico'],
          maxConversationTurns: 10,
          collectionStrategy: 'adaptive',
          errorHandling: 'escalate',
          escalationQueue: 'support',
          uncertainBehavior: 'ask_again'
        },
        aiConfig: {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'Você é um assistente prestativo e amigável.',
          confidence: 70
        },
        channels: ['email', 'whatsapp', 'telegram', 'chat'],
        learningEnabled: true,
        createdBy: req.user?.id
      }).returning();
      
      agent = newAgent;
    }

    // Mapear para formato visual
    const visualConfig = {
      id: agent.id,
      name: agent.name,
      avatar: agent.personality?.avatar || '😊',
      greeting: agent.personality?.greeting || 'Olá! Como posso ajudar?',
      farewell: agent.personality?.farewell || 'Até breve!',
      tone: agent.personality?.tone || 'friendly',
      maxTurns: agent.behaviorRules?.maxConversationTurns || 10,
      confidence: agent.aiConfig?.confidence || 70,
      escalationKeywords: agent.behaviorRules?.autoEscalateKeywords || ['urgente', 'emergência', 'crítico'],
      escalationQueue: agent.behaviorRules?.escalationQueue || 'support',
      autoLearn: agent.learningEnabled || true,
      uncertainBehavior: agent.behaviorRules?.uncertainBehavior || 'ask_again',
      flowIds: agent.flowIds || [] // IDs dos fluxos atribuídos
    };

    res.json({ success: true, data: visualConfig });
  } catch (error) {
    console.error('Error fetching AI agent config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agent configuration' });
  }
});

// POST /api/ai-agent/config - Salvar configuração do agente
router.post('/config', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const validated = visualAgentConfigSchema.parse(req.body);

    // Buscar agente existente
    const existingAgent = await db.query.aiAgents.findFirst({
      where: eq(aiAgents.tenantId, tenantId)
    });

    const agentData = {
      name: validated.name,
      personality: {
        tone: validated.tone,
        language: 'pt-BR',
        greeting: validated.greeting,
        fallbackMessage: 'Desculpe, não entendi. Pode reformular?',
        confirmationStyle: 'brief',
        avatar: validated.avatar,
        farewell: validated.farewell
      },
      behaviorRules: {
        requireConfirmation: [],
        autoEscalateKeywords: validated.escalationKeywords,
        maxConversationTurns: validated.maxTurns,
        collectionStrategy: 'adaptive' as const,
        errorHandling: 'escalate' as const,
        escalationQueue: validated.escalationQueue,
        uncertainBehavior: validated.uncertainBehavior
      },
      aiConfig: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: `Você é ${validated.name}, um assistente ${
          validated.tone === 'formal' ? 'profissional e cortês' :
          validated.tone === 'friendly' ? 'amigável e prestativo' :
          'descontraído e acessível'
        }.`,
        confidence: validated.confidence
      },
      learningEnabled: validated.autoLearn,
      flowIds: validated.flowIds || [], // Salvar IDs dos fluxos atribuídos
      updatedAt: new Date()
    };

    let agent;
    if (existingAgent) {
      // Atualizar existente
      [agent] = await db.update(aiAgents)
        .set(agentData)
        .where(eq(aiAgents.id, existingAgent.id))
        .returning();
    } else {
      // Criar novo
      [agent] = await db.insert(aiAgents).values({
        ...agentData,
        tenantId,
        description: 'Agente de IA conversacional',
        status: 'active',
        configPrompt: 'Agente criado via interface visual',
        enabledActions: [],
        permissions: {},
        channels: ['email', 'whatsapp', 'telegram', 'chat'],
        createdBy: req.user?.id
      }).returning();
    }

    res.json({ success: true, data: agent });
  } catch (error) {
    console.error('Error saving AI agent config:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Failed to save agent configuration' });
  }
});

// GET /api/ai-agent/available-actions - Listar ações disponíveis
router.get('/available-actions', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Buscar agente (com tratamento para schema desatualizado)
    let agent;
    try {
      agent = await db.query.aiAgents.findFirst({
        where: eq(aiAgents.tenantId, tenantId)
      });
    } catch (agentError: any) {
      // Se erro de coluna inexistente, buscar com SELECT explícito
      if (agentError.code === '42703') {
        const result = await db.select({
          id: aiAgents.id,
          tenantId: aiAgents.tenantId,
          name: aiAgents.name
        }).from(aiAgents).where(eq(aiAgents.tenantId, tenantId)).limit(1);
        agent = result[0];
      } else {
        throw agentError;
      }
    }

    if (!agent) {
      return res.json({ success: true, data: [] });
    }

    // Buscar ações configuráveis
    const actions = await db.query.aiConfigurableActions.findMany({
      where: eq(aiConfigurableActions.tenantId, tenantId)
    });

    // Buscar bindings (quais ações estão ativadas)
    const bindings = await db.query.aiAgentActionBindings.findMany({
      where: eq(aiAgentActionBindings.agentId, agent.id)
    });

    const bindingsMap = new Map(bindings.map((b: any) => [b.actionId, b]));

    // Mapear para formato visual
    const visualActions = actions.map((action: any) => ({
      id: action.id,
      name: action.name,
      description: action.description || '',
      icon: getActionIcon(action.category || 'general'),
      createdBy: 'Admin', // TODO: buscar do createdBy
      usage: action.stats?.totalExecutions || 0,
      enabled: bindingsMap.has(action.id) && (bindingsMap.get(action.id) as any)?.isEnabled,
      category: action.category || 'general'
    }));

    res.json({ success: true, data: visualActions });
  } catch (error) {
    console.error('Error fetching available actions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch actions' });
  }
});

// POST /api/ai-agent/toggle-action - Ativar/desativar ação
router.post('/toggle-action/:actionId', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { actionId } = req.params;
    const { enabled } = req.body;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Buscar agente
    const agent = await db.query.aiAgents.findFirst({
      where: eq(aiAgents.tenantId, tenantId)
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Buscar binding existente
    const existingBinding = await db.query.aiAgentActionBindings.findFirst({
      where: and(
        eq(aiAgentActionBindings.agentId, agent.id),
        eq(aiAgentActionBindings.actionId, actionId)
      )
    });

    if (existingBinding) {
      // Atualizar
      await db.update(aiAgentActionBindings)
        .set({ isEnabled: enabled, updatedAt: new Date() })
        .where(eq(aiAgentActionBindings.id, existingBinding.id));
    } else if (enabled) {
      // Criar novo binding
      await db.insert(aiAgentActionBindings).values({
        agentId: agent.id,
        actionId,
        isEnabled: true,
        priority: 1
      });
    }

    res.json({ success: true, message: 'Action toggled successfully' });
  } catch (error) {
    console.error('Error toggling action:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle action' });
  }
});

// Helper function para mapear categoria para ícone
function getActionIcon(category: string): string {
  const iconMap: Record<string, string> = {
    tickets: '🎫',
    customers: '👤',
    scheduling: '📅',
    billing: '💰',
    notifications: '🔔',
    general: '⚡'
  };
  return iconMap[category] || '⚡';
}

export default router;
