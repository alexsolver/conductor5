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
    const { telegramWebhookService } = await import('../services/TelegramWebhookService');

    console.log(`📨 [TELEGRAM-WEBHOOK] Received webhook for tenant: ${tenantId}`);
    console.log(`📨 [TELEGRAM-WEBHOOK] Webhook data:`, JSON.stringify(webhookData, null, 2));

    // Log webhook reception
    telegramWebhookService.logInfo(tenantId, 'Webhook received', { update_id: webhookData.update_id });

    // ✅ VALIDATION: Check if it's a valid Telegram webhook
    if (!webhookData.update_id) {
      console.log(`❌ [TELEGRAM-WEBHOOK] Invalid webhook data - missing update_id`);
      telegramWebhookService.logError(tenantId, 'Invalid webhook data - missing update_id');
      return res.status(200).json({
        success: false,
        message: 'Invalid Telegram webhook data'
      });
    }

    // ✅ CHECK MESSAGE: Verify if message exists
    if (!webhookData.message) {
      console.log(`❌ [TELEGRAM-WEBHOOK] No message in webhook data`);
      telegramWebhookService.logError(tenantId, 'No message in webhook data', { update_id: webhookData.update_id });
      return res.status(200).json({
        success: false,
        message: 'No message found in webhook'
      });
    }

    // Log message reception
    telegramWebhookService.logMessageReceived(tenantId, webhookData.message);

    // 🎯 SOLUTION: Use processTelegramMessage from tenantIntegrations
    // This function handles BOTH saving to inbox AND processing automation
    const { processTelegramMessage } = await import('./tenantIntegrations');
    
    try {
      console.log(`🤖 [TELEGRAM-WEBHOOK] Processing message through integrated pipeline`);
      await processTelegramMessage(tenantId, webhookData.message);
      console.log(`✅ [TELEGRAM-WEBHOOK] Message processed successfully with automation`);
      telegramWebhookService.logInfo(tenantId, 'Message processed successfully');
    } catch (processingError) {
      console.error(`❌ [TELEGRAM-WEBHOOK] Processing failed:`, processingError);
      telegramWebhookService.logError(tenantId, 'Message processing failed', { error: processingError instanceof Error ? processingError.message : 'Unknown error' });
      // Continue to return 200 to Telegram
    }

    // ✅ SUCCESS: Telegram expects 200 OK response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ [TELEGRAM-WEBHOOK] Error processing webhook:`, error);
    const { telegramWebhookService } = await import('../services/TelegramWebhookService');
    telegramWebhookService.logError(req.params.tenantId || 'unknown', `Webhook processing error: ${error.message}`);

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


/**
 * Debug endpoint to check messages in database
 * GET /api/webhooks/debug/messages/:tenantId
 */
router.get('/debug/messages/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    console.log(`🔍 [DEBUG-MESSAGES] Checking messages for tenant: ${tenantId}`);
    
    const { DrizzleMessageRepository } = await import('../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository');
    const messageRepository = new DrizzleMessageRepository();
    
    const messages = await messageRepository.findByTenant(tenantId, 10, 0);
    
    console.log(`🔍 [DEBUG-MESSAGES] Found ${messages.length} messages`);
    console.log(`🔍 [DEBUG-MESSAGES] Messages:`, JSON.stringify(messages, null, 2));
    
    res.json({
      success: true,
      count: messages.length,
      messages: messages
    });
    
  } catch (error) {
    console.error(`❌ [DEBUG-MESSAGES] Error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
