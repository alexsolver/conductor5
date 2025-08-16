import { Router } from 'express';
import { GlobalAutomationManager } from '../modules/omnibridge/infrastructure/services/AutomationEngine';

const router = Router();

console.log('🔧 [WEBHOOKS] Registering webhook routes (no authentication required)');

/**
 * Telegram Webhook Endpoint - Receive incoming messages
 * POST /api/webhooks/telegram/:tenantId
 */
router.post('/telegram/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const webhookData = req.body;

    console.log(`📨 [TELEGRAM-WEBHOOK] Received webhook for tenant: ${tenantId}`);

    // ✅ VALIDATION: Check if it's a valid Telegram webhook
    if (!webhookData.update_id) {
      console.log(`❌ [TELEGRAM-WEBHOOK] Invalid webhook data - missing update_id`);
      return res.status(200).json({
        success: false,
        message: 'Invalid Telegram webhook data'
      });
    }

    // ✅ PROCESSING: First try MessageIngestionService
    try {
      const { MessageIngestionService } = await import('../modules/omnibridge/infrastructure/services/MessageIngestionService');
      const { DrizzleMessageRepository } = await import('../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository');

      const messageRepository = new DrizzleMessageRepository();
      const ingestionService = new MessageIngestionService(messageRepository);

      const result = await ingestionService.processTelegramWebhook(webhookData, tenantId);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Webhook processed successfully via MessageIngestionService',
          processed: result.processed,
          timestamp: new Date().toISOString()
        });
      }
    } catch (ingestionError) {
      console.warn(`⚠️ [TELEGRAM-WEBHOOK] MessageIngestionService failed, trying AutomationEngine:`, ingestionError);
    }

    // ✅ FALLBACK: Try AutomationEngine if message contains text
    if (webhookData.message && webhookData.message.text) {
      console.log(`📨 [TELEGRAM-WEBHOOK] Processing through AutomationEngine`);

      const automationManager = GlobalAutomationManager.getInstance();
      
      // Garantir que as regras estejam atualizadas
      try {
        await automationManager.reloadEngineRules(tenantId);
        console.log(`🔄 [TELEGRAM-WEBHOOK] Rules reloaded for tenant: ${tenantId}`);
      } catch (reloadError) {
        console.warn(`⚠️ [TELEGRAM-WEBHOOK] Failed to reload rules:`, reloadError);
      }
      
      const engine = automationManager.getEngine(tenantId);

      await engine.processMessage({
        type: 'telegram_message',
        content: webhookData.message.text,
        sender: webhookData.message.from?.username || webhookData.message.from?.first_name || 'telegram_user',
        channel: 'telegram',
        timestamp: new Date(webhookData.message.date * 1000).toISOString(),
        metadata: {
          chatId: webhookData.message.chat.id,
          messageId: webhookData.message.message_id,
          from: webhookData.message.from,
          chat: webhookData.message.chat
        }
      });

      console.log(`✅ [TELEGRAM-WEBHOOK] Message processed successfully via AutomationEngine`);
    }

    // ✅ SUCCESS: Telegram expects 200 OK response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ [TELEGRAM-WEBHOOK] Error processing webhook:`, error);

    // ✅ CRITICAL: Always return 200 to Telegram to avoid retries
    return res.status(200).json({
      success: false,
      message: 'Webhook processing error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;