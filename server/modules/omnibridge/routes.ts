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

router.get('/inbox/stats', (req, res) => omniBridgeController.getInboxStats(req, res));

// Automation Rules (para implementação futura)
router.get('/automation-rules', (req, res) => {
  res.json({ success: true, rules: [], message: 'Automation rules not implemented yet' });
});

router.post('/automation-rules', (req, res) => {
  res.status(501).json({ error: 'Automation rules creation not implemented yet' });
});

// Templates (para implementação futura)
router.get('/templates', (req, res) => {
  res.json({ success: true, templates: [], message: 'Templates not implemented yet' });
});

router.post('/templates', (req, res) => {
  res.status(501).json({ error: 'Template creation not implemented yet' });
});

// Chatbots (para implementação futura)
router.get('/chatbots', (req, res) => {
  res.json({ success: true, chatbots: [], message: 'Chatbots not implemented yet' });
});

router.post('/chatbots', (req, res) => {
  res.status(501).json({ error: 'Chatbot creation not implemented yet' });
});

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