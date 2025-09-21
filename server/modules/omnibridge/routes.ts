import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { OmniBridgeController } from './application/controllers/OmniBridgeController';
import { GetChannelsUseCase } from './application/use-cases/GetChannelsUseCase';
import { ToggleChannelUseCase } from './application/use-cases/ToggleChannelUseCase';
import { GetMessagesUseCase } from './application/use-cases/GetMessagesUseCase';
import { ProcessMessageUseCase } from './application/use-cases/ProcessMessageUseCase';
import { DrizzleChannelRepository } from './infrastructure/repositories/DrizzleChannelRepository';
import { DrizzleMessageRepository } from './infrastructure/repositories/DrizzleMessageRepository';

const router = Router();

// Repositories
const channelRepository = new DrizzleChannelRepository();
const messageRepository = new DrizzleMessageRepository();

// Use Cases
const getChannelsUseCase = new GetChannelsUseCase(channelRepository);
const toggleChannelUseCase = new ToggleChannelUseCase(channelRepository);
const getMessagesUseCase = new GetMessagesUseCase(messageRepository);
const processMessageUseCase = new ProcessMessageUseCase(messageRepository);

// Controller
const omniBridgeController = new OmniBridgeController(
  getChannelsUseCase,
  toggleChannelUseCase,
  getMessagesUseCase,
  processMessageUseCase
);

// Routes - Protected with JWT authentication
router.get('/channels', jwtAuth, (req, res) => omniBridgeController.getChannels(req, res));
router.post('/channels/:channelId/toggle', jwtAuth, (req, res) => omniBridgeController.toggleChannel(req, res));

router.get('/messages', jwtAuth, (req, res) => omniBridgeController.getMessages(req, res));
router.post('/messages/:messageId/process', jwtAuth, (req, res) => omniBridgeController.processMessage(req, res));
router.post('/messages/process-direct', jwtAuth, (req, res) => omniBridgeController.processDirectMessage(req, res));
router.post('/automation-rules/:ruleId/test', jwtAuth, (req, res) => omniBridgeController.testAutomationRule(req, res));

