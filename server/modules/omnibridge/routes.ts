import { Router } from 'express';
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

// Routes
router.get('/channels', (req, res) => omniBridgeController.getChannels(req, res));
router.post('/channels/:channelId/toggle', (req, res) => omniBridgeController.toggleChannel(req, res));

router.get('/messages', (req, res) => omniBridgeController.getMessages(req, res));
router.post('/messages/:messageId/process', (req, res) => omniBridgeController.processMessage(req, res));
router.post('/messages/process-direct', (req, res) => omniBridgeController.processDirectMessage(req, res));
router.post('/automation-rules/:ruleId/test', (req, res) => omniBridgeController.testAutomationRule(req, res));

// Message interaction routes
router.post('/messages/send', (req, res) => omniBridgeController.sendMessage(req, res));
router.post('/messages/reply', (req, res) => omniBridgeController.replyMessage(req, res));
router.post('/messages/forward', (req, res) => omniBridgeController.forwardMessage(req, res));
router.put('/messages/:messageId/archive', (req, res) => omniBridgeController.archiveMessage(req, res));
router.put('/messages/:messageId/read', (req, res) => omniBridgeController.markAsRead(req, res));
router.put('/messages/:messageId/star', (req, res) => omniBridgeController.starMessage(req, res));

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
import { jwtAuth } from '../../middleware/jwtAuth';

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
router.get('/automation-rules', jwtAuth, (req, res) => automationController.getAutomationRules(req, res));
router.post('/automation-rules', jwtAuth, (req, res) => automationController.createAutomationRule(req, res));
router.put('/automation-rules/:id', jwtAuth, (req, res) => automationController.updateAutomationRule(req, res));
router.delete('/automation-rules/:id', jwtAuth, (req, res) => automationController.deleteAutomationRule(req, res));
router.post('/automation-rules/:id/toggle', jwtAuth, (req, res) => automationController.toggleRule(req, res));

// Chatbot routes
router.get('/chatbots', jwtAuth, (req, res) => chatbotController.getChatbots(req, res));
router.post('/chatbots', jwtAuth, (req, res) => chatbotController.createChatbot(req, res));
router.put('/chatbots/:id', jwtAuth, (req, res) => chatbotController.updateChatbot(req, res));
router.delete('/chatbots/:id', jwtAuth, (req, res) => chatbotController.deleteChatbot(req, res));
router.post('/chatbots/:id/toggle', jwtAuth, (req, res) => chatbotController.toggleChatbot(req, res));


// Integration sync endpoint
router.post('/sync-integrations', async (req, res) => {
  try {
    // ✅ TELEGRAM FIX: Múltiplas fontes para tenantId
    const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
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
    const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
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

export { router as omniBridgeRoutes };