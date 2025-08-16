import { Router } from 'express';

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

    // ✅ PROCESSING: Process with MessageIngestionService
    const { MessageIngestionService } = await import('../modules/omnibridge/infrastructure/services/MessageIngestionService');
    const { DrizzleMessageRepository } = await import('../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository');
    
    const messageRepository = new DrizzleMessageRepository();
    const ingestionService = new MessageIngestionService(messageRepository);
    
    const result = await ingestionService.processTelegramWebhook(webhookData, tenantId);

    // ✅ SUCCESS: Telegram expects 200 OK response
    return res.status(200).json({
      success: result.success,
      message: 'Webhook processed successfully',
      processed: result.processed,
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
import { Router } from 'express';
import { GlobalAutomationManager } from '../modules/omnibridge/infrastructure/services/AutomationEngine';

const router = Router();

/**
 * Webhook do Telegram para processar mensagens automaticamente
 */
router.post('/telegram/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const telegramData = req.body;

    console.log(`📨 [TELEGRAM-WEBHOOK] Received message for tenant: ${tenantId}`);
    console.log(`📨 [TELEGRAM-WEBHOOK] Data:`, JSON.stringify(telegramData, null, 2));

    // Verificar se é uma mensagem válida
    if (!telegramData.message || !telegramData.message.text) {
      console.log(`⏭️ [TELEGRAM-WEBHOOK] Ignoring non-text message`);
      return res.status(200).json({ ok: true });
    }

    // Processar através do sistema de automação
    const automationManager = GlobalAutomationManager.getInstance();
    const engine = automationManager.getEngine(tenantId);
    
    await engine.processMessage({
      type: 'telegram_message',
      content: telegramData.message.text,
      sender: telegramData.message.from?.username || telegramData.message.from?.first_name || 'telegram_user',
      channel: 'telegram',
      timestamp: new Date(telegramData.message.date * 1000).toISOString(),
      metadata: {
        chatId: telegramData.message.chat.id,
        messageId: telegramData.message.message_id,
        from: telegramData.message.from,
        chat: telegramData.message.chat
      }
    });

    console.log(`✅ [TELEGRAM-WEBHOOK] Message processed successfully`);

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ [TELEGRAM-WEBHOOK] Error processing Telegram message:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