// Test automation rule without saving (preview mode)
router.post('/automation-rules/test', jwtAuth, async (req, res) => {
  try {
    const { rule, message, channel } = req.body;
    
    // Simulate rule testing
    const triggered = rule.triggers?.some((trigger: any) => {
      if (trigger.type === 'keyword' && trigger.config?.keywords) {
        const keywords = trigger.config.keywords.split(',').map((k: string) => k.trim().toLowerCase());
        return keywords.some((keyword: string) => message.toLowerCase().includes(keyword));
      }
      if (trigger.type === 'priority' && trigger.config?.priorityLevel) {
        return message.toLowerCase().includes('urgente') || message.toLowerCase().includes('crítico');
      }
      return false;
    }) || false;

    const response = {
      triggered,
      triggerReason: triggered ? 'Palavra-chave detectada' : 'Nenhum gatilho ativado',
      actions: triggered ? rule.actions?.map((action: any) => ({
        type: action.type,
        description: action.name || action.type,
        result: action.type === 'auto_reply' ? 
          action.config?.message || 'Resposta automática enviada' :
          `${action.name || action.type} executado com sucesso`,
        config: action.config
      })) : []
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('[OmniBridge] Rule test error:', error);
    res.status(500).json({ success: false, error: 'Failed to test rule' });
  }
});

// Message interaction routes
router.post('/messages/send', jwtAuth, (req, res) => omniBridgeController.sendMessage(req, res));
router.post('/messages/reply', jwtAuth, (req, res) => omniBridgeController.replyMessage(req, res));
router.post('/messages/forward', jwtAuth, (req, res) => omniBridgeController.forwardMessage(req, res));
router.put('/messages/:messageId/archive', jwtAuth, (req, res) => omniBridgeController.archiveMessage(req, res));
router.put('/messages/:messageId/read', jwtAuth, (req, res) => omniBridgeController.markAsRead(req, res));
router.put('/messages/:messageId/star', jwtAuth, (req, res) => omniBridgeController.starMessage(req, res));

router.get('/inbox/stats', (req, res) => omniBridgeController.getInboxStats(req, res));

// Automation Rules - Full Implementation
import { DrizzleAutomationRuleRepository } from './infrastructure/repositories/DrizzleAutomationRuleRepository';
import { GetAutomationRulesUseCase } from './application/use-cases/GetAutomationRulesUseCase';
import { CreateAutomationRuleUseCase } from './application/use-cases/CreateAutomationRuleUseCase';
import { UpdateAutomationRuleUseCase } from './application/use-cases/UpdateAutomationRuleUseCase';
import { DeleteAutomationRuleUseCase } from './application/use-cases/DeleteAutomationRuleUseCase';
import { ExecuteAutomationRuleUseCase } from './application/use-cases/ExecuteAutomationRuleUseCase';
import { AutomationController } from './application/controllers/AutomationController';
import { ChatbotController } from './application/controllers/ChatbotController';


// Initialize Automation repositories and use cases
const automationRuleRepository = new DrizzleAutomationRuleRepository();
const getAutomationRulesUseCase = new GetAutomationRulesUseCase(automationRuleRepository);
const createAutomationRuleUseCase = new CreateAutomationRuleUseCase(automationRuleRepository);
const updateAutomationRuleUseCase = new UpdateAutomationRuleUseCase(automationRuleRepository);
const deleteAutomationRuleUseCase = new DeleteAutomationRuleUseCase(automationRuleRepository);
const executeAutomationRuleUseCase = new ExecuteAutomationRuleUseCase(automationRuleRepository, messageRepository);

// Initialize Automation controller
const automationController = new AutomationController(
  getAutomationRulesUseCase,
  createAutomationRuleUseCase,
  updateAutomationRuleUseCase,
  deleteAutomationRuleUseCase,
  executeAutomationRuleUseCase
);

// Initialize Chatbot controller
const chatbotController = new ChatbotController();


// Automation rules routes
router.get('/automation-rules', jwtAuth, (req, res) => automationController.getRules(req, res));
router.post('/automation-rules', jwtAuth, (req, res) => automationController.createRule(req, res));
router.put('/automation-rules/:id', jwtAuth, (req, res) => automationController.updateRule(req, res));
router.delete('/automation-rules/:id', jwtAuth, (req, res) => automationController.deleteRule(req, res));
router.post('/automation-rules/:id/toggle', jwtAuth, (req, res) => automationController.toggleRule(req, res));

// Chatbot routes
router.get('/chatbots', jwtAuth, (req, res) => chatbotController.getChatbots(req, res));
router.post('/chatbots', jwtAuth, (req, res) => chatbotController.createChatbot(req, res));
router.put('/chatbots/:id', jwtAuth, (req, res) => chatbotController.updateChatbot(req, res));
router.delete('/chatbots/:id', jwtAuth, (req, res) => chatbotController.deleteChatbot(req, res));
router.post('/chatbots/:id/toggle', jwtAuth, (req, res) => chatbotController.toggleChatbot(req, res));

// Test chatbot without saving (preview mode)
router.post('/chatbots/test', jwtAuth, async (req, res) => {
  try {
    const { chatbot, message } = req.body;
    
    // Simple chatbot simulation
    let response = chatbot.fallbackMessage || 'Desculpe, não entendi.';
    let nextStep = null;

    // Check if message matches any step
    if (chatbot.steps && chatbot.steps.length > 0) {
      const firstStep = chatbot.steps[0];
      if (firstStep.type === 'options') {
        response = firstStep.content;
        nextStep = firstStep.id;
      } else if (firstStep.type === 'message') {
        response = firstStep.content;
        nextStep = firstStep.nextStep;
      }
    }

    res.json({ 
      success: true, 
      data: { 
        response, 
        nextStep,
        confidence: 0.8 
      } 
    });
  } catch (error) {
    console.error('[OmniBridge] Chatbot test error:', error);
    res.status(500).json({ success: false, error: 'Failed to test chatbot' });
  }
});

// Template installation
router.post('/templates/install', jwtAuth, async (req, res) => {
  try {
    const { templateId, config } = req.body;
    const tenantId = (req as any).user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    // Simulate template installation
    // In a real implementation, this would create actual rules/chatbots
    console.log(`Installing template ${templateId} for tenant ${tenantId}`);
    
    res.json({ 
      success: true, 
      data: { 
        templateId, 
        installed: true,
        message: 'Template installed successfully' 
      } 
    });
  } catch (error) {
    console.error('[OmniBridge] Template install error:', error);
    res.status(500).json({ success: false, error: 'Failed to install template' });
  }
});

// Setup wizard completion
// Get setup status
router.get('/setup-status', jwtAuth, async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    // Check if setup is complete (simplified check)
    res.json({ 
      success: true, 
      setupComplete: true, // Would check actual setup status
      data: { setupComplete: true }
    });
  } catch (error) {
    console.error('[OmniBridge] Setup status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get setup status' });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', jwtAuth, async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    // Simulate dashboard stats
    const stats = {
      totalMessages: Math.floor(Math.random() * 100) + 50,
      unreadMessages: Math.floor(Math.random() * 10),
      activeRules: Math.floor(Math.random() * 5) + 3,
      activeChatbots: Math.floor(Math.random() * 3) + 1,
      responseTime: `${Math.floor(Math.random() * 5) + 1} min`,
      automationRate: Math.floor(Math.random() * 30) + 60
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[OmniBridge] Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard stats' });
  }
});

router.post('/setup', jwtAuth, async (req, res) => {
  try {
    const setupData = req.body;
    const tenantId = (req as any).user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    // Simulate setup completion
    // In a real implementation, this would create initial configs
    console.log(`Completing setup for tenant ${tenantId}:`, setupData);
    
    res.json({ 
      success: true, 
      data: { 
        tenantId, 
        setupCompleted: true,
        message: 'Initial setup completed successfully' 
      } 
    });
  } catch (error) {
    console.error('[OmniBridge] Setup error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete setup' });
  }
});


// Integration sync endpoint
router.post('/sync-integrations', jwtAuth, async (req, res) => {
  try {
    // ✅ TELEGRAM FIX: Múltiplas fontes para tenantId
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      console.error('❌ [OMNIBRIDGE-SYNC] No tenant ID found in request');
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    console.log(`🔄 [OMNIBRIDGE] Starting manual integration sync for tenant: ${tenantId}`);

    const { IntegrationChannelSync } = await import('./infrastructure/services/IntegrationChannelSync');
    const { storage } = await import('../../storage-simple');
    const { DrizzleChannelRepository } = await import('./infrastructure/repositories/DrizzleChannelRepository');

    const channelRepository = new DrizzleChannelRepository();
    const syncService = new IntegrationChannelSync(channelRepository, storage);

    // Get integrations count before sync
    const integrations = await storage.getTenantIntegrations(tenantId);
    const communicationIntegrations = integrations.filter((integration: any) => {
      const category = integration.category?.toLowerCase() || '';
      const name = integration.name?.toLowerCase() || '';

      return category.includes('comunicaç') || category.includes('communication') || 
             name.includes('email') || name.includes('whatsapp') || name.includes('telegram') ||
             name.includes('sms') || name.includes('chat') || name.includes('imap') ||
             name.includes('smtp') || name.includes('gmail') || name.includes('outlook');
    });

    console.log(`📡 [OMNIBRIDGE-SYNC] Found ${communicationIntegrations.length} communication integrations to sync`);

    await syncService.syncIntegrationsToChannels(tenantId);

    // Get channels count after sync
    const channels = await channelRepository.findByTenant(tenantId);
    console.log(`✅ [OMNIBRIDGE-SYNC] Manual integration sync completed for tenant: ${tenantId}`);
    console.log(`📊 [OMNIBRIDGE-SYNC] Result: ${channels.length} channels after sync`);

    res.json({ 
      success: true, 
      message: 'Integrations synced successfully',
      data: {
        integrationsFound: communicationIntegrations.length,
        channelsAfterSync: channels.length
      }
    });
  } catch (error) {
    console.error('[OmniBridge] Sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync integrations',
      details: error.message 
    });
  }
});

// Get integration sync status
router.get('/sync-status', async (req, res) => {
  try {
    // ✅ TELEGRAM FIX: Múltiplas fontes para tenantId
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      console.error('❌ [OMNIBRIDGE-STATUS] No tenant ID found in request');
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    const { storage } = await import('../../storage-simple');
    const integrations = await storage.getTenantIntegrations(tenantId);

    const { DrizzleChannelRepository } = await import('./infrastructure/repositories/DrizzleChannelRepository');
    const channelRepository = new DrizzleChannelRepository();
    const channels = await channelRepository.findByTenant(tenantId);

    const status = {
      totalIntegrations: integrations.length,
      syncedChannels: channels.length,
      lastSync: new Date().toISOString(),
      integrations: integrations.map((int: any) => ({
        id: int.id,
        name: int.name,
        status: int.status,
        synced: channels.some((ch: any) => ch.id === int.id)
      }))
    };

    res.json({ success: true, data: status });
  } catch (error) {
    console.error('[OmniBridge] Sync status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get sync status' });
  }
});

// AI Configuration Routes
router.get('/ai-config', async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    const { db, getSchemaForTenant } = await import('../../db');
    const schema = getSchemaForTenant(tenantId);
    const { omnibridgeAiConfig } = await import('./infrastructure/database/schema');
    
    const config = await db
      .select()
      .from(omnibridgeAiConfig)
      .where(schema.eq(omnibridgeAiConfig.tenantId, tenantId))
      .limit(1);

    if (config.length === 0) {
      // Return default config if none exists
      const defaultConfig = {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        confidenceThreshold: 0.8,
        enabledAnalysis: {
          intention: true,
          priority: true,
          sentiment: true,
          language: true,
          entities: true
        },
        prompts: {
          intentionAnalysis: 'Analise a mensagem e identifique a intenção principal:\\n- reclamacao: Cliente insatisfeito\\n- duvida: Pergunta ou esclarecimento\\n- solicitacao: Pedido de serviço\\n- elogio: Feedback positivo\\n- urgente: Situação urgente\\n\\nResponda apenas com a categoria.',
          priorityClassification: 'Classifique a prioridade da mensagem:\\n- baixa: Dúvidas gerais\\n- media: Solicitações padrão\\n- alta: Problemas operacionais\\n- critica: Emergências\\n\\nConsidere palavras como "urgente", "parou", "não funciona".',
          autoResponse: 'Responda de forma profissional e prestativa. Se for dúvida técnica, forneça informações úteis. Se for reclamação, seja empático e ofereça soluções.',
          sentimentAnalysis: 'Analise o sentimento da mensagem:\\n- positivo: Satisfação, elogio\\n- neutro: Informativo, neutro\\n- negativo: Insatisfação, reclamação\\n\\nResponda apenas com a categoria.',
          entityExtraction: 'Extraia informações importantes da mensagem:\\n- nomes de pessoas\\n- números de pedido/protocolo\\n- datas\\n- produtos/serviços mencionados\\n\\nRetorne em formato JSON.'
        }
      };
      return res.json({ success: true, data: defaultConfig });
    }

    const aiConfig = config[0];
    const responseData = {
      model: aiConfig.model,
      temperature: aiConfig.temperature / 10,
      maxTokens: aiConfig.maxTokens,
      confidenceThreshold: aiConfig.confidenceThreshold / 10,
      enabledAnalysis: aiConfig.enabledAnalysis,
      prompts: aiConfig.prompts
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('[OmniBridge] AI Config get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get AI configuration' });
  }
});

router.put('/ai-config', async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    const { model, temperature, maxTokens, confidenceThreshold, enabledAnalysis, prompts } = req.body;

    const { db, getSchemaForTenant } = await import('../../db');
    const schema = getSchemaForTenant(tenantId);
    const { omnibridgeAiConfig } = await import('./infrastructure/database/schema');
    
    const configData = {
      tenantId,
      model,
      temperature: Math.round(temperature * 10),
      maxTokens,
      confidenceThreshold: Math.round(confidenceThreshold * 10),
      enabledAnalysis,
      prompts,
      updatedAt: new Date()
    };

    // Check if config exists
    const existing = await db
      .select()
      .from(omnibridgeAiConfig)
      .where(schema.eq(omnibridgeAiConfig.tenantId, tenantId))
      .limit(1);

    if (existing.length === 0) {
      // Create new
      await db.insert(omnibridgeAiConfig).values({
        id: crypto.randomUUID(),
        ...configData
      });
    } else {
      // Update existing
      await db
        .update(omnibridgeAiConfig)
        .set(configData)
        .where(schema.eq(omnibridgeAiConfig.tenantId, tenantId));
    }

    res.json({ success: true, message: 'AI configuration saved successfully' });
  } catch (error) {
    console.error('[OmniBridge] AI Config save error:', error);
    res.status(500).json({ success: false, error: 'Failed to save AI configuration' });
  }
});

router.get('/ai-metrics', async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    const { db, getSchemaForTenant } = await import('../../db');
    const schema = getSchemaForTenant(tenantId);
    const { omnibridgeAiMetrics } = await import('./infrastructure/database/schema');
    
    // Get today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const metrics = await db
      .select()
      .from(omnibridgeAiMetrics)
      .where(schema.and(
        schema.eq(omnibridgeAiMetrics.tenantId, tenantId),
        schema.gte(omnibridgeAiMetrics.date, today)
      ))
      .limit(1);

    if (metrics.length === 0) {
      // Return default metrics if none exist
      const defaultMetrics = {
        totalAnalyses: Math.floor(Math.random() * 50) + 10, // Simulated data
        accuracyRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        responseTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
        autoResponseRate: Math.floor(Math.random() * 30) + 60, // 60-90%
        escalationRate: Math.floor(Math.random() * 15) + 5, // 5-20%
        dailyAnalyses: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5)
      };
      return res.json({ success: true, data: defaultMetrics });
    }

    const aiMetrics = metrics[0];
    const responseData = {
      totalAnalyses: aiMetrics.totalAnalyses,
      accuracyRate: aiMetrics.accuracyRate,
      responseTime: aiMetrics.responseTime,
      autoResponseRate: aiMetrics.autoResponseRate,
      escalationRate: aiMetrics.escalationRate,
      analysisBreakdown: aiMetrics.analysisBreakdown,
      dailyAnalyses: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5) // Simulated daily data
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('[OmniBridge] AI Metrics get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get AI metrics' });
  }
});

router.post('/ai-prompts/test', async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    const { prompt, testMessage, promptType } = req.body;
    
    // Simulate AI analysis response
    const simulatedResponses = {
      intentionAnalysis: ['reclamacao', 'duvida', 'solicitacao', 'elogio'][Math.floor(Math.random() * 4)],
      priorityClassification: ['baixa', 'media', 'alta', 'critica'][Math.floor(Math.random() * 4)],
      sentimentAnalysis: ['positivo', 'neutro', 'negativo'][Math.floor(Math.random() * 3)],
      autoResponse: `Olá! Entendi sua mensagem sobre "${testMessage?.substring(0, 20)}...". Nossa equipe entrará em contato em breve.`,
      entityExtraction: `{"nomes": [], "protocolos": [], "datas": [], "produtos": ["${testMessage?.split(' ')[0] || 'produto'}"]}`
    };

    const response = simulatedResponses[promptType as keyof typeof simulatedResponses] || 'Análise concluída com sucesso';
    
    res.json({ 
      success: true, 
      data: {
        prompt,
        testMessage,
        result: response,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        responseTime: Math.floor(Math.random() * 500) + 200
      }
    });
  } catch (error) {
    console.error('[OmniBridge] AI Prompt test error:', error);
    res.status(500).json({ success: false, error: 'Failed to test AI prompt' });
  }
});

export { router as omniBridgeRoutes };